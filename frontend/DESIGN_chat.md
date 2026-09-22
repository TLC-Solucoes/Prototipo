---
name: Conversational Business Portal
colors:
  surface: '#fff8f1'
  surface-dim: '#e0d9d1'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ea'
  surface-container: '#f4ede5'
  surface-container-high: '#eee7df'
  surface-container-highest: '#e8e1d9'
  on-surface: '#1e1b17'
  on-surface-variant: '#3f4946'
  inverse-surface: '#33302b'
  inverse-on-surface: '#f7f0e7'
  outline: '#6f7976'
  outline-variant: '#bec9c5'
  surface-tint: '#1c695f'
  primary: '#00453d'
  on-primary: '#ffffff'
  primary-container: '#075e54'
  on-primary-container: '#8dd5c8'
  inverse-primary: '#8cd4c7'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#8cf1e1'
  on-secondary-container: '#006f64'
  tertiary: '#00471c'
  on-tertiary: '#ffffff'
  tertiary-container: '#006129'
  on-tertiary-container: '#3fe374'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a8f0e3'
  primary-fixed-dim: '#8cd4c7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#8ff4e3'
  secondary-fixed-dim: '#72d8c8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#66ff8e'
  tertiary-fixed-dim: '#3de273'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005322'
  background: '#fff8f1'
  on-background: '#1e1b17'
  surface-variant: '#e8e1d9'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 19px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 21px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14.2px
    fontWeight: '400'
    lineHeight: 19.5px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system translates the ubiquitous, hyper-familiar WhatsApp messaging interface into an authoritative, conversion-focused B2B landing experience. It bridges institutional trust with friction-free immediacy, targeting prospective enterprise and commercial clients seeking agile communication solutions.

The aesthetic direction unites **Corporate / Modern** precision with **Tactile Chat Realism**. Every touchpoint mirrors native WhatsApp Web and Mobile ergonomics—from the crisp dark emerald header down to the micro-textured wallpaper canvas. The interface elicits an immediate sense of reliability, speed, and approachability, dismantling standard landing page cognitive overhead by embedding the conversion funnel directly inside a dynamic, simulated conversational feed.

## Colors

The palette reproduces the definitive WhatsApp communication spectrum, anchored by deep brand greens, organic chat neutrals, and purposeful functional accents:

- **Primary (`#075E54`)**: The dominant authority tone. Applied across global app bars, primary desktop headers, and system-level accents.
- **Secondary (`#128C7E`)**: The active teal tone. Utilized for floating action buttons, focused chat controls, active tabs, and primary action text.
- **Tertiary (`#25D366`)**: The high-visibility conversion green. Reserved for critical calls to action, verified badges, live online presence rings, and trigger highlights.
- **Neutral (`#ECE5DD`)**: The iconic background canvas hue, serving as the foundational tint beneath the subtle sub-surface chat wallpaper pattern.
- **Speech Bubble Incoming (`#FFFFFF`)**: Pure crisp white with low-contrast neutral border for inbound system, agent, and bot responses.
- **Speech Bubble Outgoing (`#DCF8C6`)**: Muted pale lime for user messages and simulated outgoing interactions.
- **Status & Meta Accent (`#53BDEB`)**: The blue read-receipt checkmark indicator signaling message delivery and verification states.

## Typography

Typography relies exclusively on **Plus Jakarta Sans**, mimicking the humanist clarity and exceptional low-size legibility of modern native messaging typography on both Android and iOS systems.

- **Conversation Body (`body-md`)**: Calibrated specifically to `14.2px` with a compact `19.5px` line-height to maintain native messaging scanability without unnecessary vertical bloat.
- **Timestamp & Delivery Tokens (`label-sm`)**: Pinned at `11px` with relaxed letter tracking, ensuring non-intrusive metadata placement inside chat tails.
- **Header Profile Titles (`headline-md`)**: Crisp semi-bold weights that align with verified corporate brand signatures.
- **System Delimiters (`label-md`)**: Centered badge timestamps ("TODAY", "YESTERDAY", "END-TO-END ENCRYPTED") styled in medium weight with clean vertical clearance.

## Layout & Spacing

The layout utilizes a centered, single-viewport structure simulating an authentic communication terminal:

