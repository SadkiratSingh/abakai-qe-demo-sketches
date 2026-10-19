This repository contains sketches for rca demo for quality engineers and managers

## What's here

Clickable screen sketches for a root cause analysis (RCA) demo aimed at quality engineers (QEs) and quality managers (QMs) in SMT/PCB assembly. The story follows batch stg-B0003 of CTRL-BRD-A on the night shift of SMT line 2: a worn squeegee blade from 23:10 to 00:20 and the reflow oven on the wrong profile from 02:00 to 02:40 (61 boards with solder bridging, 3 of them not explained by any rule), and an out-of-spec paste jar from 03:40 to 04:30 (31 boards with open circuit).

| File | Screen | What it shows |
| --- | --- | --- |
| `sketches/Main.dc.html` | 1 · Line overview | Shift KPIs, excursion alerts, defects by hour, batch table |
| `sketches/RcaPacket.dc.html` | 2 · RCA packet | Linked root causes per defect with the three checks, root causes checked and not linked, spec trend, suggested action |
| `sketches/RcaNearLimit.dc.html` | 2b · RCA packet, near limit | INV-0143: no parameter out of spec, aperture overfill seen in SPI, squeegee speed near LSL linked, containment split into Hold and Review |
| `sketches/Containment.dc.html` | 3 · Containment | Boards that passed inspection but were built out of spec, by location |
| `sketches/Board.dc.html` | 3a · Board detail | One board's linked root cause and the rule condition that flagged it, parameter fingerprint, same-panel boards, disposition, history |
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

## Linking model (v2)

1. Engineers write Failure Library rules per mechanism (rule → mechanism), with a separate mechanism → defect link. Rules may use OR.
2. Each rule is split automatically into **unit rules** joined only by AND; each unit rule keeps its parent rule. Example: `SqueegeeAngle < LSL AND (SqueegeeSpeed < LSL OR SqueegeePressure > USL)` becomes `SqueegeeAngle < LSL AND SqueegeeSpeed < LSL` and `SqueegeeAngle < LSL AND SqueegeePressure > USL`.
3. For every unit rule with a path to the defect, boards are split into **rule condition true** and **rule condition false**, and three checks run: defect rate 2× or more, Fisher's exact test p < 0.01, and at least 20% of defective boards where the rule condition was true.
4. **Linked:** passes all three. **Contributing:** passes the first two, fails the 20% on its own, and its mechanism's passing unit rules together reach 20%. **Checked and not linked:** shows the first check it failed.
5. The parameters in a linked or contributing unit rule are its root causes. Only settings, materials and environment can be root causes.
6. **Measurements** (SPI, AOI) are linked to mechanisms by *supported_by*, never as root causes, and show as "Supported by" evidence.
7. **Near limit:** each parameter's near-limit zone is the last 20% of the way from nominal to each limit (squeegee speed, nominal 70, spec 56–84 mm/s: near LSL is 56.0–58.8). Every unit rule also has a near-limit variant (`SqueegeeSpeed near LSL`), checked with the same three checks. The 20% default matches where the synthetic generator's risk curve starts to climb; the curve itself is never shown as evidence.
8. **Mechanism seen without an out-of-spec root cause:** when a supporting measurement is out of spec on boards where no rule for that mechanism is true at the limit, the RCA packet says so and lists the settings closest to their limits on those boards.
9. **Containment:** boards where a linked or contributing unit rule is true, plus boards whose supporting measurement is out of spec, minus boards that already failed, each counted once. Boards under a linked near-limit rule met spec, so they go to **Review**, not Hold.

## Wording templates

Every generated sentence on the screens comes from one of these templates, so the same fact is always said the same way. `{…}` is filled from data. The RCA packet builds its text from them in code (`const T` in `sketches/RcaPacket.dc.html`).

**Vocabulary**

| Use | Not |
| --- | --- |
| `above USL` / `below LSL` for a direction; `out of spec` for either; `in spec`; `near USL` / `near LSL` for the near-limit zone (still in spec) | above spec, above the limit, upper limit |
| `{start}–{end}` for a time window, e.g. `02:00–02:40` | between 02:00 and 02:40, from 02:00 to 02:40 |
| `boards with {defect}`, e.g. `boards with solder bridging` | bridged boards, bridges, opens |
| `root cause` (the parameter cause), `mechanism`, `defect` | cause, possible cause, signature |
| Spec as a range `{LSL}–{USL} {unit}`, or `≥ {min}` | nominal ± tolerance |
| `linked root cause #{n}`, `checked and not linked` | most likely cause, matches batch cause |
| `excursion` / `no excursion` | spike, cluster, in control (that is SPC language) |

**Status chip:** `Rule condition true · {n} boards`

**The three linking checks** (also the labels of the stat boxes):

- `{Defect} rate, rule condition true vs false: {a}% vs {b}% ({ratio}×). Needs 2× or more.`
- `Fisher's exact test: p {value}. Needs p < 0.01.`
- `Boards with {defect} where the rule condition was true: {k} of {K} ({pct}%). Needs 20% or more.`

