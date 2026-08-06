---
name: HybridPlus
description: A hybrid training tracker rendered as instrumentation — monochrome, flat, and built around one enormous numeral on OLED black.
colors:
  arc-light: "#00ABFE"
  arc-light-deep: "#0090D8"
  arc-light-ink: "#002133"
  void: "#000000"
  bright-white: "#FFFFFF"
  ash: "#A1A1A6"
  slate-grey: "#6E6E73"
  dim-grey: "#48484A"
  fill-strong: "#FFFFFF"
  fill-strong-fg: "#000000"
  card-fill: "rgba(255, 255, 255, 0.07)"
  inset-fill: "rgba(255, 255, 255, 0.045)"
  hairline: "rgba(255, 255, 255, 0.12)"
  alert-red: "#F0453A"
  data-1: "rgba(255, 255, 255, 0.92)"
  data-2: "rgba(255, 255, 255, 0.72)"
  data-3: "rgba(255, 255, 255, 0.54)"
  data-4: "rgba(255, 255, 255, 0.38)"
  data-5: "rgba(255, 255, 255, 0.24)"
typography:
  metric:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "6rem"
    fontWeight: 700
    lineHeight: "5.5rem"
    letterSpacing: "-0.04em"
  display:
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: "2.75rem"
    letterSpacing: "-0.035em"
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
  card: "24px"
  inner: "12px"
  field: "12px"
spacing:
  gutter: "20px"
  card-padding: "16px"
  stack-tight: "8px"
  stack: "12px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.fill-strong}"
    textColor: "{colors.fill-strong-fg}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  card:
    backgroundColor: "{colors.card-fill}"
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
    backgroundColor: "{colors.card-fill}"
    textColor: "{colors.ash}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
    typography: "{typography.caption}"
  chip-segmented-active:
    backgroundColor: "{colors.fill-strong}"
    textColor: "{colors.fill-strong-fg}"
  stat-tile:
    backgroundColor: "{colors.card-fill}"
    textColor: "{colors.bright-white}"
    rounded: "{rounded.inner}"
    padding: "12px"
---

# Design System: HybridPlus

## Overview

**Creative North Star: "Night Training"**

The canvas is a 5am gym before the lights come up. Everything begins at true black, and what fills it is not light but *number* — the weight, the reps, the percentage of the week done, set at a scale that leaves no doubt what the screen is for. Training is counting, so the count is the interface.

The register is premium, optical and calm. Nothing shouts except the figure, and it shouts by being large rather than by being coloured. Hierarchy comes from scale, tonal value and inversion — a white plane against black — and from nothing else. This is used mid-set, one-handed, under fatigue, several times a week; it has to survive being boring to use, which is why the expressive load sits on typography rather than on material.

The design is emphatically digital and emphatically refined. It borrows the discipline of Swiss editorial typography and the flatness of a well-set timetable — not the appearance of gym equipment, and no longer the physics of glass.

**Key Characteristics:**
- True black canvas with flat tinted surfaces — no blur, no gradient, no glow anywhere
- Essentially monochrome; emphasis is a white plane with black type, never a colour
- One signal colour, spent only on live training and personal records
- A single dominant metric per screen at 96px, set solid, with everything else deferring to it
- Two type weights only — no intermediate hierarchy
- Data separates by tonal value, never by hue
- Icons are drawn at one stroke weight; no emoji anywhere in the interface

## Colors

Black, white, and the greys between them. The product is essentially monochrome: emphasis is carried by **inversion** and by **scale**, never by hue. One colour survives, and it is spent on one thing.

### Emphasis is inversion
- **Bright White** (`#FFFFFF`) on **Void** (`#000000`), and the same pair reversed. A primary action, a selected segment, the active tab and the single highlighted card are a white plane carrying black type. This is the move the reference makes with its black pill on a white ground; on a black ground it simply runs the other way.
- Because emphasis costs no colour, it can be spent freely and still read instantly. A screen may hold several white planes without becoming loud, where several coloured ones would fight.

### The one signal
- **Arc Light** (`#00ABFE`): reserved for **training that is happening right now**, and for a **personal record**. The rest timer's ring and a PR figure. That is the entire list. It appears nowhere else in the product — not on buttons, not on links, not on the active tab — which is exactly what makes a live session identifiable from across a gym.
- **Arc Light Ink** (`#002133`): text and icons sitting on Arc Light, where that pairing still occurs. White on this blue reaches only 2.5:1 and fails AA; this clears 6.5:1.

