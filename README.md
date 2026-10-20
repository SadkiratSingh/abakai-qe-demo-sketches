This repository contains sketches for rca demo for quality engineers and managers

## What's here

Clickable screen sketches for a root cause analysis (RCA) demo aimed at quality engineers (QEs) and quality managers (QMs) in SMT/PCB assembly. Evidence in investigations comes from the **RCA model** (a multilayer perceptron with a defect head and mechanism heads, explained with feature attribution), not from statistical tests.

The main story follows batch stg-B0003 of CTRL-BRD-A on the night shift of SMT line 2: a worn squeegee blade from 23:10 to 00:20 and the reflow oven on the wrong profile from 02:00 to 02:40 (61 boards with solder bridging), and an out-of-spec paste jar from 03:40 to 04:30 (31 boards with open circuit). A second investigation, INV-0143 (stg-B0005, day shift), has no parameter out of spec: squeegee speed sat near LSL from 10:20 to 12:30 and 23 boards had solder bridging.

| File | Screen | What it shows |
| --- | --- | --- |
| `sketches/Main.dc.html` | 1 · Line overview | Shift KPIs including model agreement, excursion alerts, defects by hour, batch table |
| `sketches/RcaPacket.dc.html` | 2 · Investigation (INV-0142) | Top 3 root cause chains per defect with board counts, when they appeared and the fix; other chains; no chain found; model vs AOI matrix; side panel with each board's RCA packet |
| `sketches/RcaNearLimit.dc.html` | 2b · Investigation, in spec (INV-0143) | Same template as INV-0142: one chain, low squeegee speed near LSL and in spec |
| `sketches/Containment.dc.html` | 3 · Re-inspection | Boards where the RCA model and inspection disagree: re-inspect (inspection passed, model predicts a defect) and verify the call (inspection failed, model predicts no defect). Exported as `re-inspection.html` |
| `sketches/Board.dc.html` | 3a · Board RCA packet (full page) | One board's model prediction and inspection result, mechanisms, contribution per parameter, what-if, parameter fingerprint, disposition, history |
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

## Root cause chains (v5)

1. **Per board:** for every board, the RCA model (defect head and mechanism heads) predicts the defect and the mechanisms, and feature attribution finds the parameters that raised the board's risk. The Failure Library, the cause-and-effect (Ishikawa) ontology, turns each of those parameters into a **root cause chain**: root cause → mechanism → defect. Chains below the display threshold (τ = 0.60) are left out.
2. **Per batch:** the investigation groups boards by chain and shows the **top 3** chains per defect, ranked by how many boards with the defect show them. The rest are under "Other chains". Boards with no chain are listed under "No root cause chain found".
3. **A board can show more than one chain**, so the counts across chains can add up to more than the number of boards with the defect.
4. **Each chain card** shows: the chain; boards with the defect that show it; boards that passed inspection and show it (the re-inspection list); when it appeared (time window, material lot, or "spread across the shift") with a small trend line of the root cause parameter; the Failure Library fix; and View boards / Reject / **Confirm chain**, which records the QE's decision.
5. **View boards** opens a side panel: the boards with the chain, and the selected board's **RCA packet** (defect and mechanisms with risk bands, the board's chains ranked by **contribution**, the evidence value against spec, any supporting measurement, an interpretation, and the assessment time, model version and τ). Previous/next move through the boards; "Open full page" opens the board's full packet.
6. **Contribution** is the share of a board's predicted risk that comes from the root cause (feature attribution). There are no per-parameter risk heads and no statistical tests.
7. **Model vs inspection matrix** per defect: Confirmed, Hidden risk (re-inspect), Unexplained (the no-chain boards: verify the inspection call), Agree: no defect.
8. **Model prediction is a class, not a band:** for each board the RCA model predicts no defect, solder bridging or open circuit, and per side the mechanism or none. This lines up with AOI and electrical test, which also give a class, so the model vs inspection matrix is a plain 2×2. How a probability becomes a class (highest class, or a threshold) is a backend setting.
9. Only settings, materials and environment can be root causes. Measurements (SPI) appear as supporting measurements. A root cause that stayed in spec is named with "(in spec, near LSL)".

## Wording templates

Every generated sentence on the screens comes from one of these templates, so the same fact is always said the same way. `{…}` is filled from data. The investigation screens build their text from them in code (`const T` in `sketches/RcaPacket.dc.html`; `sketches/RcaNearLimit.dc.html` is generated from the same template).

**Vocabulary**

| Use | Not |
| --- | --- |
| `above USL` / `below LSL` for a direction; `out of spec` for either; `in spec`; `near USL` / `near LSL` for the shaded near-limit zone (still in spec) | above spec, above the limit, upper limit |
| `{start}–{end}` for a time window, e.g. `02:00–02:40` | between 02:00 and 02:40, from 02:00 to 02:40 |
| `boards with {defect}`, e.g. `boards with solder bridging` | bridged boards, bridges, opens |
| `root cause` (the parameter cause), `mechanism`, `defect` | cause, possible cause, signature |
| Spec as a range `{LSL}–{USL} {unit}`, or `≥ {min}` | nominal ± tolerance |
| `chain #{n}`, `other chains`, `no root cause chain found` | most likely cause, linked, contributing |
| `re-inspection`, `re-inspect`, `verify the call` (boards where the model and inspection disagree) | containment, hold, quarantine, customer notification: in a factory these mean product held because inspection found it bad |
| `excursion` / `no excursion` | spike, cluster, in control (that is SPC language) |
| `Model: {defect class}` or `Model: no defect` | model risk, probability, confidence, score |
| `attributes`, `attributed`, `what-if`, `predicted mechanism` | explains, SHAP value, counterfactual, mechanism head |
| `RCA model` | the AI, the MLP, the network |
| `root cause chain`, `contribution`, `Confirm chain` | hypothesis, score, terminal parameter risk |