Contributing: `Contributing: explains {k} of {K} boards with {defect} ({pct}) on its own. Together with the other passing {mechanism} rules: {k2} of {K} ({pct2}).`

Supported by: `{Measurement} was {above USL} on {n} boards, {x} of them {where}.`

A unit rule checked and not linked shows the first check it failed, in the same words. One whose condition was true on 0 boards shows:
`Measured {value or range} on {stencil ID | all {N} boards} (spec {spec}).`

Unexplained boards (defective boards where no linked or contributing rule condition was true):
`Unexplained: {k} of {K} boards with {defect}` · `{Defect} rate where no linked or contributing rule condition was true: {k} of {N} boards ({pct}).` · `Built {times}: not grouped in one window.` · `Boards with {defect} in batches with no excursion on {line} this shift: {batch} {k} of {N} ({pct}), ….` There is no line baseline yet, so batches without an excursion in the same shift are the comparison.

Near limit:
`{Mechanism} seen without an out-of-spec root cause` · `{Measurement} was {above USL} on {n} boards, but no {mechanism} rule condition at the limit was true.` · `Near-limit variant of: {rule} · {near LSL} = {range}, the last 20% of the way from nominal ({nom}) to {LSL} ({value})` · `{n} more boards built {window} passed {inspection} with {linked rule}. They met spec: review before release.` · Root causes checked: `{n} unit rules and {n} near-limit variants checked · {m} linked`

**Sentences**

| Where | Template |
| --- | --- |
| RCA summary | `{Parameter} was {above USL} {window}. {k} of {K} boards with {defect} were built {window}.` |
| Root causes checked | `{n} root causes checked · {m} linked` |
| Evidence, out of spec | `{n} boards were {above USL} {window}: {parameter} {min}–{max} {unit} (spec {spec}).` |
| Evidence, in window | `{k} of {K} boards with {defect} were built {window}.` |
| Evidence, outside window | `Outside {window}: {parameter} averaged {mean} {unit}; {k} boards with {defect}.` |
| Evidence, compound rule | `{n} boards met the rule condition {window}: {detail}.` |
| Trend note | `{Parameter} averaged {mean} {unit} outside {window} and reached {max} {unit} during it.` |
| Containment | `{n} boards built {window} passed {AOI | electrical test} but met {linked rule #n (rule)}.` |
| Containment, supporting measurement | `{n} more boards passed {inspection} but {measurement}, which supports {mechanism}, was {below LSL}.` |
| Containment scope check | `Also checked: other batches through {line} during {windows}: {none | list}.` |
| Line alert | `{K} boards with {defect}; {k} of {K} built {window}. Root cause analysis is ready.` |
| Board banner | `Passed {inspections}, but {parameter} was {above USL} ({value}, spec {spec}). Built {time}, during {window}: matches linked root cause #{n} of {investigation}.` |
| Suggested action | The root cause's **Fix** text from the Failure Library, word for word |

## Placeholders and assumptions

All numbers are story data, not output from the backend. Before a real demo:

- Peak reflow (245–255 °C) and paste viscosity (180–220 Pa·s) specs are assumed; ambient temperature and RH limits are `[your limit]`.
- Board counts, times, engineer names and traceability IDs (`[stencil ID]`, `[paste lot]`, `[recipe ID]`) are illustrative.
- The manager screen's time-to-root-cause baseline is `[your figure]`.

## Versions

- v1: the first full set of seven screens, commit `7abfa16` on branch `sketches-v1`.
- v2 (branch `sketches-v2`): rule-based linking with unit rules, contributing state and measurements as evidence; squeegee wear added to the story.
- v3 (branch `sketches-v3`): unexplained boards shown per defect (3 of 61 solder bridging, 3 of 31 open circuit), compared with batches stg-B0001 and stg-B0002, which now have a few boards with each defect and no excursion. No model output on any screen. The ML model is currently trained on rule-generated labels, so its scores would only repeat the Failure Library rules. Boards are flagged by rule conditions and linked by board counts only. The model returns once it is trained on real line data.
- v3 also adds near limit: investigation INV-0143 (stg-B0005, day shift 16 Oct) where no parameter was out of spec, yet solder bridging rose to 0.90% (23 of 2,560). Squeegee speed near LSL 10:20–12:30 is linked (2.71% vs 0.215%, 12.6×, 19 of 23); 26 boards are held for paste volume above USL and 657 go to review. The Failure Library, board fingerprint and INV-0142 now show near-limit zones and variants.
- v1.x: short-excursion story (reflow 02:00–02:40, paste viscosity 03:40–04:30). The RCA packet separates each parameter's status (out of spec, with a board count, or in spec) from whether it is linked to the defect (≥2× more likely, under 1% chance of coincidence, explains ≥20% of defective boards), lists every other root cause as checked and not linked, and the other screens use the same numbers.
- One investigation per batch excursion (INV-0142 for stg-B0003). 8D screens, report recommendation, investigation stages and overdue tracking are out of scope for this demo (see the history before this commit).
- Containment holds every board that was out of spec on any linked root cause and has not already failed a test, counted once under its first linked root cause. Containment belongs to the investigation, and its scope follows the root cause, so other batches through the same line during the windows are checked too.