- **Desktop (>= 1024px)**: The interactive experience is centered within a simulated application shell spanning an optimal reading container (max-width `980px`, elevated height `88vh`), surrounded by a deep primary-toned ambient gradient envelope (`#0B141A` to `#075E54`).
- **Tablet (768px - 1023px)**: Centered column shell extending to `720px` width with `margin: 1.5rem`.
- **Mobile (< 768px)**: The interface shifts to an edge-to-edge, immersive webapp view (`100vw`, `100dvh`) without outer borders, fully occupying the mobile viewport.
- **Chat Feed Rhythm**: Sequential messages from the same sender cluster with `space-xs` (4px). Sender-to-receiver alternation enforces an `space-sm` (8px) break. Message blocks separated by system date badges enforce `space-lg` (16px).

## Elevation & Depth

Visual depth is achieved through flat architectural surfaces layered over atmospheric ambient drops, avoiding heavy artificial gradients:

- **App Canvas Elevation**: The centered desktop chat shell sits upon a structured shadow (`0 12px 32px -4px rgba(11, 20, 26, 0.28)`), granting realistic separation from the exterior environment.
- **Header Layer**: Flat `#075E54` surface accented with a discrete border separator (`rgba(0, 0, 0, 0.08)`) and zero blur shadow to simulate clean mobile software headers.
- **Speech Bubble Shading**: Subtly lifted using an ultra-low-offset ambient drop (`0 1px 1px rgba(11, 20, 26, 0.13)`), creating distinct separation from the textured `#ECE5DD` background wallpaper pattern.
- **Action Drawers & Quick Chips**: Floating above the message plane with a mild elevation of `0 2px 4px rgba(11, 20, 26, 0.12)`.

## Shapes

The design system employs **Soft (1)** geometry to capture the authentic curvature of WhatsApp components:

- **Speech Bubbles**: Curved with a `0.45rem` (7.5px) border radius. Bubbles feature directional corner notch cutoffs: incoming bubbles have a sharp top-left root, while outgoing bubbles have a sharp top-right root.
- **System Date Pills**: Capsule/pill curvature (`rounded-full`) to clearly differentiate static system info from conversational content.
- **Quick-Reply Cards & Action Triggers**: Border radius pinned to `0.5rem` (`rounded-lg`) for clean button delineation within message streams.
- **Chat Input Field**: Border radius set to `1.5rem` (`rounded-xl`) simulating the tactile iOS/Android text capsule.
- **Avatar & Verification Ring**: True circular silhouettes (`rounded-full`).

## Components

### 1. Chat Header Bar
- **Surface**: Solid `#075E54` background, `56px` mobile height, `64px` desktop height.
- **Avatar & Identity**: `40px` circular brand icon with a green online status dot (`8px`, `#25D366`) affixed to bottom-right edge.
- **Verified Business Badge**: Brand name in `#FFFFFF` accompanied by an inline official checkmark emblem (SVG badge filled with `#25D366` or WhatsApp business green).
- **Subline**: Green or soft-slate status ("Online" or "Responde instantaneamente") in `label-sm` (`#E9EDEF`).

### 2. Message Bubbles
- **Incoming**: Background `#FFFFFF`, text `#111B21`, aligned to `flex-start`, maximum width `82%`.
- **Outgoing**: Background `#DCF8C6`, text `#111B21`, aligned to `flex-end`, maximum width `82%`.
- **Message Meta**: Timestamp floated to bottom-right corner inside the bubble text flow in `#667781` (`11px`). Outgoing messages contain double-check marks (colored `#53BDEB` for read status).

### 3. Interactive Quick-Reply Chips & Action Buttons
- Contained within incoming message payloads as responsive vertical or horizontal stack lists.
- Full-width tap targets with pure white backgrounds (`#FFFFFF`), subtle dividers (`1px solid #E9EDEF`), and center-aligned action labels in `#128C7E` or `#00A884` with leading actionable icons.

### 4. Interactive Chat Input Dock
- Fixed bottom dock pinned to background canvas tint (`#F0F2F5` on desktop, `#EDEDED` on mobile).
- Input field styled as an expansive pill with pure white background (`#FFFFFF`), subtle interior padding (`8px 16px`), placeholder `"Digite uma mensagem..."` in `#8696A0`.
- Left-hand attachment / emoji triggers (`#54656F`), right-hand dynamic primary dispatch button (`#128C7E` circular send button with white forward glyph).

### 5. Chat Wallpaper Canvas
- Base fill of `#ECE5DD` overlaid with an SVG-based geometric line-art doodle pattern at `0.06` opacity to faithfully reproduce the WhatsApp chat background environment.