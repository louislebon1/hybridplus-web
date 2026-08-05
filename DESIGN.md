---
name: HybridPlus
description: A hybrid training tracker rendered as instrumentation — glass panes lit by a single blue signal on OLED black.
colors:
  arc-light: "#00ABFE"
  arc-light-deep: "#0090D8"
  arc-light-ink: "#002133"
  void: "#000000"
  bright-white: "#FFFFFF"
  ash: "#A1A1A6"
  slate-grey: "#6E6E73"
  dim-grey: "#48484A"
  glass-fill: "rgba(255, 255, 255, 0.06)"
  glass-fill-raised: "rgba(255, 255, 255, 0.10)"
  glass-rim: "rgba(255, 255, 255, 0.11)"
  complete-green: "#4ADE80"
  caution-amber: "#FB923C"
  alert-red: "#F0453A"
  zone-citrine: "#FDE047"
  zone-amber: "#FB923C"
  zone-red: "#F0453A"
  zone-violet: "#A855F7"
  zone-teal: "#2DD4BF"
typography:
  metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  display:
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: "2.375rem"
    letterSpacing: "-0.025em"
  h1:
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: "2.125rem"
    letterSpacing: "-0.022em"
  h2:
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "1.875rem"
    letterSpacing: "-0.02em"
  h3:
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.625rem"
    letterSpacing: "-0.018em"
  h4:
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: "1.5rem"
    letterSpacing: "-0.015em"
  body:
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "-0.01em"
  label:
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.125rem"
    letterSpacing: "-0.005em"
  prose:
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
    letterSpacing: "-0.005em"
  caption:
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
    letterSpacing: "0.005em"
  tag:
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: "0.875rem"
    letterSpacing: "0.02em"
rounded:
  pill: "9999px"
  card: "20px"
  inner: "16px"
  field: "12px"
spacing:
  gutter: "20px"
  card-padding: "16px"
  stack-tight: "8px"
  stack: "12px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.arc-light}"
    textColor: "{colors.arc-light-ink}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.arc-light-deep}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  card-glass:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.card}"
    padding: "16px"
  input-field:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.field}"
    height: "48px"
    padding: "0 16px"
  chip-segmented:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.ash}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
    typography: "{typography.caption}"
  chip-segmented-active:
    backgroundColor: "{colors.arc-light}"
    textColor: "{colors.arc-light-ink}"
  stat-tile:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.inner}"
    padding: "12px"
---

# Design System: HybridPlus

## Overview

**Creative North Star: "Night Training"**

The canvas is a 5am gym before the lights come up. Everything begins at true black, and the accent is the only light source in the room — glass panes catch it, bend it, and let it fall off into darkness. Depth is never drawn; it is a consequence of material sitting in front of light.

The register is premium, optical and calm. Nothing shouts. Hierarchy is carried by one enormous number, a great deal of black, and the restraint to leave everything else quiet. The system may push its material further than a utility app normally would — the glass and the atmospheric wash are deliberately expressive — but expression stops at the point it costs everyday legibility. This is used mid-set, one-handed, under fatigue, several times a week. It has to survive being boring to use.

The design is emphatically digital and emphatically refined. It borrows the physics of glass, not the appearance of gym equipment.

**Key Characteristics:**
- True black canvas with translucent glass surfaces that lens the light behind them
- One accent colour, used as illumination rather than decoration
- A single dominant metric per screen, at 68px, with everything else deferring to it
- Two type weights only — no intermediate hierarchy
- Colour in data visualisation is categorical and deliberately excludes blue
- Depth from material and blur; shadows only where something genuinely floats

## Colors

A monochrome field of true black and cool greys, interrupted by exactly one blue and a categorical ramp reserved for data.

### Primary
- **Arc Light** (`#00ABFE`): The single light source. Primary actions, the active navigation state, today's date, the selected chip, live values in a running session, and the glow behind a hero metric. It marks the one thing that matters on a screen and is worthless if spent anywhere else.
- **Arc Light Deep** (`#0090D8`): Hover and pressed states for Arc Light surfaces only.
- **Arc Light Ink** (`#002133`): Near-black navy for text and icons sitting *on* Arc Light. Chosen over white deliberately — white on this blue reaches only 2.5:1 and fails AA, while this clears 6.5:1.