### Neutral
- **Void** (`#000000`): the page. True black, not charcoal.
- **Bright White** (`#FFFFFF`): primary text, headings, and every focal numeral.
- **Ash** (`#A1A1A6`): secondary text — supporting sentences, sub-labels, inactive chip text.
- **Slate Grey** (`#6E6E73`): tertiary text — uppercase section labels, units inside fields, captions.
- **Dim Grey** (`#48484A`): disabled text only.
- **Card Fill** (`rgba(255,255,255,0.07)`) and **Inset Fill** (`rgba(255,255,255,0.045)`): flat tints. They are the whole of a surface's material now, so they carry more weight than the old glass fill did — the blur and specular edge that used to do that work are gone.
- **Hairline** (`rgba(255,255,255,0.12)`): dividers, row separators, inset borders.

### Data
A tonal ramp, not a categorical one: white at **92% / 72% / 54% / 38% / 24%**. Series separate by value, the same way the numerals do. Calendar marks use the same ramp — strength solid, conditioning mid-tone, rest barely there.

**Alert Red** (`#F0453A`) is the sole exception to the monochrome rule, kept for destructive actions and errors. A delete confirmation rendered in grey is a defect, not restraint.

### Named Rules

**The One Signal Rule.** Arc Light means *live* — a session in progress, or a record just broken. Spending it on a button, a link or a selected state destroys the only thing it is for. When something needs emphasis and is not live, invert it.

**The No Colour In Data Rule.** Charts, distribution bars and calendar marks carry no hue at all. A series is distinguished by tonal value; if two series are hard to tell apart, the answer is more contrast between their values or a direct label, never a colour. Colour in a chart would compete with the one signal and both would lose.

**The Emphasis Is Inversion Rule.** The loudest thing available is a white plane with black type. Reach for it before reaching for anything else — it costs no colour, survives greyscale printing, and keeps the signal colour unspent.

## Typography

**All roles:** San Francisco, via the system stack (`-apple-system`, `BlinkMacSystemFont`, then named `SF Pro Text` / `SF Pro Display`). SF Pro cannot be self-hosted under Apple's licence; the system stack is the only legitimate route, and it earns automatic optical sizing as a side effect — Text below ~20px, Display above.
**Mono:** `ui-monospace`, `SF Mono`, Menlo — used only for superset group labels.

**Character:** Neutral, native and unmannered. The typeface is not asked to carry personality; size, weight and colour carry the hierarchy, and the restraint to use only two weights is what makes the scale read as instrumentation rather than marketing.

### Hierarchy
- **Metric** (700, 96px, 0.92 line-height, -0.04em): The hero figure. Set solid and tracked to the craft floor, because at this size the numeral *is* the composition — this is the single move the whole world is built around.
- **Display** (700, 40px/44px, -0.035em): Live values during a set, and the headline figure inside a full-width card.
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
2. **Status card** — a single flat panel summarising state
3. **Timeline or summary** — the week strip, or the week × day training grid
4. **Sectioned content** — an uppercase tag label, then cards or rows
5. **Primary action** — pinned above the navigation
6. **Floating navigation** — overlapping the content, never in flow

Every screen opens the same way, without exception:

- **Top inset** — `.screen-top`, which is `env(safe-area-inset-top) + 24px`. Never a hardcoded value: the status bar is black-translucent over a fit-to-cover viewport, so on device a flat number either clips under the clock or wastes a band below it.
- **Gutter** — `20px`, at screen level, on every screen. Card padding is a separate decision and stays `16px`.
- **Screen title** — the `h2` role, 24px/700, as the first element inside the header.

Beneath that, internal stacks use `8px` within a group and `12px` between; sections separate by `28px`.

Bottom clearance belongs to the tab shell alone (`NAV_CLEARANCE`, 80px on `main`). Screens must not add their own — the only legitimate per-screen clearance is for a screen's *own* fixed footer bar, which is `96px`.

### Named Rules

**The One Hero Rule.** Each screen earns exactly one 96px metric, at the top. A second competes with the first and both lose.

