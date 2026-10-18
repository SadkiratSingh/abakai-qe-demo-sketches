This repository contains sketches for rca demo for quality engineers and managers

## What's here

Clickable screen sketches for a root cause analysis (RCA) demo aimed at quality engineers (QEs) and quality managers (QMs) in SMT/PCB assembly. The story follows one excursion: CTRL-BRD-A, batch stg-B0003, night shift on SMT line 2, with a solder bridging spike and rising open circuits from about 02:00.

| File | Screen | What it shows |
| --- | --- | --- |
| `sketches/Main.dc.html` | 1 · Line overview | Shift KPIs, excursion alerts, defects by hour, batch table |
| `sketches/RcaPacket.dc.html` | 2 · RCA packet | Ranked root causes per defect, causal chain, evidence, spec trend, suggested action |
| `sketches/Containment.dc.html` | 3 · Containment | Boards that passed inspection but share the failure signature, by location |
| `sketches/Board.dc.html` | 3a · Board detail | One board's risk chains, parameter fingerprint, same-panel boards, disposition, history |
| `sketches/Report8D.dc.html` | 4 · 8D draft | D1–D8 with the steps filled from the investigation marked |
| `sketches/Manager.dc.html` | 5 · Manager overview | Open investigations, recurring root causes, overdue actions |
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

## Placeholders and assumptions

All numbers are story data, not output from the backend. Before a real demo:

- Peak reflow (245–255 °C) and paste viscosity (180–220 Pa·s) specs are assumed; ambient temperature and RH limits are `[your limit]`.
- Confidence percentages, board counts, times, engineer names and traceability IDs (`[stencil ID]`, `[paste lot]`, `[recipe ID]`) are illustrative.
- The manager screen's time-to-root-cause baseline is `[your figure]`.

## Versions

- v1: the first full set of seven screens, commit `7abfa16` on branch `sketches-v1`.