### Neutral
- **Void** (`#000000`): The page. True black, not charcoal — it is what makes the glass and the accent glow read as light.
- **Bright White** (`#FFFFFF`): Primary text and headings.
- **Ash** (`#A1A1A6`): Secondary text — supporting sentences, sub-labels, inactive chip text.
- **Slate Grey** (`#6E6E73`): Tertiary text — uppercase section labels, units inside fields, captions, empty-state copy.
- **Dim Grey** (`#48484A`): Disabled text only.
- **Glass Fill** (`rgba(255,255,255,0.06)`): Every card and panel. Deliberately weak — the blur and the specular edge do the work; a heavier fill mutes the gradient behind and kills the material.
- **Glass Rim** (`rgba(255,255,255,0.11)`): Hairline dividers and row separators. Not used as a card border — see Elevation & Depth.

### Tertiary
The categorical ramp for distribution bars, zone charts and activity splits: **Citrine** (`#FDE047`), **Amber** (`#FB923C`), **Red** (`#F0453A`), **Violet** (`#A855F7`), **Teal** (`#2DD4BF`).

Semantic status colours are separate and non-negotiable in meaning: **Complete Green** (`#4ADE80`) for done, **Caution Amber** (`#FB923C`) for recovery warnings, **Alert Red** (`#F0453A`) for destructive actions and errors.

### Named Rules

**The One Light Rule.** Arc Light is illumination, not decoration. One accented element per viewport should be able to justify itself as *the* thing the user came to do. If two elements are both blue, one of them is wrong.

**The No Blue In Data Rule.** The categorical ramp excludes blue entirely. A chart series must never be mistakable for the brand accent, or "this is your data" and "this is the button" collapse into the same signal.

**The Green Means Done Rule.** Green is semantic, never brand. It marks completion and nothing else — it survived the accent's change from green to blue precisely because its meaning is independent of identity.

## Typography

**All roles:** San Francisco, via the system stack (`-apple-system`, `BlinkMacSystemFont`, then named `SF Pro Text` / `SF Pro Display`). SF Pro cannot be self-hosted under Apple's licence; the system stack is the only legitimate route, and it earns automatic optical sizing as a side effect — Text below ~20px, Display above.
**Mono:** `ui-monospace`, `SF Mono`, Menlo — used only for superset group labels.

**Character:** Neutral, native and unmannered. The typeface is not asked to carry personality; size, weight and colour carry the hierarchy, and the restraint to use only two weights is what makes the scale read as instrumentation rather than marketing.

### Hierarchy
- **Metric** (700, 68px, 1.0 line-height): The hero figure — week completion, session volume. One per screen, never two.
- **Display** (700, 32px/38px): Live values during a set — the weight, reps and RPE being logged.
- **H1** (700, 28px/34px): Large in-card figures, such as a fitness card's headline number.
- **H2** (700, 24px/30px): Screen titles and hero interpretation headings.
- **H3** (700, 20px/26px): Sub-screen titles and distribution percentages.
- **H4** (700, 18px/24px): Section headings and alphabetical dividers.
- **Body** (500, 16px/24px): Buttons, inputs, primary card titles.
- **Label** (500, 14px/18px): List row names, form labels — single-line text, where 18px is a box height rather than leading.
- **Prose** (500, 14px/20px): Supporting sentences that wrap. Same size as Label; the extra 2px of leading is what makes two and three-line copy readable against black.
- **Caption** (500, 12px/16px): Metadata, chip text, table values.
- **Tag** (500, 11px/14px, +0.02em, uppercase): Section eyebrows, badges, units inside fields, column headers.

### Named Rules

**The Two Weight Rule.** 700 for headings and focal metrics; 500 for everything else. There is no 400 and no 600. If something needs more emphasis, it needs more size, more contrast or more space — not another weight.

**The Tracking Follows The Size Rule.** Tracking is not one number — it opens as the type gets smaller, from −0.03em at 68px to +0.02em at 11px, crossing zero between 14px and 12px. Two reasons, and they compound. SF ships its own optical tracking that is negative only at display sizes and positive at caption sizes, so a single blanket value fights the face at one end of the scale or the other. And white text on true black optically bloats, so the small end needs air rather than compression. Large type is where tightening reads as intent; small type is where it reads as a defect. Never set one tracking value across the ramp.