**The Same Door Rule.** Top inset, gutter and title role are identical on all eighteen screens. This is Operate mode and the app is opened one-handed between sets — the eye must land in the same place every time, so recognition is the affordance and variety is the defect. A screen whose content genuinely differs (the calendar's month, the home hero) still enters through the same door at the same size. Only the content below the title varies.

**The Shell Owns The Bottom Rule.** Clearance for the floating navigation is declared once, in the tabs layout. A screen that also pads its own scroll container stacks the two and strands the last card in dead space.

**The Proximity Rule.** The gap inside a group is always visibly smaller than the gap between groups. When those two values converge, grouping stops communicating.

## Elevation & Depth

**Nothing on this canvas blurs, glows or gradients.** Surfaces are flat tinted planes. Depth is tonal value and a hairline, and that is the entire vocabulary.

This replaced a liquid-glass system with an ambient accent atmosphere behind it. Both were competently built and both were removed on purpose: they were doing the job that scale and tone now do, and every one of them competed with the numerals for attention. On a screen whose whole argument is a 96px figure, a lens effect behind that figure is noise wearing craft's clothes. The reference this world was tuned against has no depth effects at all, and it does not need them.

Shadows exist only where an element genuinely floats above content — the navigation pill today, and sheets, dialogs or popovers by the same logic. In-flow surfaces never cast one.

### Shadow Vocabulary
- **Float** (`0 8px 32px rgba(0,0,0,0.5)`): Separation for genuinely floating chrome. Navigation, sheets, dialogs, popovers. It is the only shadow in the system.

### Named Rules

**The Flat Canvas Rule.** No `backdrop-filter`, no gradient fill, no glow, no inset specular edge, anywhere. If a surface is not reading, raise its fill or its hairline — do not reintroduce a material. This rule exists because the system has already been round that loop once.

**The Floating Exception Rule.** Only elements that genuinely sit above the content plane may cast an outer shadow. Overlapping the scroll area is the test; being visually important is not.

**The Three Tiers Rule.** Panel, Inset, Raised. A surface that fits none of them is a surface that has not been thought about. This system previously ran eight ad-hoc fills and eight radii, and the result was an app that felt assembled from several different products.

**The Pill Carries The Type Rule.** A card states its kind once, with its tag pill. It does not also get a coloured edge stripe, a tinted background and an icon saying the same thing. When a card needs to shout, remove the competing devices rather than adding a louder one.

## Shapes

Pills dominate. Every button, chip, stepper, day marker, badge and the navigation container is fully rounded (`9999px`) — by frequency this is the system's defining silhouette, and it is what keeps a dense, data-heavy interface from reading as a spreadsheet.

Rectangular surfaces use a generous, continuous-feeling radius: `20px` for primary cards, `16px` for nested tiles and compact rows, `12px` for input fields. Nothing in the system is square-cornered.

Iconography is Lucide line icons at 16–20px, plus a small set of exported SVGs for navigation. Activity types are represented by emoji rather than custom glyphs — a pragmatic choice that keeps 200 exercises and five cardio modes legible without an icon commission.

### Named Rules

**The Pill Default Rule.** If it is interactive and not a card, it is a pill. Reach for a rounded rectangle only when the element holds multi-line content.

## Components

### Buttons
- **Shape:** Fully rounded pill (`9999px`), `48px` tall at default and large sizes, `36px` small.
- **Primary:** White fill with black text (`0 24px` padding). The one primary action per screen. Emphasis is inversion — it never takes the signal colour.
- **Secondary:** Transparent with a white hairline border and white text.
- **Ghost / Outline:** Transparent; ghost fills faintly on hover, outline carries a white hairline border and white text.
- **Danger:** Alert Red fill with white text, for destructive actions only.
- **States:** All variants press to `scale(0.97)` and fade slightly; hover lifts opacity to 90%. Focus is a 2px Arc Light ring at 50% with a 2px offset against the black canvas. Disabled drops to 40% opacity and suppresses the press-scale.

### Chips
- **Style:** Segmented control chips are pills with a flat card fill, hairline border and Ash text.
- **State:** The selected chip fills white and switches to black type — the reference's black-pill-on-white, inverted for a dark ground. Used for tab-like switching where the options are peers.

### Cards / Containers

Three surface tiers, and nothing else. Every card in the app is one of them.

| Tier | Token | Radius | Material |
|---|---|---|---|
| **Panel** | `bg-bg-card` (7%) | `rounded-card` — 24px | Flat tint. No border, no blur. |
| **Inset** | `bg-bg-element` (4.5%) | `rounded-inner` — 12px | Flat tint + hairline. |
| **Raised** | `bg-bg-card-raised` (10%) | inherits | Flat tint. Hover and active state of a Panel. |

- **Panel** is a top-level surface sitting on the page. Its fill is the whole of its material, which is why it sits higher than the old glass fill did.
- **Inset** is anything living *inside* a Panel — rows, controls, form fields, small tiles.
- **Shadow Strategy:** None on either tier, ever.
- **Internal Padding:** `16px` standard, `12px` on compact tiles.
- **Interactive cards:** Cards that start something press to `scale(0.98)` and lighten to Raised. A card with no action never gains a hover state — the treatment is the affordance.

Radii come from `rounded-card` / `rounded-inner`, generated from the tokens in `@theme inline`. Never write an arbitrary radius; if a surface seems to need a third value, it is one of the two tiers and should say so.

### Inputs / Fields
- **Style:** `48px` tall, `12px` radius, faint white fill, hairline border.
- **Focus:** Border shifts to Arc Light with a 2px Arc Light ring at 40%.
- **Error:** Border and ring switch to Alert Red, with the message in Alert Red beneath.
- **Numeric entry:** Native spinner arrows are suppressed system-wide. Values are entered by typing *or* by flanking stepper pills, and the unit sits inside the field as an uppercase tag with a matching-width spacer opposite, so the number stays optically centred as digits change.

### Navigation
- **Style:** A floating pill, `272px` wide, fixed above the bottom edge with `24px` clearance, overlapping content rather than sitting in flow. It is the one element allowed a shadow. It is the one element permitted an outer shadow.
- **States:** Icon-only. The active destination fills white and its icon flips to dark; inactive icons are white line icons.

### Signature Component — The Focal Numeral
The defining pattern, and the one thing to protect above everything else. A single figure at 96px, weight 700, tracked to -0.04em and set solid at 0.92 line-height, sitting near the top of the screen with nothing competing beside it. Its unit or suffix rides small and high against it — "60" with a 24px "%" at cap height — so the number keeps the full optical weight and the unit never dilutes it.

Beneath it sit an interpretation heading and one line of supporting prose, both dramatically smaller. The drop from 96px to 24px to 14px is the whole hierarchy; there is no intermediate step and no decoration between them.

This replaced an atmospheric gradient hero. The wash was doing what scale does better, and it competed with the very figure it was meant to frame. If a hero looks weak, the numeral is too small or the space around it is too tight — the fix is never to put something behind it.

## Do's and Don'ts

### Do:
- **Do** keep exactly one 96px metric per screen, at the top, with clear space around it.
- **Do** make things important by inverting them — a white plane with black type — before considering anything else.
- **Do** keep Arc Light for live training and personal records only. If it is not happening right now, it is not blue.
- **Do** separate chart series by tonal value, and label them directly.
- **Do** draw icons from lucide at `strokeWidth={1.75}`, taking colour from their container.
- **Do** use uppercase 11px tags at +0.02em for every section label, badge and in-field unit.
- **Do** give every interactive element a press state (`scale(0.97)` buttons, `scale(0.98)` cards) and a visible white focus ring.
- **Do** verify contrast when changing any colour that carries text.
- **Do** design the empty state as the honest default — this product has no data to invent.

### Don't:
- **Don't** put any colour in a chart series, a distribution bar or a calendar mark.
- **Don't** reintroduce glass, backdrop blur, gradient fills or ambient glows. The system has been round that loop and came back.
- **Don't** use an emoji as an icon, anywhere, ever.
- **Don't** add a drop shadow to anything that sits in the content flow.
- **Don't** introduce a third font weight, or bold a list row, card title or exercise name.
- **Don't** use pure charcoal in place of true black for the canvas — the material depends on it.
- **Don't** add badges, streak confetti, trophy animation, congratulatory modals or any reward theatre.
- **Don't** reach for dense tables, grey chrome or default chart-library styling.
- **Don't** add neon glows, scanlines or sci-fi HUD framing. There is no atmospheric effect in this system at all.
- **Don't** imitate physical gym materials — no rubber, chalk, knurled metal or carbon fibre textures.
- **Don't** let expression cost everyday legibility. Any effect that makes a value harder to read mid-set, one-handed and fatigued has failed regardless of how good it looks in a screenshot.