**Investigation summary:** `{k} of {K} boards with {defect} show at least one root cause chain. The {n} most frequent are below; a board can show more than one, so the counts can add up to more than {K}.`

**Chain card:** `{root cause} → {mechanism} → {defect}` · `{k} of {K}` boards with {defect} show this chain · `{n}` boards that passed {inspection} show this chain · `Built {window}` | `Paste lot {lot} · built {window}` | `Spread across the shift` · Suggested action: the Failure Library fix.

**Other chains:** `{chain}` · `{k} with {defect} · {n} passed` · `{when}`

**No chain:** `No root cause chain found · {n} boards` · `{Inspection} found {defect}, but the model predicts no defect, so no chain was assigned.` · `Check the {AOI images | electrical test logs}. If the defect is real, its cause is not among the model's inputs.`

**Board RCA packet (side panel):** `Built {time}, {date} · {panel} · slot {n} · {inspection}: {result} · {location}` · `Model: {defect class}` · `{Inspection}: {result}` · `{Printing | Reflow} mechanism: {mechanism | none}` · per chain: `#{n} {chain}`, `Contribution {pct}`, `{Parameter} {value} {unit} (spec {spec})` + status (`Above USL`, `Below LSL`, `Near LSL · in spec`, `In spec`) · `Supporting measurement: {measurement} {value} (spec {spec}), {above USL}. Supports {mechanism}.` · `Interpretation: Top chain: {mechanism} from {parameter} {status}. Second: ….` · `Assessed {time} · RCA model v2.0 · display threshold τ = 0.60`

**Re-inspection line:** `{n} boards passed {inspection}, but the model predicts {defect}: re-inspect. {v} boards failed {inspection}, but the model predicts no defect: verify the {inspection} call.`

**Sentences**

| Where | Template |
| --- | --- |
| Model line | `Chains from the RCA model and the Failure Library. The model agreed with {inspection} on {pct} of boards in this batch. Retrained on your line's data at onboarding.` |
| Re-inspection scope check | `Also checked: other batches through {line} during {windows}: {none | list}.` |
| Line alert | `{K} boards with {defect}. Most frequent root cause chain: {root cause} → {mechanism} ({k} boards, {window}). Root cause analysis is ready.` |
| Board banner | `Passed {inspections}, but the model predicts {defect}. {Parameter} was {above USL} ({value}, spec {spec}). Built {time}, during {window}: same root cause chain as chain #{n} of {investigation}.` |
| Board what-if | `With {parameter} at nominal ({nominal}), the model would predict no defect for this board.` |
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
- v5.4: the re-inspection header shows only the title; the "other boards agree" and "also checked" lines are removed.
- v5.3: model output is a class, not a risk band: no defect, solder bridging or open circuit, plus the mechanism per side or none. Re-inspection is now 81 boards (75 re-inspect: inspection passed, model predicts a defect; 6 verify the call); the Medium "if needed" group is gone, and "boards that passed AOI with this chain" counts are the re-inspect boards (38, 7, 4 for solder bridging; 30, 2 for open circuit; 26 for INV-0143).
- v5.2: the re-inspection table lists the root causes found on each board instead of a top chain, and states the basis of model risk under the table. Explanatory filler ("Not a hold", hover hints) is removed from labels.
- v5.1: "Containment" is renamed **Re-inspection**. In a factory, containment means holding product that inspection flagged; this list is boards where the RCA model and inspection disagree, to inspect again if needed: re-inspect (passed, High model risk), if needed (passed, Medium) and verify the call (failed, no chain). Hold, "Place hold in MES" and customer notification are removed. The model banner ("trained on synthetic data", "retrained at onboarding") is removed from investigations, and other chains say "boards that passed AOI" in full.
- v5 (branch `sketches-v5`): investigations show root cause chains instead of linked/contributing root causes. Every board gets chains from the RCA model and the Failure Library; the investigation shows the top 3 chains per defect with boards with the defect (44, 14, 7 of 61) and boards that passed AOI with the same chain (112, 61, 33), when each appeared with a trend line, the fix and Confirm chain; other chains collapsed; no chain found (3 boards); model vs AOI matrix. View boards opens a side panel with the board list and each board's RCA packet (chains ranked by contribution). Rule text, stat boxes, the evidence list, "How this was calculated" and "Checked and not linked" are removed. Both investigations share one template.
- v4 (branch `sketches-v4`): evidence from the RCA model. The three checks become attributed boards, predicted mechanism and model agreement with inspection, with a what-if per root cause; board counts and statistical tests are removed. New model vs inspection matrix, risk-band containment (75 hold, 263 review for INV-0142; 26 hold, 657 review for INV-0143), attribution bars on board detail, a model risk curve for squeegee speed in INV-0143, and model agreement on the line overview. Near-limit rule variants are dropped; the model links in-spec root causes directly.
- v1.x: short-excursion story (reflow 02:00–02:40, paste viscosity 03:40–04:30).
- One investigation per batch excursion (INV-0142 for stg-B0003). 8D screens, report recommendation, investigation stages and overdue tracking are out of scope for this demo.
- The re-inspection list belongs to the investigation, and its scope follows the root cause chain, so other batches through the same line during the windows are checked too.