**The List Is Not A Heading Rule.** Card titles, list rows and exercise names take 500, even at heading sizes. Bold is reserved for screen titles, section dividers and focal metrics — bolding a 200-row list flattens the hierarchy it was meant to create.

## Layout

Mobile-first and mobile-only in practice: a fixed `430px` maximum-width column, centred, with the black canvas continuing past it on wider viewports. There is no desktop layout — the design language scales but the composition does not reflow into columns.

Screens follow a consistent vertical score:

1. **Hero** — contextual line, focal metric, interpretation heading, supporting sentence
2. **Status card** — a single glass panel summarising state
3. **Timeline or summary** — the week strip, or the week × day training grid
4. **Sectioned content** — an uppercase tag label, then cards or rows
5. **Primary action** — pinned above the navigation
6. **Floating navigation** — overlapping the content, never in flow

Horizontal gutter is `20px` on recomposed screens (home, progress). Card padding is `16px`; internal stacks use `8px` within a group and `12px` between; sections separate by `28px`. Content scrolls beneath the navigation with `~92px` bottom clearance so the last card is never trapped under it.

### Named Rules

**The One Hero Rule.** Each screen earns exactly one 68px metric, at the top, over the gradient. A second competes with the first and both lose.

**The Proximity Rule.** The gap inside a group is always visibly smaller than the gap between groups. When those two values converge, grouping stops communicating.

## Elevation & Depth

This system does not draw depth — it renders material. Surfaces are **liquid glass**: a weak translucent fill over a heavily blurred, saturated and brightened backdrop, so a pane behaves like a lens over the atmospheric gradient rather than a tinted rectangle. Because the effect samples what is behind it, glass is most alive in the hero region and settles into a plain translucent fill further down the page. That falloff is correct behaviour, not a defect.

Edges are defined optically, not with a stroke: a bright specular highlight along the lit top edge, an inner bevel shadow opposite it, and a barely-there rim to hold the silhouette against black. Cards therefore carry **no border** — `border-color` is neutralised on glass surfaces, while dividers elsewhere keep theirs.

Shadows exist only where an element genuinely floats above content — the navigation pill today, and sheets, dialogs or popovers by the same logic. In-flow surfaces never cast one.

### Shadow Vocabulary
- **Glass edge** (`inset 0 1.5px 1px -1px rgba(255,255,255,0.55)`, `inset 0 -1.5px 1px -1px rgba(0,0,0,0.35)`, `inset 0 0 0 1px rgba(255,255,255,0.05)`): The specular top highlight, inner bevel and containment rim that together replace a border on every glass surface.
- **Float** (`0 8px 32px rgba(0,0,0,0.5)`): Separation for genuinely floating chrome. Navigation, sheets, dialogs, popovers.

### Named Rules

**The Material Not Shadow Rule.** Depth on an in-flow surface comes from blur, translucency and the specular edge. If a card needs a drop shadow to read, its material is wrong — fix the blur or the fill, not the elevation.

**The Floating Exception Rule.** Only elements that genuinely sit above the content plane may cast an outer shadow. Overlapping the scroll area is the test; being visually important is not.

## Shapes

Pills dominate. Every button, chip, stepper, day marker, badge and the navigation container is fully rounded (`9999px`) — by frequency this is the system's defining silhouette, and it is what keeps a dense, data-heavy interface from reading as a spreadsheet.

Rectangular surfaces use a generous, continuous-feeling radius: `20px` for primary cards, `16px` for nested tiles and compact rows, `12px` for input fields. Nothing in the system is square-cornered.

Iconography is Lucide line icons at 16–20px, plus a small set of exported SVGs for navigation. Activity types are represented by emoji rather than custom glyphs — a pragmatic choice that keeps 200 exercises and five cardio modes legible without an icon commission.

### Named Rules

**The Pill Default Rule.** If it is interactive and not a card, it is a pill. Reach for a rounded rectangle only when the element holds multi-line content.

## Components

