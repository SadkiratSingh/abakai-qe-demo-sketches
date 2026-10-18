This repository contains sketches for rca demo for quality engineers and managers

## What's here

Clickable screen sketches for a root cause analysis (RCA) demo aimed at quality engineers (QEs) and quality managers (QMs) in SMT/PCB assembly. The story follows batch stg-B0003 of CTRL-BRD-A on the night shift of SMT line 2: the reflow oven ran on the wrong profile from 02:00 to 02:40 (solder bridging), and an out-of-spec paste jar was used from 03:40 to 04:30 (open circuits).

| File | Screen | What it shows |
| --- | --- | --- |
| `sketches/Main.dc.html` | 1 · Line overview | Shift KPIs, excursion alerts, defects by hour, batch table |
| `sketches/RcaPacket.dc.html` | 2 · RCA packet | Recommended report for the investigation, linked root causes per defect with the three checks, root causes checked and not linked, spec trend, suggested action |
| `sketches/Containment.dc.html` | 3 · Containment | Boards that passed inspection but were built out of spec, by location |
| `sketches/Board.dc.html` | 3a · Board detail | One board's linked root cause, model confidence, parameter fingerprint, same-panel boards, disposition, history |
| `sketches/Manager.dc.html` | 5 · Manager overview | Open investigations with their recommended report, repeat root causes, overdue actions |
| `sketches/Library.dc.html` | 6 · Failure Library | Root cause → mechanism → defect knowledge, with specs and fixes |

`sketches/canvas.json` holds the canvas layout (artboard positions, sizes and order).

## Opening the sketches

There are two copies of the screens:

- **`sketches/`** is the source. The `.dc.html` files are Design Component artboards that render inside the Claude Design canvas, which supplies `support.js`; opened directly in a browser they show unstyled template markup. The live canvas is the Claude artifact "RCA Studio – QE Screens".
- **`html/`** holds standalone static pages generated from the sketches. Open `html/index.html` in any browser to click through every screen, or import the pages into Figma with an HTML-import plugin such as html.to.design. Interactive states are exported as separate pages (for example `rca-packet-open-circuit.html`), and the tabs link between them.

Edit `sketches/`, never `html/`. After changing the sketches, regenerate the pages:

```
cd tools
npm install
npm run export
```

## Wording templates

Every generated sentence on the screens comes from one of these templates, so the same fact is always said the same way. `{…}` is filled from data. The RCA packet builds its text from them in code (`const T` in `sketches/RcaPacket.dc.html`).

**Vocabulary**

| Use | Not |
| --- | --- |
| `above USL` / `below LSL` for a direction; `out of spec` for either; `in spec` | above spec, above the limit, upper limit |
| `{start}–{end}` for a time window, e.g. `02:00–02:40` | between 02:00 and 02:40, from 02:00 to 02:40 |
| `boards with {defect}`, e.g. `boards with solder bridging` | bridged boards, bridges, opens |
| `root cause` (the parameter cause), `mechanism`, `defect` | cause, possible cause, signature |
| Spec as a range `{LSL}–{USL} {unit}`, or `≥ {min}` | nominal ± tolerance |
| `linked root cause #{n}`, `checked and not linked` | most likely cause, matches batch cause |
| `excursion` / `no excursion` | spike, cluster, in control (that is SPC language) |
| `model confidence` for the per-board model score only | risk, probability |

**Status chip:** `{Above USL | Below LSL} · {n} boards` or `In spec`

**The three linking checks** (also the labels of the stat boxes):

- `{Defect} rate, out of spec vs in spec: {a}% vs {b}% ({ratio}×). Needs 2× or more.`
- `Fisher's exact test: p {value}. Needs p < 0.01.`
- `Boards with {defect} that were out of spec: {k} of {K} ({pct}%). Needs 20% or more.`

A root cause checked and not linked shows the first check it failed, in the same words. One that is in spec shows:
`Measured {value or range} on {stencil ID | all {N} boards} (spec {spec}).`

**Sentences**

| Where | Template |
| --- | --- |
| RCA summary | `{Parameter} was {above USL} {window}. {k} of {K} boards with {defect} were built {window}.` |
| Root causes checked | `{n} root causes checked · {m} linked` |
| Evidence, out of spec | `{n} boards were {above USL} {window}: {parameter} {min}–{max} {unit} (spec {spec}).` |
| Evidence, in window | `{k} of {K} boards with {defect} were built {window}.` |
| Evidence, outside window | `Outside {window}: {parameter} averaged {mean} {unit}; {k} boards with {defect}.` |
| Overlap note | `{x} of these {n} boards were also {above USL} on {parameter}. Likely an effect of #1, not a separate root cause.` |
| Trend note | `{Parameter} averaged {mean} {unit} outside {window} and reached {max} {unit} during it.` |
| Containment | `{n} boards built {window} passed {AOI | electrical test} but were {above USL} on {parameter}.` |
| Containment, each further linked root cause | `{n} more boards passed {inspection} but were {below LSL} on {parameter}.` |
| Line alert | `{K} boards with {defect}; {k} of {K} built {window}. Root cause analysis is ready.` |
| Board banner | `Passed {inspections}, but {parameter} was {above USL} ({value}, spec {spec}). Built {time}, during {window}: matches linked root cause #{n} of {investigation}.` |
| Suggested action | The root cause's **Fix** text from the Failure Library, word for word |
| Report trigger | `{Trigger}: {value}` with a `Met` / `Not met` chip, e.g. `Boards shipped: 8 at-risk boards shipped before containment` |
| Recommended report | `8D` (`{k} of {n} triggers met`) or `Internal corrective action` (`No triggers met`) |

## Placeholders and assumptions

All numbers are story data, not output from the backend. Before a real demo:

- Peak reflow (245–255 °C) and paste viscosity (180–220 Pa·s) specs are assumed; ambient temperature and RH limits are `[your limit]`.
- Confidence percentages, board counts, times, engineer names and traceability IDs (`[stencil ID]`, `[paste lot]`, `[recipe ID]`) are illustrative.
- The manager screen's time-to-root-cause baseline is `[your figure]`.

## Versions

- v1: the first full set of seven screens, commit `7abfa16` on branch `sketches-v1`.
- v2: short-excursion story (reflow 02:00–02:40, paste viscosity 03:40–04:30). The RCA packet separates each parameter's status (out of spec, with a board count, or in spec) from whether it is linked to the defect (≥2× more likely, under 1% chance of coincidence, explains ≥20% of defective boards), lists every other root cause as checked and not linked, and the other screens use the same numbers.
- One investigation per batch excursion (INV-0142 for stg-B0003). The 8D screens were dropped from the demo; instead each investigation gets one recommended report: 8D when any trigger is met (boards shipped, customer complaint, same root cause on the same line in the last 90 days), otherwise internal corrective action.
- Containment holds every board that was out of spec on any linked root cause and has not already failed a test, counted once under its first linked root cause.
