This repository contains sketches for rca demo for quality engineers and managers

## What's here

Clickable screen sketches for a root cause analysis (RCA) demo aimed at quality engineers (QEs) and quality managers (QMs) in SMT/PCB assembly. Evidence in investigations comes from the **RCA model** (a multilayer perceptron with a defect head and mechanism heads, explained with feature attribution), not from statistical tests.

The main story follows batch stg-B0003 of CTRL-BRD-A on the night shift of SMT line 2: a worn squeegee blade from 23:10 to 00:20 and the reflow oven on the wrong profile from 02:00 to 02:40 (61 boards with solder bridging), and an out-of-spec paste jar from 03:40 to 04:30 (31 boards with open circuit). A second investigation, INV-0143 (stg-B0005, day shift), has no parameter out of spec: squeegee speed sat near LSL from 10:20 to 12:30 and 23 boards had solder bridging.

| File | Screen | What it shows |
| --- | --- | --- |
| `sketches/Main.dc.html` | 1 · Line overview | Shift KPIs including model agreement, excursion alerts, defects by hour, batch table |
| `sketches/RcaPacket.dc.html` | 2 · RCA packet | Root causes linked by model attribution, what-if and predicted mechanism; model vs AOI matrix; unexplained boards; checked and not linked |
| `sketches/RcaNearLimit.dc.html` | 2b · RCA packet, in spec | INV-0143: mechanism seen in SPI with every setting in spec, the model links squeegee speed near LSL, predicted risk by squeegee speed |
| `sketches/Containment.dc.html` | 3 · Containment | Boards that passed inspection, held (High model risk) or reviewed (Medium) |
| `sketches/Board.dc.html` | 3a · Board detail | One board's model risk, predicted mechanism, attribution per parameter, what-if, parameter fingerprint, disposition, history |
| `sketches/Manager.dc.html` | 5 · Manager overview | Open investigations, repeat root causes, Failure Library summary |
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

## Linking model (v4: model evidence)

1. Engineers write Failure Library rules per mechanism (rule → mechanism), with a separate mechanism → defect link. Rules may use OR and are split automatically into **unit rules** joined only by AND, each keeping its parent rule. Rules supply the **path** and the **fix**.
2. The **RCA model** scores every board from its settings, materials and environment (not from measurements):
   - **Defect head:** predicted probability of no defect, solder bridging or open circuit.
   - **Mechanism heads:** predicted mechanism on the printing side and the reflow side.
   - **Feature attribution** on the defect head: how much each parameter moved the board's predicted risk compared with a typical in-spec board. A board with a defect is **attributed** to the unit rule whose parameters account for most of its risk.
   - **What-if:** the boards are re-scored with the root cause's parameters at nominal.
   - There are no per-parameter risk heads.
3. Three checks per unit rule:
   - Boards with the defect attributed to it: 20% or more.
   - Predicted mechanism matches the Failure Library path: on 50% or more of those boards.
   - Model agrees with inspection (AOI or electrical test) on the batch: 90% or more.