### Buttons
- **Shape:** Fully rounded pill (`9999px`), `48px` tall at default and large sizes, `36px` small.
- **Primary:** Arc Light fill with Arc Light Ink text (`0 24px` padding). The one primary action per screen.
- **Secondary:** Transparent with a white hairline border and white text.
- **Ghost / Outline:** Transparent; ghost fills faintly on hover, outline carries an Arc Light border and text.
- **Danger:** Alert Red fill with white text, for destructive actions only.
- **States:** All variants press to `scale(0.97)` and fade slightly; hover lifts opacity to 90%. Focus is a 2px Arc Light ring at 50% with a 2px offset against the black canvas. Disabled drops to 40% opacity and suppresses the press-scale.

### Chips
- **Style:** Segmented control chips are pills with glass fill, hairline border and Ash text.
- **State:** The selected chip fills with Arc Light and switches to Arc Light Ink. Used for tab-like switching where the options are peers.

### Cards / Containers
- **Corner Style:** `20px` for primary cards, `16px` for compact tiles and list rows.
- **Background:** Glass Fill, with the backdrop treatment from Elevation & Depth.
- **Shadow Strategy:** None. Edges come from the specular inset set.
- **Border:** None on glass surfaces — deliberately neutralised.
- **Internal Padding:** `16px` standard, `12px` on compact tiles.
- **Interactive cards:** Cards that start something press to `scale(0.98)` and lighten to Glass Fill Raised. A card with no action never gains a hover state — the treatment is the affordance.

### Inputs / Fields
- **Style:** `48px` tall, `12px` radius, faint white fill, hairline border.
- **Focus:** Border shifts to Arc Light with a 2px Arc Light ring at 40%.
- **Error:** Border and ring switch to Alert Red, with the message in Alert Red beneath.
- **Numeric entry:** Native spinner arrows are suppressed system-wide. Values are entered by typing *or* by flanking stepper pills, and the unit sits inside the field as an uppercase tag with a matching-width spacer opposite, so the number stays optically centred as digits change.

### Navigation
- **Style:** A floating glass pill, `272px` wide, fixed above the bottom edge with `24px` clearance, overlapping content rather than sitting in flow. It is the one element permitted an outer shadow.
- **States:** Icon-only. The active destination fills with Arc Light and its icon flips to Arc Light Ink; inactive icons are white line icons.

### Signature Component — The Atmospheric Hero
The defining pattern. A large, soft radial wash bleeds from behind the focal metric and fades into black, built from two blurred radial layers with no clipping container and no black scrim — the gradients fade to transparent over the page's own black, which is what avoids a visible banding edge.

Its colour is **contextual, not fixed**: it reflects the state of the metric it sits behind — Arc Light when on track, Citrine when partial, Amber when behind, Teal when there is nothing scheduled. The hero is the only place in the system where colour is atmospheric rather than functional.

## Do's and Don'ts

### Do:
- **Do** keep exactly one 68px metric per screen, in the hero, over the gradient.
- **Do** spend Arc Light on the single most important element in a viewport and leave the rest monochrome.
- **Do** define card edges with the specular inset set (`inset 0 1.5px 1px -1px rgba(255,255,255,0.55)` and its pair), never a visible border.
- **Do** keep the glass fill weak (`0.06`). If a pane looks flat, increase the blur or check what is behind it — do not thicken the fill.
- **Do** use uppercase 11px tags at +0.02em for every section label, badge and in-field unit.
- **Do** give every interactive element a press state (`scale(0.97)` buttons, `scale(0.98)` cards) and a visible Arc Light focus ring.
- **Do** verify contrast when changing any colour that carries text. Arc Light takes Arc Light Ink, not white.
- **Do** design the empty state as the honest default — this product has no data to invent.

### Don't:
- **Don't** put blue in a chart series, a distribution bar or a zone ramp.
- **Don't** add a drop shadow to anything that sits in the content flow.
- **Don't** introduce a third font weight, or bold a list row, card title or exercise name.
- **Don't** use pure charcoal in place of true black for the canvas — the material depends on it.
- **Don't** add badges, streak confetti, trophy animation, congratulatory modals or any reward theatre.
- **Don't** reach for dense tables, grey chrome or default chart-library styling.
- **Don't** add neon glows, scanlines or sci-fi HUD framing — the gradient hero is the ceiling for atmospheric effect, not a floor.
- **Don't** imitate physical gym materials — no rubber, chalk, knurled metal or carbon fibre textures.
- **Don't** let expression cost everyday legibility. Any effect that makes a value harder to read mid-set, one-handed and fatigued has failed regardless of how good it looks in a screenshot.
