---
name: Modern Dark Chat
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0d0e12'
  surface-container-low: '#1a1b1f'
  surface-container: '#1e1f23'
  surface-container-high: '#292a2e'
  surface-container-highest: '#343539'
  on-surface: '#e3e2e7'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e3e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#c2c1ff'
  on-secondary: '#1c0b9f'
  secondary-container: '#3834b6'
  on-secondary-container: '#b2b1ff'
  tertiary: '#ffb595'
  on-tertiary: '#571e00'
  tertiary-container: '#ef6719'
  on-tertiary-container: '#4c1a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006a'
  on-secondary-fixed-variant: '#3631b4'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#121317'
  on-background: '#e3e2e7'
  surface-variant: '#343539'
typography:
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  chat-text:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar_width: 280px
---

## Brand & Style
The design system is engineered for high-performance communication, blending a professional corporate aesthetic with energetic, vibrant accents. It prioritizes focus and clarity by utilizing a "lights-out" color palette that reduces eye strain while highlighting interactive elements with high-intensity color.

The visual style leans into **Modern Minimalism** with a touch of **Glassmorphism**. It relies on high-contrast text, generous negative space, and a refined use of depth to distinguish between the various layers of a multi-column chat environment. The emotional response is one of efficiency, security, and modern sophistication.

## Colors
The color palette is anchored by a deep, near-black background that provides the ultimate canvas for accessibility. 

- **Primary Action:** Vibrant Blue (#007AFF) is used exclusively for primary calls to action, active states, and "sent" message bubbles to provide a sense of energy and momentum.
- **Surface Strategy:** Surfaces are defined by increments of charcoal. Darker shades are used for the main background, while slightly lighter tones (#1C1C1E) define sidebar containers and input fields.
- **Accents:** Subtle gradients are used sparingly, specifically on active message bubbles, transitioning from a slightly deeper blue to the primary vibrant blue to create a sense of volume.

## Typography
This design system utilizes **Inter** for all typographic needs to ensure maximum legibility across different display sizes. The hierarchy is tight, with a focus on clear distinction between user names (bold), message content (regular), and timestamps (muted/smaller).

System fonts are prioritized for performance. Headlines use tighter letter spacing to maintain a modern, "compact" look, while body text—especially within chat bubbles—uses a generous line height of 1.4x to 1.5x to improve readability during long-form conversations.

## Layout & Spacing
The layout follows a **fixed-column grid** model designed for desktop and tablet interfaces. It consists of three primary zones: 
1. **Utility Navigation:** A narrow left-hand rail for global app icons.
2. **Conversation List:** A standard sidebar for active chat threads.
3. **Primary Workspace:** The fluid chat window that expands to fill the remaining horizontal space.

The spacing rhythm is built on an 8px base unit. Margins within chat bubbles are consistent (12px vertical, 16px horizontal) to create a "pill" aesthetic that feels balanced. Gutters between major layout sections are kept minimal to maximize content real estate.

## Elevation & Depth
Depth is communicated through **tonal layering** rather than traditional heavy shadows. Surfaces "lift" by becoming progressively lighter in color.

- **Level 0 (Background):** #0B0B0B (Deepest layer).
- **Level 1 (Sidebars/Inputs):** #1C1C1E.
- **Level 2 (Active States/Cards):** #2C2C2E.

**Ambient Shadows:** A very soft, diffused shadow (0px 8px 24px rgba(0,0,0,0.4)) is applied to floating elements like context menus or profile popovers. A subtle "outer glow" is used on primary blue bubbles to simulate light emission in the dark environment, using a low-opacity blue tint (#007AFF at 20% opacity).

## Shapes
The shape language of this design system is defined by extreme roundedness to evoke a friendly, modern feel. **Pill-shaped elements** are the standard for buttons, input fields, and tags.

Chat bubbles utilize a hierarchical corner radius: the outer corners use a large radius (18px-24px), while the "tail" corner (pointing to the user) is slightly tighter to provide directionality. Image attachments and cards within the chat follow a consistent `rounded-lg` (16px) or `rounded-xl` (24px) radius to match the bubble container.

## Components
- **Message Bubbles:** Outgoing messages use a vertical gradient (Primary Blue to a slightly darker shade) with white text. Incoming messages use a flat dark grey (#2C2C2E) with white text.
- **Buttons:** Primary buttons are full pill-shaped with high-contrast white icons or text on a Primary Blue background. Secondary buttons use a "Ghost" style with a 1px border.
- **Input Fields:** The main chat input is a large pill-shaped container with a subtle dark-grey fill. Icons for attachments and emojis are placed inside the container to maintain a clean silhouette.
- **Chips/Filters:** Used for "All Chats," "Unread," and "Groups" at the top of the sidebar. These are small pill-shaped buttons that toggle between a transparent background and a semi-transparent white/blue background when active.
- **Avatars:** Circular with a 2px border matching the background color to create "cutout" separation when overlapping with status indicators.
- **Scrollbars:** Custom-styled to be ultra-thin and dark grey, appearing only on hover to reduce visual noise.