4. **Linked:** passes all three. **Contributing:** under 20% on its own, but the mechanism's root causes together reach 20%. **Checked and not linked:** shows what the model found (attributed boards and the what-if).
5. Only settings, materials and environment can be root causes. **Measurements** (SPI) are linked to mechanisms by *supported_by* and show as "Supported by" evidence, or as "{mechanism} seen without an out-of-spec root cause".
6. The model can link a root cause that stayed in spec (INV-0143). Charts shade a **near-limit zone**, the last 20% of the way from nominal to each limit, for reading only; it is not a check.
7. **Model vs inspection matrix** per defect: Confirmed (High risk, defect found), Hidden risk (High risk, passed), Unexplained (not High, defect found), Agree: no defect.
8. **Model risk bands:** High 5% or more, Medium 1–5%, Low under 1% predicted probability. Screens show the band; the percentage appears on hover until the model is calibrated on real line data.
9. **Containment:** boards that passed inspection with High model risk are held; Medium are reviewed; Low are released. Each board is counted once, under the root cause the model attributes most of its risk to.
10. No statistical tests (rate ratio, Fisher's exact test) appear on any screen.

## Wording templates

Every generated sentence on the screens comes from one of these templates, so the same fact is always said the same way. `{…}` is filled from data. The RCA packets build their text from them in code (`const T` in `sketches/RcaPacket.dc.html` and `sketches/RcaNearLimit.dc.html`).

**Vocabulary**

| Use | Not |
| --- | --- |
| `above USL` / `below LSL` for a direction; `out of spec` for either; `in spec`; `near USL` / `near LSL` for the shaded near-limit zone (still in spec) | above spec, above the limit, upper limit |
| `{start}–{end}` for a time window, e.g. `02:00–02:40` | between 02:00 and 02:40, from 02:00 to 02:40 |
| `boards with {defect}`, e.g. `boards with solder bridging` | bridged boards, bridges, opens |
| `root cause` (the parameter cause), `mechanism`, `defect` | cause, possible cause, signature |
| Spec as a range `{LSL}–{USL} {unit}`, or `≥ {min}` | nominal ± tolerance |
| `linked root cause #{n}`, `checked and not linked` | most likely cause, matches batch cause |
| `excursion` / `no excursion` | spike, cluster, in control (that is SPC language) |
| `model risk` with a band `High` / `Medium` / `Low` | probability, confidence, score |
| `attributes`, `attributed`, `what-if`, `predicted mechanism` | explains, SHAP value, counterfactual, mechanism head |
| `RCA model` | the AI, the MLP, the network |

**Status chip:** `Rule condition true · {n} boards` (or `In spec · near LSL on {n} boards` when the linked root cause stayed in spec)

**The three linking checks** (in "How this was calculated"):

- `Attributed: the model attributes {k} of {K} boards with {defect} ({pct}) to this root cause. Needs 20% or more.`
- `Predicted mechanism: {mechanism} on {k} of {K} attributed boards ({pct}). Needs 50% or more.`
- `Model agreement with {inspection} on {batch}: {pct}. Needs 90% or more.`

Plus: `What-if: with {parameter} ({nominal}) at nominal, predicted boards with {defect} fall from {a} to {b}.`

Stat boxes: `{k} of {K}` · Boards with {defect} the model attributes to this root cause; `{a} → {b}` · Predicted boards with {defect}, with {parameter} at nominal; `{k} of {K}` · Attributed boards where the predicted mechanism is {mechanism}.

Contributing: `Contributing: the model attributes {k} of {K} boards with {defect} ({pct}) to it on its own. Together with the other {mechanism} root causes: {k2} of {K} ({pct2}).`

Checked and not linked: `Attributed 0 boards with {defect}. With {parameter} at nominal, predicted boards with {defect}: {a} → {b}.` One whose condition was true on 0 boards shows `Measured {value or range} on {stencil ID | all {N} boards} (spec {spec}).`

Unexplained: `Unexplained: {k} of {K} boards with {defect}` · `{Inspection} found {defect}, but the model risk was Low and no parameter raised it.` · `Built {times}: not grouped in one window.` · `Check the {AOI images | electrical test logs}. If the defect is real, its cause is not among the model's inputs.`

Mechanism without an out-of-spec root cause: `{Mechanism} seen without an out-of-spec root cause` · `{Measurement} was {above USL} on {n} boards, while every setting was in spec.`

Supported by: `{Measurement} was {above USL} on {n} boards, {x} of them {where}.`

**Sentences**

| Where | Template |
| --- | --- |
| RCA summary | `{Parameter} was {above USL} {window}. The model attributes {k} of {K} boards with {defect} to it.` |
| Root causes checked | `{n} unit rules checked by the model · {m} linked · {c} contributing` |
| Model line | `Evidence from the RCA model. It agreed with {inspection} on {pct} of boards in this batch. Retrained on your line's data at onboarding.` |
| Evidence, out of spec | `{n} boards were {above USL} {window}: {parameter} {min}–{max} {unit} (spec {spec}).` |
| Evidence, attributed | `The model attributes {k} boards with {defect} built {window} to this root cause.` |
| Evidence, compound rule | `{n} boards met the rule condition {window}: {detail}.` |
| Trend note | `{Parameter} averaged {mean} {unit} outside {window} and reached {max} {unit} during it.` |
| Containment | `{n} boards passed {inspection} but have High model risk for {defect}: hold.` · `{n} more have Medium model risk: review before release.` |
| Containment scope check | `Also checked: other batches through {line} during {windows}: {none | list}.` |
| Line alert | `{K} boards with {defect}; the model attributes {k} to {root cause} ({window}). Root cause analysis is ready.` |
| Board banner | `Passed {inspections}, but the model risk for {defect} is High. {Parameter} was {above USL} ({value}, spec {spec}). Built {time}, during {window}: attributed to linked root cause #{n} of {investigation}.` |
| Board what-if | `With {parameter} at nominal ({nominal}), this board's model risk would be {band}.` |
| Suggested action | The root cause's **Fix** text from the Failure Library, word for word |

## Placeholders and assumptions

All numbers are story data, not output from the backend or the model. Before a real demo:

- The RCA model is to be rebuilt: trained on the expert's synthetic data, with a causal chain from settings to measurements to mechanism, and a realistic background defect rate. Attribution, what-if and agreement figures on the screens are illustrative.
- Peak reflow (245–255 °C) and paste viscosity (180–220 Pa·s) specs are assumed; ambient temperature and RH limits are `[your limit]`.
- Board counts, times, engineer names and traceability IDs (`[stencil ID]`, `[paste lot]`, `[recipe ID]`) are illustrative.
- The manager screen's time-to-root-cause baseline is `[your figure]`.

## Versions

- v1: the first full set of seven screens, commit `7abfa16` on branch `sketches-v1`.
- v2 (branch `sketches-v2`): rule-based linking with unit rules, contributing state and measurements as evidence; squeegee wear added to the story.
- v3 (branch `sketches-v3`): statistics only, no model output. Unexplained boards per defect, compared with batches with no excursion; near-limit investigation INV-0143 linked through near-limit rule variants.
- v4 (branch `sketches-v4`): evidence from the RCA model. The three checks become attributed boards, predicted mechanism and model agreement with inspection, with a what-if per root cause; board counts and statistical tests are removed. New model vs inspection matrix, risk-band containment (75 hold, 263 review for INV-0142; 26 hold, 657 review for INV-0143), attribution bars on board detail, a model risk curve for squeegee speed in INV-0143, and model agreement on the line overview. Near-limit rule variants are dropped; the model links in-spec root causes directly.
- v1.x: short-excursion story (reflow 02:00–02:40, paste viscosity 03:40–04:30).
- One investigation per batch excursion (INV-0142 for stg-B0003). 8D screens, report recommendation, investigation stages and overdue tracking are out of scope for this demo.
- Containment belongs to the investigation, and its scope follows the root cause, so other batches through the same line during the windows are checked too.
