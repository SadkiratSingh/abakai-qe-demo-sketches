// Renders Claude Design .dc.html artboards into standalone static HTML pages.
// Usage: node export.js <sketches dir> <out dir>
const fs = require('fs');
const path = require('path');
const { parseDocument } = require('htmlparser2');
const render = require('dom-serializer').default;
const { Element, Text } = require('domhandler');

const [, , srcDir, outDir] = process.argv;

// Source file -> output file name.
const NAMES = {
  'Main.dc.html': 'line-overview.html',
  'RcaPacket.dc.html': 'rca-packet.html',
  'Containment.dc.html': 'proposed-hold-list.html',
  'Board.dc.html': 'board-detail.html',
  'BoardAgree.dc.html': 'board-detail-agree.html',
  'Manager.dc.html': 'manager-overview.html',
  'Library.dc.html': 'failure-library.html',
  'Report8D.dc.html': '8d-report.html',
};

// Pages to export: source, output name, title, optional state override.
const PAGES = [
  { src: 'Main.dc.html', out: 'line-overview.html', label: '1 · Line overview', desc: 'Shift KPIs, excursion alerts, defects by hour, batch table' },
  { src: 'RcaPacket.dc.html', out: 'rca-packet.html', label: '2 · Investigation: solder bridging', desc: 'Top 3 root cause chains with board counts, when they appeared, fix and confirm; model vs AOI', links: { 'h.view': 'rca-packet-boards.html', toggleOther: 'rca-packet-all-chains.html', 'h.zoom': 'rca-packet-zoom.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-zoom.html', label: '2 · Investigation: zoomed chart', desc: 'Chain #1 trend, whole shift, with axes, limits and a value per point', state: { zoom: 0 }, links: { 'h.view': 'rca-packet-boards.html', toggleOther: 'rca-packet-all-chains.html', 'h.zoom': 'rca-packet.html', zoomAll: 'rca-packet-zoom.html', zoomWin: 'rca-packet-zoom-window.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-zoom-window.html', label: '2 · Investigation: zoomed around the window', desc: 'Chain #1 trend, the hour either side of 02:00–02:40', state: { zoom: 0, zr: 'win' }, links: { 'h.view': 'rca-packet-boards.html', toggleOther: 'rca-packet-all-chains.html', 'h.zoom': 'rca-packet.html', zoomAll: 'rca-packet-zoom.html', zoomWin: 'rca-packet-zoom-window.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-all-chains.html', label: '2 · Investigation: all chains', desc: 'Top 3 chains plus the 3 more chains shown', state: { showOther: true }, links: { 'h.view': 'rca-packet-boards.html', toggleOther: 'rca-packet.html', 'h.zoom': 'rca-packet-zoom.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-stage-printing.html', label: '2 · Investigation: printing stage only', desc: 'Chains filtered to stage: printing, original ranks kept', state: { stage: 'printing' }, links: { 'h.view': 'rca-packet-boards.html', 'h.zoom': 'rca-packet-zoom.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-boards.html', label: '2 · Investigation: boards with chain #1', desc: 'Board list and one board\'s RCA packet in the side panel', state: { panel: 0, board: 4 }, links: { closePanel: 'rca-packet.html', 'h.view': 'rca-packet-boards.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-open-circuit.html', label: '2 · Investigation: open circuit', desc: 'Same screen with the open circuit tab selected', state: { tab: 'open' }, links: { 'h.view': 'rca-packet-open-circuit-boards.html', stageAll: 'rca-packet-open-circuit.html', stagePrinting: 'rca-packet-open-circuit.html' } },
  { src: 'RcaPacket.dc.html', out: 'rca-packet-open-circuit-boards.html', label: '2 · Investigation: open circuit boards', desc: 'Open circuit chain #1 with one board\'s RCA packet', state: { tab: 'open', panel: 0, board: 1 }, links: { closePanel: 'rca-packet-open-circuit.html', 'h.view': 'rca-packet-open-circuit-boards.html' } },
  { src: 'Containment.dc.html', out: 'proposed-hold-list.html', label: '3 · Proposed hold list', desc: 'All boards where the model and inspection disagree: 81 proposed for hold' },
  { src: 'Board.dc.html', out: 'board-detail.html', label: '3a · Board detail: proposed hold', desc: 'PCB-0006615: passed AOI, model predicts solder bridging. RCA packet (mechanisms, chains with contribution and evidence), contribution per parameter, fingerprint, disposition' },
  { src: 'BoardAgree.dc.html', out: 'board-detail-agree.html', label: '3b · Board detail: model and AOI agree', desc: 'PCB-0006612: failed AOI with solder bridging, model agrees. Same RCA packet with two chains' },
  { src: 'Report8D.dc.html', out: '8d-report.html', label: '4 · 8D report: solder bridging', desc: '8D-0142 for chain #1 (high peak reflow temperature), created when the chain was confirmed: step status, auto-filled D2–D7, updates', links: { openExport: '8d-report-export.html' } },
  { src: 'Report8D.dc.html', out: '8d-report-export.html', label: '4 · 8D report: export to customer template', desc: 'Template picker and field mapping with status', state: { exp: true }, links: { closeExport: '8d-report.html' } },
  { src: 'Manager.dc.html', out: 'manager-overview.html', label: '5 · Manager overview', desc: 'Open investigations, recurring root causes, overdue actions' },
  { src: 'Library.dc.html', out: 'failure-library.html', label: '6 · Failure Library: solder bridging', desc: 'Root cause → mechanism → defect, with specs and fixes' },
  { src: 'Library.dc.html', out: 'failure-library-open-circuit.html', label: '6 · Failure Library: open circuit', desc: 'Same screen with open circuit selected', state: { d: 'o' } },
];

const TAB_LINKS = {
  showBridge: 'rca-packet.html', showOpen: 'rca-packet-open-circuit.html',
  showB: 'failure-library.html', showO: 'failure-library-open-circuit.html',
  stageAll: 'rca-packet.html', stagePrinting: 'rca-packet-stage-printing.html',
};

let LINKS = TAB_LINKS;

const PARSE_OPTS = { lowerCaseAttributeNames: false, lowerCaseTags: false, recognizeSelfClosing: true, decodeEntities: false };

function lookup(scope, expr) {
  expr = expr.trim();
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
  let v = scope;
  for (const part of expr.split('.')) {
    if (v == null) return undefined;
    v = v[part];
  }
  return v;
}

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => esc(s).replace(/"/g, '&quot;');

function interpolate(str, scope, escape) {
  return str.replace(HOLE, (_, e) => {
    const v = lookup(scope, e);
    return v == null ? '' : escape(v);
  });
}

function renderNodes(nodes, scope) {
  const out = [];
  for (const n of nodes) out.push(...renderNode(n, scope));
  return out;
}

function renderNode(node, scope) {
  if (node.type === 'text') {
    return [new Text(interpolate(node.data, scope, esc))];
  }
  if (node.type !== 'tag' && node.type !== 'script' && node.type !== 'style') {
    return [node];
  }
  const name = node.name;
  if (name === 'sc-for') {
    const list = lookup(scope, node.attribs.list.replace(/[{}]/g, '')) || [];
    const as = node.attribs.as || 'item';
    const out = [];
    list.forEach((item, i) => {
      out.push(...renderNodes(node.children, Object.assign(Object.create(scope), { [as]: item, $index: i })));
    });
    return out;
  }
  if (name === 'sc-if') {
    const v = lookup(scope, node.attribs.value.replace(/[{}]/g, ''));
    return v ? renderNodes(node.children, scope) : [];
  }
  const attribs = {};
  for (const [k, raw] of Object.entries(node.attribs)) {
    if (/^on[A-Z]/.test(k) || k.startsWith('hint-')) continue; // event handlers and editor hints
    const whole = raw.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (whole) {
      const v = lookup(scope, whole[1]);
      if (v === true && (k === 'checked' || k === 'disabled' || k === 'selected')) { attribs[k] = ''; continue; }
      if (v === false || v == null) {
        if (k === 'checked' || k === 'disabled' || k === 'selected') continue;
        attribs[k] = v === false ? 'false' : '';
        continue;
      }
      attribs[k] = escAttr(k === 'href' && NAMES[v] ? NAMES[v] : v);
    } else {
      let val = interpolate(raw, scope, escAttr);
      if (k === 'href' && NAMES[val]) val = NAMES[val];
      attribs[k] = val;
    }
  }
  // Tab buttons that switch state become links between the exported variants.
  const handler = (node.attribs.onClick || '').replace(/[{}\s]/g, '');
  if (name === 'button' && LINKS[handler]) {
    const a = Object.assign({}, attribs, { href: LINKS[handler], style: 'display:inline-flex;align-items:center;text-decoration:none' });
    delete a.type; delete a['aria-pressed']; delete a['aria-selected'];
    if (a.role === 'tab') delete a.role;
    return [new Element('a', a, renderNodes(node.children, scope))];
  }
  if (attribs.role === 'tablist') delete attribs.role;
  const el = new Element(name, attribs, renderNodes(node.children, scope));
  return [el];
}

function findAll(nodes, pred, acc = []) {
  for (const n of nodes) {
    if (pred(n)) acc.push(n);
    if (n.children) findAll(n.children, pred, acc);
  }
  return acc;
}

function exportPage(page) {
  const src = fs.readFileSync(path.join(srcDir, page.src), 'utf8');
  const doc = parseDocument(src, PARSE_OPTS);
  const title = findAll(doc.children, n => n.name === 'title')[0];
  const xdc = findAll(doc.children, n => n.name === 'x-dc')[0];
  const helmet = xdc.children.find(n => n.name === 'helmet');
  const body = xdc.children.filter(n => n !== helmet);
  const script = findAll(doc.children, n => n.name === 'script' && n.attribs && 'data-dc-script' in n.attribs)[0];
  const code = script.children.map(c => c.data).join('');

  // Run the artboard's logic class with a stub runtime to get its template values.
  class DCLogic { constructor(props) { this.props = props || {}; this.state = {}; } setState(s) { Object.assign(this.state, s); } forceUpdate() {} }
  const Component = new Function('DCLogic', code + '\nreturn Component;')(DCLogic);
  const comp = new Component({});
  if (page.state) Object.assign(comp.state, page.state);
  LINKS = Object.assign({}, TAB_LINKS, page.links || {});
  const vals = comp.renderVals();

  const headExtra = render(helmet.children, { decodeEntities: false, selfClosingTags: false });
  const bodyHtml = render(renderNodes(body, vals), { decodeEntities: false, selfClosingTags: false });
  const pageTitle = `${page.label.replace(/^[\d a-z]+· /, '')} · RCA Studio`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<!-- Static export of sketches/${page.src}. Regenerate from the sketches; do not edit by hand. -->
${headExtra.trim()}
</head>
<body>
${bodyHtml.trim()}
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, page.out), html);
  return html.length;
}

function exportIndex() {
  const items = PAGES.map(p => `<li><a href="${p.out}"><span class="t">${esc(p.label)}</span><span class="d">${esc(p.desc)}</span></a></li>`).join('\n');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RCA Studio · QE demo screens</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;font-family:'IBM Plex Sans',sans-serif;color:#16191D;background:#F4F5F3}
main{max-width:760px;margin:0 auto;padding:48px 24px}
h1{margin:0 0 8px;font-size:28px;font-weight:600;letter-spacing:-.02em}
p{margin:0 0 24px;color:#4A4F56;line-height:1.5}
ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
a{display:flex;flex-direction:column;gap:4px;padding:16px 20px;background:#fff;border:1px solid #E1E4E0;border-radius:10px;text-decoration:none;color:#16191D}
a:hover{border-color:#1A4F9C}
.t{font-weight:600}.d{font-size:14px;color:#5B6169}
</style>
</head>
<body>
<main>
<h1>RCA Studio · QE demo screens</h1>
<p>Static snapshots of the demo sketches: CTRL-BRD-A, batch stg-B0003, night shift on SMT line 2. All numbers are story data. Generated from the <code>sketches/</code> folder.</p>
<ul>
${items}
</ul>
</main>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

fs.mkdirSync(outDir, { recursive: true });
for (const p of PAGES) console.log(p.out, exportPage(p));
exportIndex();
console.log('index.html');
