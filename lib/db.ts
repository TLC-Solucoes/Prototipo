import 'server-only'
import { neon } from '@neondatabase/serverless'
import type { AdminRow, Conversation, Message, Role, Summary } from '@/lib/types'

const sql = neon(process.env.DATABASE_URL!)

export async function createConversationWithinLimit(
  ipHash: string,
  perHour: number,
): Promise<string | null> {
  const rows = await sql`
    insert into conversation (ip_hash)
    select ${ipHash}
     where (select count(*) from conversation
             where ip_hash = ${ipHash} and created_at > now() - interval '1 hour') < ${perHour}
    returning id
  `
  return rows.length > 0 ? (rows[0].id as string) : null
}

export async function appendUserMessageWithinLimit(
  conversationId: string,
  content: string,
  maxMessages: number,
): Promise<boolean> {
  const rows = await sql`
    insert into message (conversation_id, role, content)
    select ${conversationId}, 'user', ${content}
     where (select count(*) from message
             where conversation_id = ${conversationId} and role = 'user') < ${maxMessages}
    returning id
  `
  if (rows.length === 0) return false
  await sql`update conversation set updated_at = now() where id = ${conversationId}`
  return true
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const rows = await sql`
    select id, created_at, status, contact_name, contact_email, contact_phone,
           summary, summary_updated_at, summary_input_hash
      from conversation where id = ${id}
  `
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    id: r.id,
    createdAt: new Date(r.created_at),
    status: r.status,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    summary: r.summary as Summary | null,
    summaryUpdatedAt: r.summary_updated_at ? new Date(r.summary_updated_at) : null,
    summaryInputHash: r.summary_input_hash,
  }
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = await sql`
    select id, role, content, incomplete, created_at
      from message where conversation_id = ${conversationId} order by id asc
  `
  return rows.map((r) => ({
    id: Number(r.id),
    role: r.role as Role,
    content: r.content,
    incomplete: r.incomplete,
    createdAt: new Date(r.created_at),
  }))
}

export async function appendMessage(
  conversationId: string,
  role: Role,
  content: string,
  incomplete = false,
): Promise<void> {
  await sql`
    insert into message (conversation_id, role, content, incomplete)
    values (${conversationId}, ${role}, ${content}, ${incomplete})
  `
  await sql`update conversation set updated_at = now() where id = ${conversationId}`
}

export async function countRecentConversations(
  ipHash: string,
  withinMinutes: number,
): Promise<number> {
  const rows = await sql`
    select count(*)::int as n from conversation
     where ip_hash = ${ipHash}
       and created_at > now() - make_interval(mins => ${withinMinutes})
  `
  return rows[0].n as number
}

export async function countUserMessages(conversationId: string): Promise<number> {
  const rows = await sql`
    select count(*)::int as n from message
     where conversation_id = ${conversationId} and role = 'user'
  `
  return rows[0].n as number
}

export async function saveSummary(
  conversationId: string,
  summary: Summary,
  inputHash: string,
): Promise<void> {
  const { nome, email, telefone } = summary.contato
  const status = nome || email || telefone ? 'com_contato' : 'aberta'
  await sql`
    update conversation
       set summary = ${JSON.stringify(summary)}::jsonb,
           summary_updated_at = now(),
           summary_input_hash = ${inputHash},
           contact_name = coalesce(${nome}, contact_name),
           contact_email = coalesce(${email}, contact_email),
           contact_phone = coalesce(${telefone}, contact_phone),
           status = case when ${status} = 'com_contato' then 'com_contato' else status end
     where id = ${conversationId}
  `
}

export async function listConversations(limit: number): Promise<AdminRow[]> {
  const rows = await sql`
    select c.id, c.created_at, c.status, c.contact_name, c.contact_email,
           c.contact_phone, c.summary ->> 'dorPrincipal' as dor_principal,
           c.summary is not null as tem_resumo,
           (c.summary_updated_at is null
            or c.updated_at > c.summary_updated_at) as desatualizado,
           (select count(*)::int from message m where m.conversation_id = c.id) as message_count
      from conversation c
     order by c.updated_at desc
     limit ${limit}
  `
  return rows.map((r) => ({
    id: r.id,
    createdAt: new Date(r.created_at),
    status: r.status,
    contactName: r.contact_name,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    dorPrincipal: r.dor_principal,
    messageCount: r.message_count,
    temResumo: r.tem_resumo,
    desatualizado: r.desatualizado,
  }))
}

export async function claimSummarySlot(
  conversationId: string,
  cooldownSeconds: number,
): Promise<boolean> {
  const rows = await sql`
    update conversation set summary_updated_at = now()
     where id = ${conversationId}
       and (summary_updated_at is null
            or summary_updated_at < now() - make_interval(secs => ${cooldownSeconds}))
    returning id
  `
  return rows.length > 0
}
