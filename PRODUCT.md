# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single user — the author — training solo. The app is currently a **proof of concept**, not a product with an audience.

Whether it ever opens to other athletes is explicitly undecided. Until it does, nothing should assume multiple users, accounts, cold-start onboarding, or a support surface. The user already knows how every screen works.

Situation of use: on a phone, in a gym, mid-session — the screen is woken repeatedly between sets, often one-handed, while fatigued.

## Product Purpose

Plan and execute hybrid training — strength and conditioning together — in one place, and keep an honest record of what was actually lifted and run.

Success is that a planned training week can be followed and logged entirely in the app, without a parallel spreadsheet or notes file.

## Positioning

Treats lifting and conditioning as **one training load**, rather than a lifting app with cardio bolted on. Programmes, the calendar, the session picker, and progress all handle strength and cardio as peers rather than making one a second-class citizen of the other.

## Operating Context

- A programme is built ahead of time — phases, then sessions, then exercises with day-of-week assignments — and synced to the calendar. Day-to-day execution then runs from the home screen.
- Cardio is either scheduled as a session or logged after the fact.
- Logging happens between sets, in short bursts, under fatigue. Entry speed and glanceability matter more than density.
- Weights are in kilograms. Dates are en-GB.
- Vocabulary: *programme* (not "program"), *phase*, *session* (not "workout") in the data model, *template*, *block*.

## Capabilities and Constraints

**Confirmed functionality**

- Programmes made of ordered phases (`foundation`, `build`, `peak`, `deload`, `recovery`), each with per-exercise overrides including an intensity percentage; deload phases can be generated from the preceding phase.
- A global session-template library (strength and cardio) that exists separately from programme-owned templates. Library templates are copied into a phase when assigned.
- Calendar with programme sync, per-day events, and completion state.
- Active session logging: weight / reps / RPE per set, estimated 1RM, rest timer, exercise swap with substitution tracking, supersets, automatic ramping warm-up sets on **compound lifts only**, and a last-time reference drawn from history.
- Progress: personal records, weekly volume, volume distribution by muscle group, cardio stats, streak, and a consecutive-training-week deload heuristic.
- Body metrics: height, weight log with history, derived BMI.

**Constraints**

- **No backend, no authentication, no API routes.** All state persists to six localStorage keys: `hp-programme`, `hp-session-templates`, `hp-session-history`, `hp-calendar`, `hp-cardio`, `hp-body-metrics`. This is a deliberate, durable decision — future work must not assume a server or introduce one without an explicit product change.
- Consequence of local-only storage: clearing site data destroys all training history irrecoverably. **There is currently no export, backup, or import path.** *(Open decision — not yet addressed.)*
- One active programme at a time, enforced by the presence of a start date.
- Kilograms only. No unit conversion exists; the Profile → Units row is display-only and inert.
- Single-device by definition — no sync, so history does not follow the user between browsers or devices.

## Brand Commitments

- Name: **HybridPlus**.
- Wordmark: inline SVG on the home screen — "HYBRID" in the text colour with an accent-coloured "+" mark.
- No other confirmed brand assets, voice guidelines, or identity constraints exist.

## Evidence on Hand

- **Exercise library** — 200 real entries in `src/lib/exercise-library.ts`, each with muscle group, equipment, movement pattern, compound/isolation classification, difficulty, and recommended rep and RPE ranges. This is genuine product data, not placeholder content, and several features key off it.
- **Prescription rules** — `src/lib/phase-rules.ts` maps phase type × training focus × compound/isolation to default sets, reps and RPE.
- **No users, testimonials, benchmarks, pricing, case studies, press, or usage data exist.** Future work must not fabricate any of these, and must not imply an install base or results the product has never had.

## Product Principles

1. **Strength and cardio are peers.** Any feature that treats one as the "real" training and the other as an afterthought contradicts the product's only differentiator.
2. **The record must be honest.** Never display, imply, or seed training data the user did not actually log. An empty state is correct; a plausible-looking fake one is a defect.
3. **Built for the moment between sets.** The primary interaction happens one-handed, fatigued, mid-session. Speed of entry and legibility at a glance outrank information density.
4. **Local-first is a constraint to design around, not paper over.** No feature may quietly depend on a server, and the absence of backup is a known risk to be addressed, not hidden.
5. **It is a proof of concept, not a shipped product.** Depth of the training model is worth more than breadth of audience-facing features until the audience question is actually answered.

## Accessibility & Inclusion

No user-specific accessibility requirement has been established.

One durable commitment does exist in the codebase: colour contrast was deliberately corrected to meet **WCAG 2.1 AA**, including the foreground used on the accent colour. Future palette changes must re-verify contrast rather than regress it.
