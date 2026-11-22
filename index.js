// Astropole 2 : un jeu incrémental de ville spatiale, refait de zéro. Quatre couches qui changent les règles :
//   crédits et bâtiments → colonies (Mémoires, avantages, planètes, doctrines exclusives, défis)
//   → singularités (nouvelle ressource, la matière noire ; lois de la physique, distorsions) → galaxie (Étoiles, systèmes à conquérir).
// La partie est dans games.city du dossier du plugin (même format que la 1.x : une ancienne partie continue telle quelle).
const HTML = `<div class="appWrap wide apWrap">
  <div class="agHead"><span class="label">Astropole</span><span class="hint" id="apPlace"></span><div class="agNav"><button class="btn px" id="apFs">PLEIN ÉCRAN</button></div></div>
  <div class="apRes" id="apRes"></div>
  <div class="apMain">
    <div class="apBox"><canvas id="apCv" width="640" height="360"></canvas></div>
    <div class="apSide"><div class="apGoal px" id="apGoal"></div><div class="apTip" id="apTip"></div><div class="apBuffs" id="apBuffs"></div></div>
  </div>
  <div class="apTabs" id="apTabs"></div>
  <div class="apBar" id="apBar"></div>
  <div class="apList" id="apList"></div>
  <div class="apAway" id="apAway"></div>
</div>`;
const CSS = `.apWrap{position:relative}
.apRes{display:flex;flex-wrap:wrap;gap:6px 18px;margin:6px 0 10px;font-size:14px}
.apRes span{display:flex;align-items:center;gap:6px;white-space:nowrap}.apRes b{color:var(--c)}.apRes i{font-style:normal;color:var(--muted);font-size:12px}
.apRes canvas{width:18px;height:18px;image-rendering:pixelated}
.apMain{display:flex;gap:16px;align-items:stretch}
.apBox{flex:1 1 0;min-width:0;max-width:calc(min(60vh,640px)*16/9);background:#04010c;box-shadow:0 0 0 3px var(--line2);position:relative;line-height:0}
.apBox canvas{width:100%;height:auto;aspect-ratio:16/9;image-rendering:pixelated;cursor:var(--cp,pointer);touch-action:none}
.apBox:fullscreen{display:grid;place-items:center;max-width:none;background:#04010c}.apBox:fullscreen canvas{width:auto;height:100vh;max-width:100vw}
.apSide{flex:0 0 250px;display:flex;flex-direction:column;gap:10px;min-width:0}
.apGoal{padding:10px 12px;border-left:4px solid #ffd07a;line-height:1.45}.apGoal b{display:block;color:#ffd07a;font-size:11px;letter-spacing:1px;margin-bottom:4px}
.apGoal .bar{height:6px;background:#1b1238;margin-top:8px}.apGoal .bar i{display:block;height:100%;background:linear-gradient(90deg,#ff8ae6,#ffd07a)}
.apTip{color:var(--muted);line-height:1.45;font-size:13px}
.apBuffs{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#8ee8a0}
.apTabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 8px}
.apTabs .btn{position:relative}.apTabs .btn.new::after{content:'';position:absolute;top:-3px;right:-3px;width:7px;height:7px;background:#ff5ad9;box-shadow:0 0 0 2px #04010c}
.apBar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px}.apBar:empty{display:none}.apBar .sp{flex:1}.apBar .hint{max-width:640px}
.apList{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px}
.apCard{display:flex;align-items:center;gap:10px;padding:8px 10px;border-left:4px solid var(--c,#7fe0ee);min-width:0}
.apCard.off{opacity:.45}.apCard.got{background:linear-gradient(90deg,color-mix(in srgb,var(--c) 18%,transparent),transparent 70%)}
.apIc{width:48px;height:42px;flex:none;image-rendering:pixelated;background:linear-gradient(#0b031c,#24184a);box-shadow:inset 0 0 0 2px var(--line2)}
.apTx{flex:1;display:flex;flex-direction:column;min-width:0;gap:2px}.apTx b{font-size:15px}.apTx small{color:var(--muted);line-height:1.35}
.apMeter{height:4px;background:#1b1238;margin-top:3px}.apMeter i{display:block;height:100%;background:var(--c,#7fe0ee)}
.apBtn{flex:none;min-width:104px;font-size:12px;white-space:nowrap}
.apWide{grid-column:1/-1}
.apGraph{width:100%;height:auto;aspect-ratio:640/240;image-rendering:pixelated;background:#06021a;box-shadow:0 0 0 3px var(--line2)}
.apGal{width:100%;height:auto;aspect-ratio:640/320;image-rendering:pixelated;background:#03000c;box-shadow:0 0 0 3px var(--line2);cursor:var(--cp,pointer)}
.apAway{display:none;position:fixed;inset:0;z-index:50;background:rgba(4,1,12,.72);place-items:center;padding:16px}
.apAway.on{display:grid}
.apAway>div{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.apAway h3{margin:0;color:#ffd07a;font-size:14px;letter-spacing:1px}.apAway ul{margin:0;padding-left:18px;line-height:1.6}
.apAway .apChoice{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.apAway .apChoice button{display:flex;flex-direction:column;justify-content:flex-start;gap:4px;text-align:left;white-space:normal;padding:10px;height:auto;min-height:44px}.apAway .apChoice small{color:var(--muted);font-size:11px;line-height:1.35}
@media(max-width:760px){.apMain{flex-direction:column}.apSide{flex:none}.apBox{max-width:none;width:100%}.apList{grid-template-columns:1fr}}
`;
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx } = host, T = (s, v) => host.t ? host.t(s, v) : s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '');
  const FR = T('Astropole') === 'Astropole';
  const folder = ctx.folder, legacy = ctx.legacy || {};
  host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => view.querySelector('#' + id);
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  let games = await doc('games');
  if (games == null) {  // première ouverture : la partie d'avant les plugins
    const old = legacy.api ? await legacy.api('games').catch(() => null) : null; games = {best: {}};
    if (old?.city) { games.city = old.city; await folder.write('games', games); }
  }
  games = {best: {}, ...games};
  let saveTimer = null;
  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = null; folder.write('games', games).catch(() => {}); }, 400); };

/* ================= nombres : un nombre x est gardé comme log10(x) ; -Infinity vaut 0 (null dans la sauvegarde) ================= */
const LG = {
  add: (a, b) => { if (a === -Infinity) return b; if (b === -Infinity) return a; const m = Math.max(a, b); return m + Math.log10(1 + 10 ** (Math.min(a, b) - m)); },
  sub: (a, b) => { if (b === -Infinity) return a; const d = b - a; return d >= 0 ? -Infinity : a + Math.log10(1 - 10 ** d); },
  of: x => x > 0 ? Math.log10(x) : -Infinity,
};
const L = v => v == null ? -Infinity : v, L2 = Math.log10(2), L3 = Math.log10(3);
const SUF = ['million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard', 'quadrillion', 'quadrilliard', 'quintillion', 'quintilliard'].map(w => T(w));
const SUF_EN = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const dec = (x, n = 2) => { const t = x.toFixed(n); return FR ? t.replace('.', ',') : t; };
const NOTATIONS = [['fr', 'Noms (millions, milliards)'], ['sci', 'Scientifique (1,23e15)'], ['eng', 'Ingénieur (12,3e15)'], ['let', 'Lettres (K, M, B, aa)'], ['log', 'Logarithme (e15,09)']];
function fmt(x, how) {
  how ??= city?.opt?.fmt || 'fr';
  if (x === -Infinity) return '0';
  if (x < 0) return dec(10 ** x, 1);
  if (x < 6) return Math.floor(10 ** x + 1e-9).toLocaleString('fr-FR');
  if (x >= 1e6) return 'e' + fmt(Math.log10(x), how);
  const e = Math.floor(x + 1e-12), m = 10 ** (x - e);
  if (how === 'log') return 'e' + dec(x);
  if (how === 'sci') return dec(m) + 'e' + e;
  if (how === 'eng') { const e3 = e - e % 3; return dec(10 ** (x - e3), e - e3 === 2 ? 0 : e - e3 === 1 ? 1 : 2) + 'e' + e3; }
  if (how === 'let') {
    const k = Math.floor(e / 3), v = 10 ** (x - k * 3), num = dec(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
    if (k <= SUF_EN.length) return num + ' ' + SUF_EN[k - 1];
    const n = k - SUF_EN.length - 1; if (n >= 676) return dec(m) + 'e' + e;
    return num + ' ' + String.fromCharCode(97 + Math.floor(n / 26), 97 + n % 26);
  }
  if (x < 36) { const i = Math.floor((x - 6) / 3), v = 10 ** (x - 6 - i * 3); return dec(v) + ' ' + SUF[i] + (FR && v >= 2 ? 's' : ''); }
  return dec(m) + 'e' + e.toLocaleString('fr-FR');
}
const ROMAN = n => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const nint = n => Math.floor(n).toLocaleString('fr-FR');
const away = s => s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min' : s < 86400 ? Math.floor(s / 3600) + ' h ' + String(Math.round(s % 3600 / 60)).padStart(2, '0') : Math.floor(s / 86400) + ' j ' + Math.floor(s % 86400 / 3600) + ' h';

/* ================= le monde : bâtiments, planètes ================= */
const NAMES = ['Module d\'habitat', 'Serre hydroponique', 'Champ solaire', 'Mine d\'astéroïdes', 'Raffinerie de glace', 'Chantier naval', 'Laboratoire orbital', 'Port spatial',
  'Anneau d\'habitation', 'Ascenseur spatial', 'Forge stellaire', 'Essaim de Dyson', 'Portail de saut', 'Cerveau-planète', 'Moteur à trou noir', 'Architecte du vide'];
const COLS = ['#7fe0ee', '#5fd08a', '#ffd07a', '#c0a080', '#c9e8ff', '#a0a0c0', '#b46aee', '#ff8ae6', '#4f9fe0', '#e8e4d0', '#ff7a4f', '#ffc23a', '#ff5ad9', '#8ee8a0', '#8a5af0', '#d8c8ff'];
const bname = i => i < 16 ? T(NAMES[i]) : T('Mégastructure') + ' ' + ROMAN(i - 15);
const bcol = i => COLS[i < 16 ? i : (i * 5 + 2) % 16];
const PLANETS = [
  {name: 'Néa', text: 'la planète d’origine, sans effet particulier', fam: {}, sky: ['#0b031c', '#4a1f7a', '#2f4aa8', '#e0a8e0', '#ff8a6a'], hill: ['#3a2468', '#251845'], ground: '#2c2052', accent: '#ffd07a', flora: '#8ee8a0', aurora: '#8ee8a0'},
  {name: 'Cryos', text: 'raffineries de glace ×10, champs solaires ×0,5', fam: {4: 1, 2: -L2}, sky: ['#06121f', '#0f4a6a', '#4a8ad0', '#d8f2ff', '#ffb0c8'], hill: ['#9ab8e0', '#6a88b8'], ground: '#3a5a80', accent: '#c9e8ff', flora: '#e8f4ff', snow: 1, aurora: '#7fe0ee'},
  {name: 'Pyra', text: 'mines d’astéroïdes ×10, clics ×3', fam: {3: 1}, click: L3, sky: ['#140308', '#5a1a10', '#9a4a2a', '#ffc080', '#ff5a2a'], hill: ['#4a2020', '#2a1010'], ground: '#3a1a18', accent: '#ff7a4f', flora: '#ff7a2f', lava: 1},
  {name: 'Sylve', text: 'serres ×10, événements deux fois plus fréquents', fam: {1: 1}, luck: 2, sky: ['#031a14', '#0f6a4a', '#3a9a8a', '#e0f8c0', '#ffd08a'], hill: ['#2a6a4a', '#1a4a30'], ground: '#24402a', accent: '#8ee8a0', flora: '#5fd08a'},
  {name: 'Aurore', text: 'chantiers navals et ports spatiaux ×5, cargos trois fois plus fréquents', fam: {5: .7, 7: .7}, cargo: 3, sky: ['#14031e', '#6a1f5a', '#c06aa0', '#ffd8ec', '#ffa0a0'], hill: ['#7a3a7a', '#4a2050'], ground: '#4a2a50', accent: '#ff8ae6', flora: '#ff8ae6', aurora: '#ff8ae6'},
  {name: 'Nébula', text: 'laboratoires ×10, recherches deux fois moins chères', fam: {6: 1}, res: L2, sky: ['#05031a', '#2a1a7a', '#4a3ab0', '#c0b0ff', '#ff9ad0'], hill: ['#3a2a8a', '#22185a'], ground: '#2a2060', accent: '#b46aee', flora: '#b46aee'},
];

/* ================= la partie ================= */
const START = Math.log10(15);
let city = null;
function S() {
  const s = city ??= (games.city ??= {cr: START, run: START, all: START, b: [], mem: null, colonies: 0, last: Date.now(), clicks: 0, ships: 0, buy: 1});
  s.up ??= {}; s.ach ??= []; s.perk ??= {}; s.meteors ??= 0; s.merch ??= 0;          // 1.2 → 1.4
  if (!s.v) { s.v = 2; s.sAll = L(s.all); s.tab = 'b'; s.started = s.last; }       // 1.x → 2 : tout ce qui a été produit compte pour la première singularité
  s.sing ??= 0; s.singAll ??= 0; s.singTot ??= 0; s.sings ??= 0; s.dm ??= null; s.dist ??= {}; s.laws ??= {};
  s.ch ??= 0; s.chDone ??= {}; s.branch ??= []; s.br ??= {}; s.evc ??= 0; s.landings ??= 0; s.parties ??= 0;
  s.stars ??= 0; s.starsSpent ??= 0; s.sys ??= [0]; s.gals ??= 0;
  s.opt ??= {fmt: 'fr', auto: 1}; s.hist ??= []; s.histL ??= []; s.marks ??= []; s.seen ??= {};
  return s;
}
const perk = k => S().perk[k] || 0, law = k => !!S().laws[k], dist = k => S().dist[k] || 0, chOn = k => S().ch === k, chWon = k => !!S().chDone[k];
const br = id => !!S().br[id], sys = k => S().sys.reduce((n, i) => n + (GAL[i]?.k === k ? 1 : 0), 0);
const totB = (s = S()) => s.b.reduce((a, n) => a + (n || 0), 0);
const planet = (c = S().colonies) => PLANETS[c ? 1 + (c - 1) % (PLANETS.length - 1) : 0];
const memFree = () => LG.sub(L(S().mem), L(S().memSpent));

/* ---- bâtiments : prix et production ---- */
const costRaw = i => 1 + i * 1.25 + i * i * .04;
const EARLY = [.3, .4, .3, .15];
const growth = () => chOn(2) ? Math.log10(1.25) : Math.log10(Math.max(1.06, 1.15 - .005 * dist('comp') - (chWon(2) ? .01 : 0)));
const cost0 = i => costRaw(i) - (EARLY[i] || 0) - (chOn(8) ? 0 : perk('cheap') * Math.log10(1 / .9)) - buffL('cheap') - (br('i1') ? Math.log10(4 / 3) : 0) - sys('cheap') * L2;
const prod0 = i => costRaw(i) - 2 - i * .18;
const STEP = () => law('paliers') ? 10 : 25;
const DBL = () => Math.log10(2 + (br('i2') ? .5 : 0) + (chWon(7) ? .2 : 0));
function upL(i) {
  const s = S(); let x = planet().fam[i] || 0;
  if (chOn(3)) return x;
  const each = chWon(3) ? Math.log10(4) : L3;
  for (let r = 0; r < UP_N.length; r++) if (s.up['b' + i + '.' + r]) x += each;
  if (s.up['s' + i]) x += Math.log10(1 + .01 * (s.b[i - 1] || 0));
  if (i >= 16) x += dist('grav') + (chWon(4) ? 2 : 0);
  return x;
}
function mult() {
  const s = S(), m = memFree(), nUp = Object.keys(s.up).length;
  let x = 0;
  if (!chOn(8)) { const k = chWon(8) ? .12 : .1, mm = LG.of(1 + k * 10 ** Math.min(300, m)) + (m > 300 ? m - 300 : 0); x += s.ch ? mm / 2 : mm; x += perk('prod') * L2; }
  x += LG.of(1 + (br('s3') ? .06 : .03) * s.ach.length);
  x += buffL('prod');
  if (br('i3')) x += 1;
  if (br('s4')) x += Math.log10(1 + nUp / 10);
  if (br('c4')) x += Math.min(50, s.evc) * Math.log10(1.1);
  x += 2 * LG.add(0, L(s.dm));                         // la matière noire : production × (1 + matière noire)²
  x += dist('time') * Math.log10(1.25);                // la dilatation du temps : tout va plus vite
  if (chWon(1)) x += L3;
  x += sys('prod') * 3;
  if (chOn(5)) x -= 2;
  return x;
}
const prodOf = (i, n = S().b[i] || 0) => n ? prod0(i) + Math.log10(n) + Math.floor(n / STEP()) * DBL() + upL(i) + mult() : -Infinity;
const prod = () => (S().b.length ? S().b : [0]).reduce((x, n, i) => LG.add(x, prodOf(i, n)), -Infinity);
function cost(i, k = 1) {
  const n = S().b[i] || 0, R = growth(), r = 10 ** R;
  return cost0(i) + n * R + (k * R > 12 ? k * R - Math.log10(r - 1) : Math.log10((r ** k - 1) / (r - 1)));
}
function maxBuy(i) {
  const s = S(), R = growth(), x = L(s.cr) - cost0(i) - (s.b[i] || 0) * R + Math.log10(10 ** R - 1);
  return Math.max(0, Math.floor((x > 15 ? x : Math.log10(1 + 10 ** x)) / R + 1e-9));
}
const allowed = i => !(chOn(4) && i >= 8) && !(chOn(7) && !(S().b[i] > 0) && S().b.filter(n => n > 0).length >= 4);
const tiers = () => { const s = S(); return Math.min(s.b.length + 1, Math.max(1, s.b.findLastIndex(n => n > 0) + 2)); };
function gain(x) { const s = S(); s.cr = LG.add(L(s.cr), x); s.run = LG.add(L(s.run), x); s.all = LG.add(L(s.all), x); s.sAll = LG.add(L(s.sAll), x); }
function buy(i, k) {
  const s = S(); if (!allowed(i)) return false;
  k = k === 'max' ? maxBuy(i) : k; if (!k) return false;
  const c = cost(i, k); if (c > L(s.cr) + 1e-9) return false;
  s.cr = LG.sub(L(s.cr), c); s.b[i] = (s.b[i] || 0) + k; return true;
}
// un clic : 1 crédit + 1 s de production, ×2 par recherche de clic
const CLICK = [1.7, 3, 4.5, 6.5, 9, 12, 16, 21, 27, 34, 42, 51];
const clickN = () => { let r = 0; while (S().up['c' + r]) r++; return r; };
const clickL = () => chOn(1) ? -Infinity : LG.add(0, prod()) + clickN() * L2 + (chOn(8) ? 0 : perk('click') * Math.log10(5)) + (planet().click || 0) + buffL('click') + (br('c1') ? 1 : 0);
const luck = () => chOn(6) ? 0 : (planet().luck || 1) * (1 + .25 * perk('luck')) * (br('c2') ? 2 : 1) * (chWon(6) ? 2 : 1) * 1.5 ** sys('ev');

/* ---- recherches ---- */
const UP_N = [10, 25, 50, 100, 200, 400];
function ups() {
  const s = S(), out = [], rd = (planet().res || 0) + (br('s1') ? 1 : 0);
  if (chOn(3)) return out;
  for (let i = 0; i < tiers(); i++) {
    const n = s.b[i] || 0;
    UP_N.forEach((req, r) => { if (n >= req) out.push({id: 'b' + i + '.' + r, i, name: bname(i) + ' ' + ROMAN(r + 1), text: T('production ×{k} (ouverte à {n})', {k: chWon(3) ? 4 : 3, n: req}), cost: costRaw(i) + req * Math.log10(1.15) + 1 + r * .5 - rd}); });
    if (i && n >= 25 && (s.b[i - 1] || 0) >= 25) out.push({id: 's' + i, i, name: T('Liaison : {b}', {b: bname(i)}), text: T('+1 % de production par {b}', {b: bname(i - 1)}), cost: costRaw(i) + 25 * Math.log10(1.15) + 2 - rd});
  }
  const c = clickN(); if (c < CLICK.length) out.push({id: 'c' + c, i: -1, name: T('Clic') + ' ' + ROMAN(c + 1), text: T('chaque clic rapporte deux fois plus'), cost: CLICK[c] - rd});
  return out.filter(u => !s.up[u.id]).sort((a, b) => a.cost - b.cost);
}
function buyUp(u) { const s = S(); if (s.up[u.id] || u.cost > L(s.cr) + 1e-9) return false; s.cr = LG.sub(L(s.cr), u.cost); s.up[u.id] = 1; return true; }

/* ---- doctrines : trois branches exclusives par colonie (deux avec la loi Polymathe) ---- */
const BRANCHES = [
  {id: 'i', name: 'Industrie', col: '#ff7a4f', text: 'une ville qui tourne seule', tiers: [
    ['i1', 'Préfabriqués', 'bâtiments 25 % moins chers', 9], ['i2', 'Grandes séries', 'tous les paliers de bâtiments : ×2,5 au lieu de ×2', 13],
    ['i3', 'Hauts fourneaux', 'production ×10', 18], ['i4', 'Chaînes de montage', 'achète seule le bâtiment le moins cher, chaque seconde', 24]]},
  {id: 's', name: 'Science', col: '#7fe0ee', text: 'des recherches et des Mémoires', tiers: [
    ['s1', 'Méthode', 'recherches 10 fois moins chères', 9], ['s2', 'Archives', 'Mémoires gagnées ×2', 13],
    ['s3', 'Revue savante', 'chaque succès : +6 % de production au lieu de +3 %', 18], ['s4', 'Théorie unifiée', '+10 % de production par recherche de la colonie', 24]]},
  {id: 'c', name: 'Commerce', col: '#ffd07a', text: 'des clics et des événements', tiers: [
    ['c1', 'Bourse', 'clics ×10', 9], ['c2', 'Routes marchandes', 'événements deux fois plus fréquents', 13],
    ['c3', 'Grand bazar', 'le marchand propose 4 bonus, et ils durent deux fois plus', 18], ['c4', 'Comptoirs', '+10 % de production par événement attrapé dans la colonie (50 au plus)', 24]]},
];
const brOpen = () => L(S().run) >= 8 || S().colonies > 0 || S().sings > 0;
const brMax = () => law('poly') ? 2 : 1;
function pickBranch(id) { const s = S(); if (s.branch.includes(id) || s.branch.length >= brMax()) return false; s.branch.push(id); return true; }
function buyTier(t) { const s = S(), [id, , , c] = t; if (s.br[id] || !s.branch.includes(id[0]) || c > L(s.cr) + 1e-9) return false; const b = BRANCHES.find(b => b.id === id[0]); if (b.tiers.findIndex(x => x[0] === id) > 0 && !s.br[b.tiers[b.tiers.findIndex(x => x[0] === id) - 1][0]]) return false; s.cr = LG.sub(L(s.cr), c); s.br[id] = 1; return true; }

/* ---- succès ---- */
const ACH = (() => {
  const a = [], pl = (n, one, many) => n + ' ' + T(n > 1 ? many : one);
  for (const n of [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]) a.push(['n' + n, n + ' ' + T('bâtiments'), s => totB(s) >= n]);
  for (const x of [3, 6, 9, 12, 15, 18, 24, 30, 40, 50, 75, 100, 150, 250, 400, 600, 1000]) a.push(['p' + x, T('{n} crédits produits', {n: fmt(x, 'fr')}), s => L(s.all) >= x]);
  for (const n of [50, 500, 2500, 10000]) a.push(['c' + n, n + ' ' + T('clics'), s => s.clicks >= n]);
  for (const n of [1, 10, 50]) a.push(['s' + n, pl(n, 'cargo attrapé', 'cargos attrapés'), s => s.ships >= n]);
  for (const n of [10, 100, 500]) a.push(['m' + n, n + ' ' + T('météores'), s => s.meteors >= n]);
  for (const n of [1, 10, 50]) a.push(['v' + n, pl(n, 'marché conclu', 'marchés conclus'), s => s.merch >= n]);
  for (const n of [1, 3, 6, 10, 25, 50]) a.push(['k' + n, pl(n, 'colonie fondée', 'colonies fondées'), s => s.colonies >= n]);
  for (const n of [5, 25, 60]) a.push(['r' + n, T('{n} recherches dans une colonie', {n}), s => Object.keys(s.up).length >= n]);
  for (let i = 0; i < 16; i++) for (const n of [25, 100]) a.push(['t' + i + '.' + n, n + ' × ' + T(NAMES[i]), s => (s.b[i] || 0) >= n]);
  for (const n of [1, 10, 50]) a.push(['l' + n, pl(n, 'vaisseau accueilli', 'vaisseaux accueillis'), s => s.landings >= n]);
  for (const n of [1, 10, 50]) a.push(['f' + n, pl(n, 'fête de quartier', 'fêtes de quartier'), s => s.parties >= n]);
  a.push(['d1', T('Une doctrine complète'), s => BRANCHES.some(b => b.tiers.every(t => s.br[t[0]]))]);
  for (const n of [1, 4, 8]) a.push(['h' + n, pl(n, 'défi relevé', 'défis relevés'), s => Object.keys(s.chDone).length >= n]);
  for (const n of [1, 5, 25, 100]) a.push(['u' + n, pl(n, 'singularité', 'singularités'), s => s.singTot >= n]);
  for (const n of [1, 4, 8]) a.push(['w' + n, pl(n, 'loi de la physique', 'lois de la physique'), s => Object.keys(s.laws).length >= n]);
  for (const n of [1, 5, 12, 21]) a.push(['g' + n, pl(n, 'système conquis', 'systèmes conquis'), s => s.sys.length - 1 >= n]);
  return a;
})();
function achCheck() {
  const s = S(), got = ACH.filter(([id, , f]) => !s.ach.includes(id) && f(s)); if (!got.length) return 0;
  s.ach.push(...got.map(a => a[0])); sfx('notify'); save();
  const pc = br('s3') ? 6 : 3;
  toast(got.length === 1 ? T('Succès : {a} (+{p} % de production)', {a: got[0][1], p: pc}) : T('{n} succès débloqués (+{p} % de production)', {n: got.length, p: got.length * pc}));
  return got.length;
}

/* ---- colonies : Mémoires et avantages ---- */
const PERKS = [
  {id: 'prod', name: 'Héritage', text: 'production ×2 par niveau', base: L2, step: L3},
  {id: 'click', name: 'Mains d’or', text: 'clics ×5 par niveau', base: 0, step: L3},
  {id: 'cheap', name: 'Architectes', text: 'bâtiments 10 % moins chers par niveau', base: L3, step: Math.log10(4), max: 20},
  {id: 'start', name: 'Fondations', text: 'chaque colonie démarre avec ×100 crédits par niveau', base: 0, step: Math.log10(5)},
  {id: 'luck', name: 'Bonne étoile', text: 'événements 25 % plus fréquents par niveau', base: L2, step: L3, max: 8},
];
const perkCost = p => p.base + perk(p.id) * p.step;
function buyPerk(p) { const s = S(); if ((p.max && perk(p.id) >= p.max) || perkCost(p) > memFree() + 1e-9) return false; s.memSpent = LG.add(L(s.memSpent), perkCost(p)); s.perk[p.id] = perk(p.id) + 1; return true; }
const memFloor = () => law('eclair') ? 9 : 12;
const memGain = () => { const x = L(S().run); return x >= memFloor() ? (x - memFloor()) / 2 + (br('s2') ? L2 : 0) + dist('echo') * L2 + (chWon(5) ? L3 : 0) + sys('mem') : -Infinity; };
function resetColony() {  // ce qui repart de zéro à chaque nouvelle colonie
  const s = S(); s.b = []; s.up = {}; s.br = {}; s.branch = []; s.evc = 0;
  s.cr = s.run = START + 2 * perk('start') + sys('start') * 6;
  if (cityFx) { cityFx.buffs = []; cityFx.offer = null; cityFx.events = []; cityFx.zoom = null; cityFx.flash = 40; cityFx.dirty = 1; }
}
function colony() {
  const s = S(), g = memGain(); if (g < 0) return false;
  if (s.ch) { const k = s.ch; if (L(s.run) >= CHALLENGES[k - 1].goal) winChallenge(k); s.ch = 0; }
  s.mem = LG.add(L(s.mem), g); s.colonies++; mark('c'); resetColony(); return true;
}

/* ---- défis : une colonie avec une contrainte ; la réussir donne un bonus pour toujours ---- */
const CHALLENGES = [
  {name: 'Panne de clics', rule: 'les clics ne rapportent rien', reward: 'production ×3', goal: 24},
  {name: 'Inflation', rule: 'les prix montent de 25 % à chaque achat au lieu de 15 %', reward: 'les prix montent de 1 % de moins', goal: 24},
  {name: 'Sans recherche', rule: 'aucune recherche', reward: 'chaque recherche de bâtiment : ×4 au lieu de ×3', goal: 26},
  {name: 'Isolement', rule: 'seulement les 8 premières sortes de bâtiments', reward: 'mégastructures ×100', goal: 20},
  {name: 'Éclipse', rule: 'production divisée par 100', reward: 'Mémoires gagnées ×3', goal: 24},
  {name: 'Calme plat', rule: 'aucun événement : ni météores, ni marchand, ni cargos, ni vaisseaux, ni fêtes', reward: 'événements deux fois plus fréquents', goal: 26},
  {name: 'Spécialiste', rule: 'quatre sortes de bâtiments au plus', reward: 'paliers de bâtiments : +0,2 au multiplicateur', goal: 22},
  {name: 'Amnésie', rule: 'les Mémoires et leurs avantages ne comptent pas', reward: 'chaque Mémoire gardée : +12 % au lieu de +10 %', goal: 28},
];
const chOpen = () => S().sings > 0 || S().colonies >= 5;
function startChallenge(k) { const s = S(); if (s.ch || chWon(k)) return false; s.ch = k; resetColony(); mark('d'); return true; }
function quitChallenge() { const s = S(); if (!s.ch) return false; s.ch = 0; resetColony(); return true; }
function winChallenge(k) { const s = S(); s.chDone[k] = 1; toast(T('Défi relevé : {n} · {r}', {n: T(CHALLENGES[k - 1].name), r: T(CHALLENGES[k - 1].reward)})); sfx('launch'); }

/* ---- singularités : la deuxième couche ; la matière noire, les lois de la physique, les distorsions ---- */
const SING_AT = 50;
const singGain = () => { const x = L(S().sAll); return x >= SING_AT ? Math.floor(10 ** ((x - SING_AT) / 25) * 1.5 ** sys('sing') + 1e-9) : 0; };
const singNext = () => { const g = singGain(); return SING_AT + 25 * Math.log10((g + 1) / 1.5 ** sys('sing')); };  // crédits à produire pour une singularité de plus
const dmRate = () => { const s = S(); return s.singAll > 0 ? 1.5 * Math.log10(s.singAll) - 1 + (law('horizon') ? 1 : 0) + sys('dm') * L3 + dist('time') * Math.log10(1.25) : -Infinity; };
const LAWS = [
  {id: 'auto', name: 'Automates', text: 'les bâtiments s’achètent seuls (le moins cher d’abord), interrupteur dans Bâtiments', cost: 1},
  {id: 'arch', name: 'Archives vivantes', text: 'les recherches s’achètent seules', cost: 2},
  {id: 'eclair', name: 'Colonies éclair', text: 'une nouvelle colonie dès 1 milliard de crédits produits (au lieu de 1 billion)', cost: 2},
  {id: 'poly', name: 'Polymathe', text: 'deux doctrines à la fois', cost: 3},
  {id: 'memo', name: 'Mémoire stellaire', text: 'chaque singularité commence avec 1 million de Mémoires', cost: 4},
  {id: 'horizon', name: 'Horizon des événements', text: 'matière noire ×10', cost: 5},
  {id: 'paliers', name: 'Paliers serrés', text: 'la production d’un bâtiment double tous les 10 exemplaires au lieu de 25', cost: 8},
  {id: 'ver', name: 'Trou de ver', text: 'le temps passé loin compte double', cost: 12},
];
const DISTS = [
  {id: 'time', name: 'Dilatation du temps', text: 'production et matière noire ×1,25 par niveau', base: 1, step: .8},
  {id: 'comp', name: 'Compression', text: 'les prix montent de 0,5 % de moins par niveau', base: 2, step: 1, max: 14},
  {id: 'grav', name: 'Gravité', text: 'mégastructures ×10 par niveau', base: 2.5, step: 1.2},
  {id: 'echo', name: 'Écho', text: 'Mémoires gagnées ×2 par niveau', base: 3, step: 1.5},
];
const distCost = d => d.base + dist(d.id) * d.step;
function buyDist(d) { const s = S(); if ((d.max && dist(d.id) >= d.max) || distCost(d) > L(s.dm) + 1e-9) return false; s.dm = LG.sub(L(s.dm), distCost(d)); s.dist[d.id] = dist(d.id) + 1; return true; }
function buyLaw(l) { const s = S(); if (s.laws[l.id] || l.cost > s.sing) return false; s.sing -= l.cost; s.laws[l.id] = 1; return true; }
function resetSing() {  // ce qui repart de zéro à chaque singularité
  const s = S(); s.mem = law('memo') ? 6 : null; s.memSpent = null; s.perk = {}; s.colonies = 0; s.ch = 0; s.sAll = START; resetColony();
}
function singularity() {
  const s = S(), g = singGain(); if (!g) return false;
  s.sing += g; s.singAll += g; s.singTot += g; s.sings++; mark('s'); resetSing(); return true;
}

/* ---- galaxie : la troisième couche ; des Étoiles pour conquérir des systèmes, chacun un bonus pour toujours ---- */
const GAL_AT = 30;
const galGain = () => { const s = S(); return s.singAll >= GAL_AT ? Math.floor(Math.sqrt(s.singAll / GAL_AT) + 1e-9) : 0; };
const GAL_KINDS = {prod: 'production ×1 000', dm: 'matière noire ×3', sing: 'singularités gagnées ×1,5', mem: 'Mémoires gagnées ×10', cheap: 'bâtiments deux fois moins chers', ev: 'événements ×1,5', start: 'chaque colonie démarre avec ×1 million de crédits'};
const GAL = (() => {  // 22 systèmes, toujours les mêmes ; le système 0 est chez toi
  const r = seeded(4242), syl = ['Ka', 'Vel', 'Or', 'Ys', 'Tha', 'Mir', 'Zen', 'Lu', 'Dra', 'Ae', 'Qor', 'Sil', 'Nox', 'Bel', 'Iri', 'Hel'], kinds = Object.keys(GAL_KINDS), out = [{x: 320, y: 160, k: null, name: 'Néa'}];
  for (let i = 1; out.length < 22 && i < 2000; i++) {
    const a = r() * Math.PI * 2, d = 40 + r() * 250, x = 320 + Math.cos(a) * d * 1.05, y = 160 + Math.sin(a) * d * .5;
    if (x < 24 || x > 616 || y < 22 || y > 298 || out.some(p => Math.hypot(p.x - x, p.y - y) < 46)) continue;
    out.push({x: Math.round(x), y: Math.round(y), k: kinds[out.length % kinds.length], name: syl[r() * 16 | 0] + syl[r() * 16 | 0].toLowerCase() + (r() < .4 ? ' ' + ROMAN(1 + (r() * 5 | 0)) : '')});
  }
  out.sort((a, b) => Math.hypot(a.x - 320, (a.y - 160) * 2) - Math.hypot(b.x - 320, (b.y - 160) * 2));
  for (const [i, p] of out.entries()) {  // les routes : vers le plus proche des systèmes plus près du centre, et un voisin de plus
    p.n = new Set();
    if (i) { const near = out.slice(0, i).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); p.n.add(out.indexOf(near[0])); if (near[1] && Math.hypot(near[1].x - p.x, near[1].y - p.y) < 120) p.n.add(out.indexOf(near[1])); }
  }
  for (const [i, p] of out.entries()) for (const j of p.n) out[j].n.add(i);
  const depth = [0]; for (let q = [0]; q.length;) { const i = q.shift(); for (const j of out[i].n) if (depth[j] == null) { depth[j] = depth[i] + 1; q.push(j); } }
  out.forEach((p, i) => { p.n = [...p.n]; p.cost = depth[i] || 0; });
  return out;
})();
function seeded(s) { return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const starsFree = () => S().stars - S().starsSpent;
const canConquer = i => { const s = S(); return i > 0 && !s.sys.includes(i) && GAL[i].n.some(j => s.sys.includes(j)) && GAL[i].cost <= starsFree(); };
function conquer(i) { if (!canConquer(i)) return false; const s = S(); s.starsSpent += GAL[i].cost; s.sys.push(i); return true; }
function galaxy() {
  const s = S(), g = galGain(); if (!g) return false;
  s.stars += g; s.gals++; s.sing = 0; s.singAll = 0; s.dm = null; s.dist = {}; mark('g'); resetSing(); return true;
}

/* ---- le temps : la production (et la matière noire) de chaque instant, et du temps passé loin ---- */
function tickTime(dt, far) {  // dt en secondes
  if (dt <= 0) return {cr: -Infinity, dm: -Infinity};
  const k = far && law('ver') ? 2 : 1, s = S(), cr = prod() + Math.log10(dt * k), dm = dmRate() + Math.log10(dt * k);
  gain(cr); if (dm > -Infinity) s.dm = LG.add(L(s.dm), dm);
  return {cr, dm};
}
function mark(k) { const s = S(); s.marks.push([Date.now(), k]); if (s.marks.length > 200) s.marks.splice(0, s.marks.length - 200); }
function sample(now = Date.now()) {  // le graphique : la production toutes les 5 min (2 jours) et toutes les heures (30 jours)
  const s = S(), p = prod(), v = p === -Infinity ? null : Math.round(p * 100) / 100;
  if (!s.hist.length || now - s.hist[s.hist.length - 1][0] >= 300000) { s.hist.push([now, v]); if (s.hist.length > 576) s.hist.shift(); }
  if (!s.histL.length || now - s.histL[s.histL.length - 1][0] >= 3600000) { s.histL.push([now, v]); if (s.histL.length > 720) s.histL.shift(); }
}
// les automates (loi), les chaînes de montage (doctrine) et les archives (loi) : une fois par seconde
function automate() {
  const s = S(); let did = false;
  if ((law('auto') && s.opt.auto) || br('i4')) {
    for (let n = 0; n < 40; n++) {
      let best = -1, bc = Infinity; for (let i = 0; i < tiers(); i++) { if (!allowed(i)) continue; const c = cost(i); if (c < bc) { bc = c; best = i; } }
      if (best < 0 || bc > L(s.cr)) break;
      buy(best, law('auto') && s.opt.auto ? Math.max(1, Math.min(maxBuy(best), 10)) : 1); did = true;
      if (!(law('auto') && s.opt.auto)) break;
    }
  }
  if (law('arch')) for (const u of ups()) if (u.cost <= L(s.cr) - 1) { buyUp(u); did = true; }
  return did;
}

/* ================= le dessin : la ville en pixel art, 640 × 360 ================= */
const W = 640, H = 360, OUT = '#07031a';
const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mixc = (a, b, k) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.max(0, Math.min(255, Math.round(v + (y[i] - v) * k))).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, a) => { const [r, g, b] = hex(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
const up = (c, k = .3) => mixc(c, '#ffffff', k), dn = (c, k = .35) => mixc(c, '#000000', k);
let NF = 0;  // la nuit : 0 en plein jour, 1 en pleine nuit
const NC = new Map();
const N = c => { if (!NF) return c; const k = c + NF; let v = NC.get(k); if (!v) { v = mixc(c, '#0a0826', NF * .62); NC.set(k, v); if (NC.size > 4000) NC.clear(); } return v; };
const R = (g, c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
const P = (g, c, x, y, w, h) => R(g, N(c), x, y, w, h);   // une couleur qui s'assombrit la nuit
function blk(g, x, y, w, h, c) {  // un volume : contour, face éclairée à gauche, ombre à droite
  x = Math.round(x); y = Math.round(y);
  R(g, OUT, x - 1, y - 1, w + 2, h + 1); P(g, c, x, y, w, h); P(g, up(c, .28), x, y, 1, h); P(g, up(c, .4), x, y, w, 1); P(g, dn(c, .3), x + w - 2, y + 1, 2, h - 1);
}
function wins(g, x, y, w, h, seed, px = 3, py = 4, lit = '#ffd890') {  // des fenêtres : sombres le jour, allumées au hasard la nuit
  const r = seeded(seed);
  for (let j = y; j + 2 <= y + h; j += py) for (let i = x; i + 1 <= x + w; i += px) { const on = r() < .62; R(g, NF > .35 && on ? lit : N(on ? '#2a3a6a' : '#1a2246'), i, j, 1, 2); }
}
function disc(g, cx, cy, r, f) {  // un disque, pixel par pixel ; f(dx, dy, d) donne la couleur ou rien
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const d = Math.hypot(dx, dy); if (d <= r + .3) { const c = f(dx, dy, d); if (c) R(g, c, cx + dx, cy + dy); } }
}
function dome(g, cx, b, r, c, glass) {
  disc(g, cx, b, r + 1, (dx, dy) => dy <= 0 ? OUT : null);
  disc(g, cx, b, r, (dx, dy, d) => dy > 0 ? null : glass ? N(mixc(c, '#ffffff', Math.max(0, (-dx - dy) / r) * .4 + ((dx + 40) % 5 === 0 || dy % 4 === 0 ? .25 : 0))) : N(mixc(c, dx < 0 ? '#ffffff' : '#000000', Math.abs(dx) / r * .3)));
}
const tri = (g, cx, b, w, h, c) => { for (let y = 0; y < h; y++) { const hw = Math.max(.5, w / 2 * (1 - y / h)); R(g, OUT, cx - hw - 1, b - y - 1, hw * 2 + 2, 1); P(g, c, cx - hw, b - y - 1, hw, 1); P(g, dn(c, .25), cx, b - y - 1, hw, 1); } };
const pole = (g, x, y, h, c = '#6a6490') => { R(g, OUT, x - 1, y, 3, h); P(g, c, x, y, 1, h); };

// les 16 sortes de bâtiments : largeur, hauteur de départ, dessin fixe, et ce qui bouge
const KIND = [
  {w: 16, h: 16, draw(g, x, b, h, c, s) { blk(g, x - 8, b - h, 16, h, '#c8d0e4'); P(g, c, x - 8, b - h + 4, 16, 2); R(g, OUT, x - 9, b - h - 1, 1, 1); R(g, OUT, x + 8, b - h - 1, 1, 1);
    for (const k of [-4, 3]) { R(g, OUT, x + k - 1, b - h + 8, 4, 4); R(g, NF > .3 ? '#ffd890' : N('#4a7ab0'), x + k, b - h + 9, 2, 2); } P(g, '#5a5478', x - 2, b - 5, 4, 5); pole(g, x + 5, b - h - 6, 6); },
    anim(g, x, b, h, t, s) { R(g, (t + s * 7 >> 5) % 3 ? '#5a1020' : '#ff4f6d', x + 5, b - h - 7, 1, 1); }},
  {w: 22, h: 12, draw(g, x, b, h, c, s) { P(g, '#5a5a78', x - 12, b - 3, 24, 3); dome(g, x, b - 3, Math.min(13, h), '#9fe8d0', true);
    const r = seeded(s); for (let k = 0; k < 7; k++) { const px = x - 8 + k * 2.6, ph = 2 + r() * 5 | 0; P(g, k % 2 ? c : dn(c, .25), px, b - 3 - ph, 2, ph); } }},
  {w: 26, h: 10, draw(g, x, b, h, c, s) { pole(g, x + 11, b - h - 10, h + 10, '#8a84a8'); R(g, '#ffd07a', x + 11, b - h - 11, 1, 1);
    for (let k = 0; k < 3; k++) { const px = x - 12 + k * 8; pole(g, px + 3, b - 5, 5); for (let j = 0; j < 4; j++) { R(g, OUT, px - 1 + j, b - 9 - j, 8, 2); P(g, j % 2 ? '#2a4aa0' : '#3a62c0', px + j, b - 9 - j, 6, 1); } P(g, '#9ac0ff', px + 4, b - 12, 2, 1); } }},
  {w: 24, h: 30, draw(g, x, b, h, c, s) { for (let y = 0; y < h - 6; y++) { const k = y / (h - 6) * 5; R(g, OUT, x - 8 + k - 1, b - y, 3, 1); P(g, '#8a7a6a', x - 8 + k, b - y, 1, 1); R(g, OUT, x + 8 - k - 1, b - y, 3, 1); P(g, '#6a5a4a', x + 8 - k, b - y, 1, 1); if (y % 6 === 3) P(g, '#7a6a5a', x - 8 + k, b - y, 16 - 2 * k, 1); }
    disc(g, x, b - h + 4, 4, (dx, dy, d) => d > 2.6 ? N('#d0c0a0') : d < 1 ? N('#5a4a3a') : null); blk(g, x - 12, b - 9, 9, 9, '#a08a70'); wins(g, x - 10, b - 7, 5, 5, s);
    for (let k = 0; k < 5; k++) P(g, k % 2 ? c : dn(c, .2), x + 5 + k, b - 2 - (k < 3 ? k : 4 - k), 1, 2 + (k < 3 ? k : 4 - k)); },
    anim(g, x, b, h, t) { const a = t / 30; R(g, '#ffe8b0', x + Math.cos(a) * 3, b - h + 4 + Math.sin(a) * 3, 1, 1); }},
  {w: 26, h: 24, draw(g, x, b, h, c, s) { for (const [ox, w, hh] of [[-12, 9, h], [-1, 8, h * .75 | 0]]) { blk(g, x + ox, b - hh + 3, w, hh - 3, '#b8d8f0'); disc(g, x + ox + w / 2 - .5, b - hh + 3, w / 2 | 0, (dx, dy) => dy < 0 ? N(dx < 0 ? '#e8f6ff' : '#a0c0e0') : null); P(g, c, x + ox, b - hh + 8, w, 1); }
    P(g, '#8a8aa8', x - 3, b - 8, 3, 2); pole(g, x + 9, b - h - 6, h + 6, '#9a94b8'); },
    anim(g, x, b, h, t, s) { for (let k = 0; k < 3; k++) { const q = (t / 2 + k * 30 + s * 9) % 90; R(g, rgba('#e8f0ff', ((1 - q / 90) * .55).toFixed(2)), x + 9 - 1 + q / 30, b - h - 8 - q / 4, 2 + q / 30 | 0, 2); } }},
  {w: 32, h: 30, draw(g, x, b, h, c, s) { pole(g, x - 14, b - h, h, '#a0a0c0'); pole(g, x + 14, b - h, h, '#a0a0c0'); R(g, OUT, x - 16, b - h - 2, 33, 4); P(g, '#ffd07a', x - 15, b - h - 1, 31, 2); for (let k = -14; k < 15; k += 4) R(g, OUT, x + k, b - h - 1, 1, 2);
    for (let y = 0; y < 8; y++) { const w = 22 - Math.abs(y - 4) * 2; R(g, OUT, x - w / 2 - 1, b - 10 + y, w + 2, 1); P(g, y < 3 ? up(c, .1) : '#8a8aa8', x - w / 2, b - 10 + y, w, 1); } R(g, '#5a5478', x + 2, b - h + 1, 1, h - 12); },
    anim(g, x, b, h, t, s) { if ((t + s * 13) % 50 < 6) for (let k = 0; k < 3; k++) R(g, k ? '#ffe08a' : '#ffffff', x + 2 + (Math.random() * 6 - 3), b - 11 - Math.random() * 3, 1, 1); }},
  {w: 22, h: 26, draw(g, x, b, h, c, s) { blk(g, x - 10, b - h + 10, 20, h - 10, '#9a94c0'); wins(g, x - 8, b - h + 13, 16, h - 16, s, 4, 4, '#bff4ff'); dome(g, x - 1, b - h + 10, 8, '#d8d0f0'); R(g, OUT, x - 2, b - h + 2, 3, 8); P(g, '#2a2050', x - 1, b - h + 3, 1, 7);
    pole(g, x + 8, b - h + 2, 8); disc(g, x + 10, b - h + 1, 3, (dx, dy) => dx >= -1 && dx <= 1 ? N(c) : null); }},
  {w: 30, h: 34, draw(g, x, b, h, c, s) { R(g, OUT, x - 16, b - 4, 33, 4); P(g, '#5a5478', x - 15, b - 3, 31, 3); for (let k = -13; k < 14; k += 5) R(g, '#ffd07a', x + k, b - 3, 2, 1);
    blk(g, x + 9, b - h + 4, 5, h - 8, '#a8a0c8'); blk(g, x + 6, b - h, 11, 6, '#c8c0e8'); R(g, NF > .2 ? '#bff4ff' : N('#4a8ad0'), x + 7, b - h + 2, 9, 2); },
    anim(g, x, b, h, t, s) { R(g, (t >> 4) % 2 ? '#ff4f6d' : '#5a1020', x + 11, b - h - 1, 1, 1); if (cityFx.rocket?.x === x) return; const ry = b - 4; R(g, OUT, x - 5, ry - 15, 7, 15); R(g, N('#e8e4f0'), x - 4, ry - 13, 5, 13); R(g, N(COLS[7]), x - 4, ry - 15, 5, 2); R(g, N('#4a8ad0'), x - 3, ry - 9, 3, 2); }},
  {w: 22, h: 70, draw(g, x, b, h, c, s) { blk(g, x - 6, b - h, 12, h, '#8aa0d0'); wins(g, x - 4, b - h + 6, 8, h - 10, s); tri(g, x - .5, b - h, 6, 8, '#c8d0f0'); }, anim(g, x, b, h, t, s) {
    const cy = b - h + 10; for (let a = 0; a < 40; a++) { const an = a / 40 * Math.PI * 2 + t / 160, fr = Math.sin(an) > 0, px = x + Math.cos(an) * 12, py = cy + Math.sin(an) * 3; if (fr || Math.abs(px - x) > 6) R(g, fr ? N(COLS[8]) : N(dn(COLS[8], .4)), px, py, 2, 1); }
    R(g, (t + s * 5 >> 5) % 2 ? '#ffffff' : '#7fe0ee', x - .5, b - h - 9, 1, 1); }},
  {w: 18, h: 60, draw(g, x, b, h, c, s) { blk(g, x - 9, b - 18, 18, 18, '#d8d4c0'); wins(g, x - 7, b - 15, 14, 12, s); R(g, OUT, x - 2, b - h, 5, h - 18); P(g, '#e8e4d0', x - 1, b - h, 3, h - 18);
    g.fillStyle = rgba(N('#e8e4ff'), .5); g.fillRect(x, 0, 1, b - h); }, anim(g, x, b, h, t, s) { const y = (b - h) * (.5 + .5 * Math.sin(t / 240 + s)); R(g, OUT, x - 2, y - 2, 5, 5); R(g, '#ffd07a', x - 1, y - 1, 3, 3); }},
  {w: 32, h: 44, draw(g, x, b, h, c, s) { blk(g, x - 15, b - h * .55, 30, h * .55, '#6a5a6a'); blk(g, x - 9, b - h * .8, 14, h * .25 + 1, '#7a6a7a'); for (const k of [-12, 8]) blk(g, x + k, b - h, 4, h * .45, '#5a4a5a');
    R(g, OUT, x - 7, b - 11, 14, 11); R(g, NF > .1 ? '#ffb040' : N('#ff9030'), x - 6, b - 10, 12, 10); R(g, '#ffe08a', x - 4, b - 7, 8, 5); wins(g, x - 13, b - h * .5, 5, h * .5 - 13, s, 3, 4, '#ffb070'); },
    anim(g, x, b, h, t, s) { for (const k of [-12, 8]) for (let q = 0; q < 3; q++) { const z = (t / 2 + q * 25 + s * 11 + k) % 75; R(g, rgba(N('#9a90a8'), ((1 - z / 75) * .6).toFixed(2)), x + k + z / 20, b - h - 3 - z / 3, 3 + z / 25 | 0, 3); } if ((t >> 2) % 9 === 0) R(g, '#ffe08a', x - 3 + (t % 7), b - 12 - (t % 5), 1, 1); }},
  {w: 26, h: 40, draw(g, x, b, h, c, s) { for (let y = 0; y < h - 8; y++) { const hw = 9 * (1 - y / (h - 8)) + 1; R(g, OUT, x - hw - 1, b - y, 2, 1); R(g, OUT, x + hw - 1, b - y, 2, 1); P(g, '#c8b070', x - hw, b - y, 1, 1); P(g, '#a08a50', x + hw - 1, b - y, 1, 1); if (y % 7 === 0) P(g, '#a08a50', x - hw, b - y, hw * 2, 1); }
    for (let k = -7; k <= 7; k++) { const dy = Math.round(k * k / 9); R(g, OUT, x + k, b - h + 4 + dy - 1, 1, 3); P(g, up(c, .2), x + k, b - h + 4 + dy, 1, 1); } R(g, '#fff6c8', x, b - h + 2, 1, 2); },
    anim(g, x, b, h, t, s) { if (NF < .6) { g.fillStyle = rgba('#fff0b0', (.12 + .08 * Math.sin(t / 9 + s)).toFixed(2)); g.fillRect(x, 0, 1, b - h + 2); } }},
  {w: 38, h: 40, draw(g, x, b, h, c, s) { const cy = b - h / 2 - 2, r = h / 2 - 2; blk(g, x - 16, b - 5, 8, 5, '#6a6490'); blk(g, x + 8, b - 5, 8, 5, '#6a6490');
    disc(g, x, cy, r + 1, (dx, dy, d) => d > r - 4 ? (d > r ? OUT : N(mixc('#8a84b0', '#ffffff', Math.max(0, -dy / r) * .4))) : null); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; R(g, N(c), x + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2), 1, 1); } },
    anim(g, x, b, h, t, s) { const cy = b - h / 2 - 2, r = h / 2 - 6; for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2 * 3 + t / 40, d = (k / 40) * r; R(g, k % 3 ? rgba(COLS[12], .75) : '#ffd0f4', x + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 1); } }},
  {w: 26, h: 60, draw(g, x, b, h, c, s) { blk(g, x - 7, b - h + 14, 14, h - 14, '#5a5a8a'); wins(g, x - 5, b - h + 18, 10, h - 22, s, 3, 3, '#8ee8a0');
    disc(g, x - .5, b - h + 12, 10, (dx, dy, d) => d > 9.4 ? OUT : dy > 6 ? null : N(mixc('#ff8ae6', '#7a2a6a', ((Math.sin(dx * 1.3) + Math.cos(dy * 1.7)) > .6 ? .45 : 0) + Math.max(0, dx / 10) * .3))); },
    anim(g, x, b, h, t, s) { const k = .5 + .5 * Math.sin(t / 25 + s); for (let n = 0; n < 6; n++) R(g, rgba('#ffffff', (k * .9).toFixed(2)), x - 6 + ((n * 37 + (t >> 4)) % 13), b - h + 6 + (n * 23 % 9), 1, 1); }},
  {w: 36, h: 50, draw(g, x, b, h, c, s) { for (const k of [-15, -8, 7, 14]) pole(g, x + k, b - h + 6, h - 6, '#4a4470'); R(g, OUT, x - 17, b - h + 4, 35, 3); P(g, '#6a6490', x - 16, b - h + 5, 33, 1); blk(g, x - 17, b - 6, 35, 6, '#3a3460');
    disc(g, x, b - h / 2 - 2, 10, (dx, dy, d) => d > 9.4 ? '#8a5af0' : '#000000'); }, anim(g, x, b, h, t, s) {
    const cy = b - h / 2 - 2; for (let a = 0; a < 60; a++) { const an = a / 60 * Math.PI * 2 + t / 50, fr = Math.sin(an) > 0, px = x + Math.cos(an) * 16, py = cy + Math.sin(an) * 4; if (fr || Math.hypot(px - x, py - cy) > 10) R(g, fr ? (a % 4 ? '#ffb040' : '#fff0b0') : '#a05020', px, py, 1, 1); } }},
  {w: 24, h: 80, draw(g, x, b, h, c, s) { tri(g, x - .5, b, 18, h, '#c8b8ff'); for (let y = 6; y < h - 10; y += 9) P(g, '#f0e8ff', x - 1, b - y - 4, 1, 3); tri(g, x - 9, b, 7, h * .4, '#a090e0'); tri(g, x + 8, b, 7, h * .32, '#a090e0'); },
    anim(g, x, b, h, t, s) { for (let k = 0; k < 3; k++) { const y = b - h - 6 - k * 7 + Math.sin(t / 30 + k * 2 + s) * 2, px = x - 4 + k * 4; R(g, OUT, px - 1, y - 2, 4, 5); R(g, k === 1 ? '#ffffff' : '#d8c8ff', px, y - 1, 2, 3); } }},
];
// où se tient chaque quartier : les 8 premières sortes devant (au sol, y = 300), les 8 suivantes derrière (y = 236)
const plot = i => i < 8 ? {x: i * 80, b: 300, row: 0} : {x: (i - 8) * 80, b: 236, row: 1};
function structures(i, n) {  // les bâtiments d'un quartier : de 1 à 4, plus hauts quand il y en a beaucoup
  const K = KIND[i], p = plot(i), c = Math.min(4, 1 + Math.floor(Math.log(n) / Math.log(5))), grow = 1 + Math.min(.5, Math.log10(n) * .18), out = [];
  const gap = Math.min(K.w + 2, 76 / c);
  for (let j = 0; j < c; j++) { const r = seeded(i * 97 + j * 13 + 5); out.push({x: Math.round(p.x + 40 + (j - (c - 1) / 2) * gap + (c > 1 ? r() * 4 - 2 : 0)), b: p.b - (j % 2) * 2, h: Math.round(K.h * grow * (j % 2 ? .82 : 1) * (.94 + r() * .12)), s: i * 31 + j}); }
  return out.sort((a, b2) => a.b - b2.b || a.h - b2.h);
}
function site(g, x, b, t) {  // le chantier de la prochaine sorte de bâtiment
  pole(g, x - 8, b - 20, 20, '#5a5478'); pole(g, x + 8, b - 20, 20, '#5a5478'); for (let y = b - 20; y < b; y += 6) P(g, '#5a5478', x - 8, y, 17, 1);
  pole(g, x, b - 32, 32, '#e0b860'); R(g, OUT, x - 12, b - 33, 26, 2); P(g, '#e0b860', x - 11, b - 33, 24, 1); R(g, '#222', x + 10 - ((t >> 5) % 6), b - 32, 1, 8); R(g, (t >> 4) % 2 ? '#ff4f6d' : '#5a1020', x, b - 34, 1, 1);
  for (const cx of [x - 14, x + 13]) { R(g, '#ff7a2f', cx, b - 3, 3, 3); R(g, '#ffffff', cx, b - 2, 3, 1); }
}
function station(g, x, y, col, t) {  // une mégastructure : une station en orbite, son anneau qui tourne
  const ring = front => { for (let a = 0; a < 60; a++) { const an = a / 60 * Math.PI * 2 + t / 200; if ((Math.sin(an) > 0) === front) R(g, front ? col : dn(col, .45), x + Math.cos(an) * 18, y + Math.sin(an) * 5, 2, 2); } };
  ring(false); R(g, '#2f6bc0', x - 15, y - 1, 8, 3); R(g, '#2f6bc0', x + 8, y - 1, 8, 3);
  R(g, OUT, x - 4, y - 7, 9, 14); R(g, '#c0c0d0', x - 3, y - 6, 7, 12); R(g, col, x - 3, y - 1, 7, 2); R(g, (t >> 4) % 2 ? '#ffffff' : col, x, y - 9, 1, 2);
  ring(true);
}
// les images faites une fois : la grosse lune, le soleil et la petite lune, les collines
const memo = {};
function moonImg(pc, sky) {
  const key = 'm' + pc + sky; if (memo[key]) return memo[key];
  const cv = document.createElement('canvas'), r = 26; cv.width = cv.height = r * 2 + 4; const g = cv.getContext('2d');
  disc(g, r + 2, r + 2, r, (dx, dy, d) => { const lt = (-dx * .6 - dy * .8) / r, band = Math.sin(dy / 2.8 + Math.sin(dx / 9)) * .08; let c = mixc(pc, '#ffffff', Math.max(0, lt) * .35 + band); if (lt < -.1) c = mixc(c, sky, Math.min(.85, -lt * .9)); return d > r - 1.2 ? mixc(c, sky, .35) : c; });
  for (const [cx, cy, cr] of [[-9, -5, 4], [7, 9, 5], [5, -13, 2]]) disc(g, r + 2 + cx, r + 2 + cy, cr, (dx, dy) => Math.hypot(cx + dx, cy + dy) < r - 2 ? mixc(pc, sky, .35) : null);
  return memo[key] = cv;
}
function glow(r, col) {
  const key = 'g' + r + col; if (memo[key]) return memo[key];
  const cv = document.createElement('canvas'), z = Math.ceil(r * 2.6); cv.width = cv.height = z * 2; const g = cv.getContext('2d');
  disc(g, z, z, z - 1, (dx, dy, d) => d < r ? mixc(col, '#ffffff', Math.max(0, (-dx - dy) / r * .3)) : rgba(col, (.22 * (1 - (d - r) / (z - r))).toFixed(3)));
  return memo[key] = cv;
}
function hills(k) {
  const key = 'h' + k; if (memo[key]) return memo[key];
  const r = seeded(900 + k), p = Array.from({length: 6}, () => r() * 6.28), f = [], n = [];
  for (let x = 0; x < W; x += 2) { f.push(Math.round(40 + 18 * Math.sin(x / 71 + p[0]) + 10 * Math.sin(x / 27 + p[1]) + 4 * Math.sin(x / 8 + p[2]))); n.push(Math.round(16 + 9 * Math.sin(x / 43 + p[3]) + 5 * Math.sin(x / 17 + p[4]) + 2 * Math.sin(x / 6 + p[5]))); }
  return memo[key] = {f, n};
}

/* ---- la ville fixe (collines, quartiers, routes), redessinée seulement quand elle change ---- */
let cityFx = null;
const buffL = k => cityFx ? cityFx.buffs.reduce((x, b) => b.k === k && b.until > cityFx.tick ? x + b.m : x, 0) : 0;
function drawStatic(g, s, Pl, pk, top) {
  g.clearRect(0, 0, W, H);
  const M = hills(pk), fc = mixc(Pl.hill[0], top, .45 + NF * .15), nc = mixc(Pl.hill[1], top, .2 + NF * .2);
  for (let x = 0; x < W; x += 2) { const h = M.f[x >> 1]; R(g, fc, x, 236 - h, 2, h); if (Pl.snow && h > 44) R(g, mixc('#ffffff', top, .25 + NF * .35), x, 236 - h, 2, Math.min(5, h - 44)); }
  const fr = seeded(77 + pk), far = Math.min(90, totB(s) / 4 | 0), fcol = mixc(nc, top, .3);
  for (let k = 0; k < far; k++) { const x = fr() * W | 0, h = 6 + fr() * 30 | 0; R(g, fcol, x, 230 - h, 6, h); if (NF > .3 && fr() < .7) R(g, rgba('#ffd07a', .5), x + 2, 230 - h + 3 + (fr() * 6 | 0), 1, 1); }
  for (let x = 0; x < W; x += 2) { const h = M.n[x >> 1]; R(g, nc, x, 238 - h, 2, h); if (Pl.lava && (x * 7) % 46 < 2) R(g, rgba('#ff6a2a', (.3 + NF * .5).toFixed(2)), x, 238 - h + 3, 1, h - 3); }
  // le sol des quartiers du fond, la terrasse, puis ceux de devant
  P(g, dn(Pl.ground, .15), 0, 234, W, 66); P(g, up(Pl.ground, .12), 0, 236, W, 1); P(g, up(Pl.ground, .06), 0, 237, W, 5);
  for (let x = 0; x < W; x += 80) P(g, dn(Pl.ground, .3), x, 237, 1, 5);
  const nxt = tiers() - 1;
  const row = r => { for (let i = r ? 8 : 0; i < (r ? 16 : 8); i++) { const n = s.b[i] || 0; if (!n) { if (i === nxt && i < 16) site(g, plot(i).x + 40, plot(i).b, 0); continue; } for (const st of structures(i, n)) KIND[i].draw(g, st.x, st.b, st.h, COLS[i], st.s); } };
  row(1);
  g.fillStyle = rgba(top, .1 + NF * .05); g.fillRect(0, 120, W, 122);           // la brume du fond
  P(g, dn(Pl.ground, .05), 0, 242, W, 58); P(g, up(Pl.ground, .18), 0, 242, W, 1);
  if (totB(s) >= 30) { for (let x = 30; x < W; x += 80) pole(g, x, 254, 46, '#4a4470'); R(g, OUT, 0, 251, W, 4); P(g, '#6a6490', 0, 252, W, 2); }   // le monorail
  row(0);
  // trottoir, route, réverbères, premier plan
  P(g, up(Pl.ground, .22), 0, 300, W, 1); P(g, up(Pl.ground, .1), 0, 301, W, 9); for (let x = 0; x < W; x += 16) P(g, Pl.ground, x, 301, 1, 9);
  R(g, N('#1a1430'), 0, 310, W, 18); R(g, N('#2a2248'), 0, 310, W, 1); for (let x = 0; x < W; x += 24) R(g, N('#5a5080'), x, 319, 10, 1);
  for (let x = 40; x < W; x += 80) { pole(g, x, 288, 22, '#5a5478'); R(g, N('#5a5478'), x, 288, 5, 1); R(g, NF > .35 ? '#fff0b0' : N('#8a84a8'), x + 4, 289, 2, 1); }
  R(g, N('#3a2a6e'), 0, 328, W, 2); P(g, dn(Pl.ground, .35), 0, 330, W, 30);
  const pr = seeded(55 + pk); for (let k = 0; k < 60; k++) { const x = pr() * W | 0, y = 338 + pr() * 18 | 0, h = 2 + pr() * 4 | 0; P(g, Pl.flora, x, y - h, 1, h); P(g, dn(Pl.flora, .3), x + 1, y - h + 1, 1, h - 1); }
}
const CARS = ['#ff5ad9', '#7fe0ee', '#ffd07a', '#8ee8a0', '#ff7a4f', '#e8e4f0'];
function person(g, x, y, k, t, big) {  // un habitant : petit dans la ville, détaillé quand on zoome (y = ses pieds)
  const skin = ['#f0d0b0', '#c89070', '#8a5a3a', '#e8c0a0'][k % 4], shirt = CARS[k % 6], st = ((t >> 3) + k) & 1;
  if (!big) { R(g, N(skin), x, y - 4, 1, 1); R(g, N(shirt), x, y - 3, 1, 2); R(g, N('#2a2248'), x - (st ? 1 : 0), y - 1, 1, 1); R(g, N('#2a2248'), x + (st ? 1 : 0), y - 1, 1, 1); return; }
  // en gros plan : 4 × 8 pixels du monde, chacun dessiné en 2 × 2 comme la ville zoomée
  const q = (c, i, j, w = 1, h = 1) => R(g, N(c), x + (i - 2) * 2, y - (8 - j) * 2, w * 2, h * 2), pants = ['#2a2248', '#3a4a7a', '#4a3020', '#1a1a2a'][k % 4];
  q(['#3a2010', '#e0c060', '#1a1010', '#a04020'][k % 4], 1, 0, 2); q(skin, 1, 1, 2); q(shirt, 0, 2, 4, 2); q(dn(shirt, .3), 3, 2, 1, 2); q(shirt, 1, 4, 2); q(pants, 1, 5, 2);
  if (st) { q(pants, 0, 6, 1, 2); q(pants, 3, 6, 1, 2); } else q(pants, 1, 6, 2, 2);
  if (NF > .5 && k % 3 === 0) R(g, '#fff0b0', x + 4, y - 9, 2, 2);
}

/* ---- chaque image : le ciel, la ville fixe, ce qui bouge, puis le zoom ---- */
const FONT = n => n + 'px "Press Start 2P", monospace';
// la police pixel n'a pas toutes les capitales accentuées : en capitales, le texte du canevas les perd
function txt(g, s, x, y, col = '#ffd07a', n = 8, al = 'left') { if (s === s.toUpperCase()) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); g.font = FONT(n); g.textAlign = al; g.fillStyle = '#05010b'; g.fillText(s, x + 1, y + 1); g.fillStyle = col; g.fillText(s, x, y); g.textAlign = 'left'; }
// les petites icônes des ressources (la police n'a pas ⌬ ✦ ◆) : crédit, singularité, matière noire
const ICONS = {cr: ['.aaa.', 'abbba', 'abcba', 'abbba', '.aaa.'], sing: ['..a..', '..a..', 'aabaa', '..a..', '..a..'], dm: ['..a..', '.aba.', 'abbba', '.aba.', '..a..']};
function icon(g, k, x, y) { const pal = {cr: {a: '#a07a30', b: '#ffd07a', c: '#fff0b0'}, sing: {a: '#ff5ad9', b: '#ffffff'}, dm: {a: '#5a2a9a', b: '#b46aee'}}[k]; ICONS[k].forEach((r, j) => { for (let i = 0; i < 5; i++) if (pal[r[i]]) R(g, pal[r[i]], x + i, y + j); }); }
const ease = k => k * k * (3 - 2 * k);
function crop() {  // la partie du monde qu'on voit : toute la ville, ou un quartier en gros plan
  const fx = cityFx, z = ease(fx.zk), i = fx.zoom ?? fx.lastZoom ?? 0, p = plot(i);
  const tw = W / 2, th = H / 2, tx = Math.max(0, Math.min(W - tw, p.x + 40 - tw / 2)), ty = Math.max(0, Math.min(H - th, p.b - th * .62));
  return {x: tx * z, y: ty * z, w: W - (W - tw) * z, h: H - (H - th) * z, k: W / (W - (W - tw) * z)};
}
function streetY(i) { return plot(i).b + (i < 8 ? 7 : 3); }
function walkers(i, n) { return n ? Math.min(12, 2 + Math.floor(Math.log2(n) * 1.5)) : 0; }
const ping = (v, len) => { const m = ((v % (2 * len)) + 2 * len) % (2 * len); return m < len ? m : 2 * len - m; };
function draw() {
  const fx = cityFx, s = S(), Pl = planet(), pk = PLANETS.indexOf(Pl), t = fx.tick, g = fx.sg;
  const ph = fx.phase ?? (Date.now() / 240000) % 1, sa = Math.sin(ph * Math.PI * 2), day = Math.max(0, Math.min(1, sa * 2.5 + .5)), dusk = Math.max(0, 1 - Math.abs(sa) * 3.5);
  const nf = Math.round((1 - day) * 16) / 16; if (nf !== NF) { NF = nf; fx.dirty = 1; }
  const top = mixc(Pl.sky[0], Pl.sky[2], day), hor = mixc(Pl.sky[1], Pl.sky[3], day);
  for (let y = 0; y < 244; y += 4) { let c = mixc(top, hor, Math.pow(y / 244, 1.5)); if (dusk) c = mixc(c, Pl.sky[4], dusk * Math.pow(y / 244, 2.5) * .8); R(g, c, 0, y, W, 4); }
  if (NF > .05) { const r = seeded(5 + pk); for (let i = 0; i < 200; i++) { const x = r() * W | 0, y = r() * 220 | 0, tw = (i * 7 + (t >> 4)) % 13; R(g, 'rgba(255,255,255,' + (NF * (tw === 0 ? 1 : tw < 3 ? .3 : .65)).toFixed(2) + ')', x, y); } }
  if (Pl.aurora && NF > .3) for (let x = 0; x < W; x += 2) { const y = 40 + Math.sin(x / 60 + t / 200) * 16 + Math.sin(x / 15 + t / 90) * 5 | 0, a = Math.max(0, NF * (.16 + .1 * Math.sin(x / 34 + t / 70))); g.fillStyle = rgba(Pl.aurora, a.toFixed(3)); g.fillRect(x, y, 2, 30); g.fillStyle = rgba(Pl.aurora, (a * .45).toFixed(3)); g.fillRect(x, y + 30, 2, 20); }
  const sx = -24 + (ph / .5) * (W + 48), sy = 236 - sa * 205, mph = (ph + .5) % 1, msa = Math.sin(mph * Math.PI * 2);
  if (sa > -.15) { const im = glow(8, '#fff0c0'); g.drawImage(im, sx - im.width / 2 | 0, sy - im.height / 2 | 0); }
  if (msa > -.15) { const im = glow(5, '#e8e4ff'); g.drawImage(im, -24 + (mph / .5) * (W + 48) - im.width / 2 | 0, 236 - msa * 205 - im.height / 2 | 0); }
  if (s.b[11] && sa > -.15) for (let k = 0; k < 28; k++) { const an = k / 28 * Math.PI * 2 + t / 300 * (k % 2 ? 1 : -1), rr = 16 + k % 3 * 5; R(g, '#ffd07a', sx + Math.cos(an) * rr, sy + Math.sin(an) * rr * .4); }
  g.globalAlpha = .6 + NF * .4; const mi = moonImg(Pl.accent, Pl.sky[0]); g.drawImage(mi, 548 - mi.width / 2, 66 - mi.height / 2); g.globalAlpha = 1;
  if (s.sings) { for (let a = 0; a < 70; a++) { const an = a / 70 * Math.PI * 2 + t / 400; R(g, rgba('#ff5ad9', (.35 + .3 * Math.sin(an * 3 + t / 30)).toFixed(2)), 548 + Math.cos(an) * 40, 66 + Math.sin(an) * 9, 1, 1); } }
  const megas = s.b.slice(16).filter(n => n > 0).length;
  for (let k = 0; k < Math.min(8, megas); k++) station(g, 50 + k * 66, 52 + (k % 2) * 26, bcol(16 + k), t + k * 50);
  const cr = seeded(31 + pk), cc = mixc(mixc(hor, '#ffffff', .55), '#2a2050', NF * .7);
  for (let k = 0; k < 8; k++) { const w = 36 + cr() * 60 | 0, y = 50 + cr() * 120 | 0, sp = .02 + cr() * .04, x = ((cr() * (W + 160) + t * sp) % (W + 160)) - 80 | 0; g.fillStyle = rgba(cc, .5); g.fillRect(x, y, w, 5); g.fillRect(x + 6, y - 4, w - 16, 4); g.fillRect(x + w * .35 | 0, y - 7, w * .3 | 0, 3); g.fillStyle = rgba(mixc(cc, '#ffffff', .35), .35); g.fillRect(x + 7, y - 4, w - 20, 1); }
  for (const sh of fx.ships) {
    if (sh.cargo) { R(g, OUT, sh.x - 1, sh.y - 1, 20, 8); R(g, '#ffd07a', sh.x, sh.y, 18, 6); R(g, '#ffffff', sh.x + 12, sh.y + 1, 5, 2); R(g, '#ff7a4f', sh.x - 3 - (t >> 2) % 2, sh.y + 1, 3, 4); R(g, '#a07a30', sh.x, sh.y + 5, 18, 1); }
    else { R(g, '#d9c6ff', sh.x, sh.y, 6, 2); R(g, '#7fe0ee', sh.x + (sh.v > 0 ? -2 : 6), sh.y, 2, 2); for (let k = 1; k < 5; k++) R(g, rgba('#7fe0ee', (.4 - k * .07).toFixed(2)), sh.x + (sh.v > 0 ? -2 - k * 2 : 7 + k * 2), sh.y, 1, 1); }
  }
  // la ville fixe
  const key = s.b.join(',') + '|' + pk + '|' + NF + '|' + tiers() + '|' + (totB(s) >= 30);
  if (fx.dirty || key !== fx.key) { drawStatic(fx.stg, s, Pl, pk, top); fx.key = key; fx.dirty = 0; fx.structs = []; for (let i = 0; i < 16; i++) if (s.b[i]) for (const st of structures(i, s.b[i])) fx.structs.push([i, st]); }
  g.drawImage(fx.st, 0, 0);
  for (const [i, st] of fx.structs) KIND[i].anim?.(g, st.x, st.b, st.h, t, st.s);
  if (totB(s) >= 30) { const tx = (t * 1.3 % (W + 300)) - 150 | 0; for (let c = 0; c < 3; c++) { const x = tx + c * 22; R(g, OUT, x - 1, 242, 21, 10); R(g, N('#e8e4f0'), x, 243, 19, 8); R(g, N(Pl.accent), x, 249, 19, 1); for (let w = 0; w < 4; w++) R(g, NF > .3 ? '#ffd890' : N('#4a6a9a'), x + 2 + w * 4, 245, 2, 2); } }
  if (fx.rocket) { const r = fx.rocket, x = r.x | 0, y = r.y | 0; for (let k = 0; k < 12; k++) R(g, rgba('#d8d0e8', (.5 - k * .04).toFixed(2)), x - 3 - k / 3, y + 2 + k * 4, 5 + k / 1.5, 4); R(g, OUT, x - 5, y - 15, 7, 15); R(g, '#e8e4f0', x - 4, y - 13, 5, 13); R(g, COLS[7], x - 4, y - 15, 5, 2); R(g, (t >> 1) % 2 ? '#ffe08a' : '#ff7a2f', x - 4, y, 5, 3 + (t >> 1) % 3); }
  // les habitants (petits), les voitures
  const zi = fx.zk > .5 ? fx.zoom ?? fx.lastZoom : -1;
  for (let i = 0; i < 16; i++) { if (i === zi) continue; const n = walkers(i, s.b[i] || 0), p = plot(i), y = streetY(i); for (let k = 0; k < n; k++) person(g, p.x + 3 + ping(t * (.1 + (k % 3) * .04) + k * 37, 74) | 0, y, k + i, t, false); }
  const nv = totB(s) ? Math.min(12, 1 + Math.floor(totB(s) / 15)) : 0;
  for (let k = 0; k < nv; k++) {
    const dir = k % 2 ? -1 : 1, y = dir > 0 ? 313 : 322, x = ((k * 97 + dir * t * (.5 + (k * 37 % 10) / 14)) % (W + 30) + W + 30) % (W + 30) - 15 | 0, c = CARS[k % 6];
    R(g, rgba('#7fe0ee', .45), x + 1, y + 4, 8, 1); R(g, OUT, x - 1, y - 2, 12, 6); R(g, N(c), x, y, 10, 3); R(g, N(up(c, .35)), x + 2, y - 1, 6, 1); R(g, '#9ad8ff', x + (dir > 0 ? 6 : 2), y, 2, 1);
    R(g, '#fff6c8', dir > 0 ? x + 10 : x - 1, y + 1, 1, 1); R(g, '#ff4f6d', dir > 0 ? x - 1 : x + 10, y + 1, 1, 1);
    if (NF > .4) { g.fillStyle = rgba('#fff6c8', (NF * .22).toFixed(2)); g.fillRect(dir > 0 ? x + 11 : x - 11, y, 10, 3); }
  }
  for (let x = 40; x < W; x += 80) if (NF > .35) { g.fillStyle = rgba('#fff0b0', (NF * .12).toFixed(2)); g.fillRect(x - 3, 290, 14, 20); }
  // les événements des quartiers : un vaisseau qui arrive, une fête
  for (const e of fx.events) {
    const p = plot(e.i), cx = p.x + 40;
    if (e.k === 'ship') { const y = e.y | 0; R(g, OUT, cx - 8, y - 4, 17, 7); R(g, '#c8d0f0', cx - 7, y - 3, 15, 5); R(g, Pl.accent, cx - 7, y, 15, 1); R(g, '#9ad8ff', cx - 2, y - 3, 5, 2); if (e.st !== 'wait') R(g, (t >> 1) % 2 ? '#ffe08a' : '#ff7a2f', cx - 2, y + 3, 5, 2 + (t >> 1) % 3); else { R(g, OUT, cx - 10, y + 2, 3, 3); R(g, OUT, cx + 8, y + 2, 3, 3); } }
    else { const y = p.b - (e.i < 8 ? 44 : 70); for (let k = 0; k < 9; k++) { const x = p.x + 4 + k * 9, yy = y + Math.round(Math.sin(k / 8 * Math.PI) * 6); R(g, CARS[k % 6], x, yy, 2, 2); if (k) R(g, rgba('#ffffff', .4), x - 7, yy - 1 + (k % 2), 7, 1); }
      if (e.won || (t + e.i * 17) % 70 < 26) { const q = e.won ? (t - e.won) % 40 : (t + e.i * 17) % 70, fy = y - 24 - q / 2, c = CARS[(t / 70 | 0) % 6]; for (let k = 0; k < 10; k++) R(g, c, cx + Math.cos(k / 10 * 6.28) * q / 2, fy + Math.sin(k / 10 * 6.28) * q / 2, 1, 1); } }
  }
  for (const m of fx.meteors) { for (let k = 14; k > 0; k--) R(g, rgba(k < 5 ? '#ffe08a' : '#ff7a2f', ((1 - k / 15) * .8).toFixed(2)), m.x - m.vx * k * 2, m.y - m.vy * k * 2, 2, 2); R(g, rgba('#ffe08a', .3), m.x - 4, m.y - 4, 9, 9); R(g, OUT, m.x - 2, m.y - 2, 5, 5); R(g, '#fff6c8', m.x - 1, m.y - 1, 3, 3); }
  if (fx.merch) {
    const m = fx.merch, x = m.x | 0, y = m.y + Math.sin(t / 20) * 2 | 0;
    R(g, rgba('#7fe0ee', (.45 + .3 * Math.sin(t / 5)).toFixed(2)), x - 9, y + 7, 18, 2);
    R(g, OUT, x - 17, y - 1, 34, 8); R(g, '#e0b860', x - 16, y, 32, 6); R(g, '#fff0b0', x - 14, y, 28, 1); R(g, '#a07a30', x - 16, y + 5, 32, 1);
    R(g, OUT, x - 7, y - 7, 14, 7); R(g, '#9ad8ff', x - 6, y - 6, 12, 6); R(g, '#ffffff', x - 4, y - 5, 2, 2);
    for (let k = 0; k < 5; k++) R(g, ((t >> 3) + k) % 5 === 0 ? '#ffffff' : '#ff8ae6', x - 13 + k * 6, y + 2, 2, 1);
  }
  for (const b of fx.booms) { const r = (22 - b.t) * 1.3; for (let k = 0; k < 12; k++) R(g, rgba('#ffe08a', (b.t / 22).toFixed(2)), b.x + Math.cos(k / 12 * Math.PI * 2) * r, b.y + Math.sin(k / 12 * Math.PI * 2) * r, 2, 2); }
  // à l'écran : la ville entière ou un quartier en gros plan, puis ce qui se dessine par-dessus
  const G = fx.g, c = crop(); G.imageSmoothingEnabled = false;
  G.drawImage(fx.scene, c.x, c.y, c.w, c.h, 0, 0, W, H);
  const toS = (x, y) => [(x - c.x) * c.k, (y - c.y) * c.k];
  if (fx.zk > .98 && fx.zoom != null) zoomOverlay(G, fx.zoom, toS, t);
  else for (const e of fx.events) { const p = plot(e.i), [ex, ey] = toS(p.x + 40, p.b - (e.i < 8 ? 64 : 100) + Math.sin(t / 14 + e.i) * 2); bubble(G, ex, ey, e.k, t); }
  if (fx.merch?.st === 'wait' && !fx.offer && fx.zk < .02) { const by = fx.merch.y - 24 + ((t >> 4) % 2); R(G, OUT, fx.merch.x - 6, by, 13, 14); R(G, '#ffffff', fx.merch.x - 5, by + 1, 11, 12); R(G, '#ff4f6d', fx.merch.x - 1, by + 3, 3, 5); R(G, '#ff4f6d', fx.merch.x - 1, by + 10, 3, 2); }
  for (const p of fx.pops) txt(G, p.text, p.x, p.y, '#ffd07a', 8);
  if (fx.flash) { G.fillStyle = 'rgba(255,208,244,' + fx.flash / 50 + ')'; G.fillRect(0, 0, W, H); }
  if (fx.banner) { G.fillStyle = 'rgba(7,3,26,.72)'; G.fillRect(0, 92, W, 30); txt(G, fx.banner.text, W / 2, 112, '#ffd07a', 10, 'center'); }
  G.fillStyle = 'rgba(7,3,26,.66)'; G.fillRect(0, 0, W, 28); G.fillStyle = '#3a2a6e'; G.fillRect(0, 28, W, 1);
  G.font = FONT(9); const cw = G.measureText(fmt(L(s.cr))).width; txt(G, fmt(L(s.cr)), 10, 13, '#ffd07a', 9); icon(G, 'cr', 14 + cw, 5); txt(G, '+' + fmt(prod()) + ' / s', 10, 24, '#d9c6ff', 6);
  txt(G, T(Pl.name).toUpperCase() + ' · ' + T('COLONIE') + ' ' + (s.colonies + 1) + (s.ch ? ' · ' + T('DÉFI') : ''), W - 10, 13, '#d9c6ff', 6, 'right');
  if (s.singTot) { const a = nint(s.sing), b = fmt(L(s.dm)); G.font = FONT(6); const wb = G.measureText(b).width; icon(G, 'dm', W - 15, 18); txt(G, b, W - 19, 24, '#b46aee', 6, 'right'); icon(G, 'sing', W - 33 - wb, 18); txt(G, a, W - 37 - wb, 24, '#ff8ae6', 6, 'right'); }
  if (fx.zk > .98 && fx.zoom != null) { R(G, OUT, 8, 36, 92, 20); R(G, '#2a1d52', 9, 37, 90, 18); txt(G, '← ' + T('VILLE'), 18, 50, '#ffffff', 7); }
  if (fx.offer) offerPanel(G);
}
function bubble(g, x, y, k, t) {  // le signe d'un événement au-dessus de son quartier
  R(g, OUT, x - 8, y - 8, 17, 15); R(g, '#ffffff', x - 7, y - 7, 15, 13); R(g, OUT, x - 1, y + 7, 3, 3); R(g, '#ffffff', x, y + 6, 1, 3);
  if (k === 'ship') { R(g, '#4a8ad0', x - 5, y - 1, 11, 3); R(g, '#9ad8ff', x - 2, y - 3, 5, 2); R(g, '#ff7a2f', x - 1, y + 2, 3, 2); }
  else for (let n = 0; n < 5; n++) R(g, CARS[(n + (t >> 4)) % 6], x - 5 + n * 2.4, y - 4 + (n % 2) * 5, 2, 2);
}
function zoomOverlay(g, i, toS, t) {  // le gros plan : les habitants en détail, l'événement à cliquer, le nom du quartier
  const s = S(), n = s.b[i] || 0, p = plot(i), fx = cityFx, ev = fx.events.find(e => e.i === i), wy = streetY(i);
  const np = walkers(i, n) + (ev?.k === 'fete' ? 6 : 0);
  for (let k = 0; k < np; k++) {
    let wx = p.x + 4 + ping(t * (.08 + (k % 4) * .03) + k * 41, 72), bob = 0;
    if (ev?.k === 'fete') { wx = p.x + 40 + Math.cos(k / np * 6.28 + t / 90) * 22; bob = ((t >> 3) + k) % 2; }
    else if (k % 5 === 4) wx = p.x + 20 + k * 3;   // certains discutent sur place
    const [x, y] = toS(Math.round(wx), wy); person(g, x | 0, (y | 0) - bob * 2, k + i * 3, ev?.k === 'fete' ? t * 2 : k % 5 === 4 ? 0 : t, true);
  }
  if (ev?.k === 'ship' && ev.st === 'wait') { const [x, y] = toS(p.x + 40, ev.y); R(g, rgba('#ffffff', (.3 + .3 * Math.sin(t / 6)).toFixed(2)), x - 20, y - 14, 41, 2); txt(g, T('CLIQUE : CARGAISON'), x, y - 22, '#ffffff', 6, 'center'); }
  if (ev?.k === 'fete' && !ev.won) { const [x, y] = toS(p.x + 40, wy - 30); txt(g, T('CLIQUE : REJOINDRE LA FÊTE'), x, y - 40, '#ffffff', 6, 'center'); }
  R(g, 'rgba(7,3,26,.72)', 0, H - 26, W, 26); txt(g, bname(i).toUpperCase() + ' · ' + nint(n), 10, H - 10, bcol(i), 8);
  txt(g, '+' + fmt(prodOf(i)) + ' / s · ' + nint(walkers(i, n) * 120 + n * 3) + ' ' + T('habitants'), W - 10, H - 10, '#d9c6ff', 6, 'right');
}
function offerPanel(g) {
  const o = cityFx.offer, n = o.length, cw = n > 3 ? 104 : 128, x0 = W / 2 - (n * cw + (n - 1) * 10) / 2;
  g.fillStyle = 'rgba(5,1,11,.6)'; g.fillRect(0, 0, W, H); R(g, OUT, 78, 70, 484, 220); R(g, '#24184a', 80, 72, 480, 216); R(g, '#e0b860', 80, 72, 480, 2);
  txt(g, T('LE MARCHAND'), W / 2, 96, '#ffd07a', 9, 'center'); txt(g, T('CHOISIS UN BONUS'), W / 2, 110, '#d9c6ff', 6, 'center');
  o.forEach((f, k) => { const bx = x0 + k * (cw + 10); R(g, OUT, bx - 1, 123, cw + 2, 112); R(g, '#3a2a6e', bx, 124, cw, 110); R(g, '#ffd07a', bx, 124, cw, 1); f.l.forEach((l, j) => txt(g, T(l), bx + cw / 2, 154 + j * 24, j === 1 ? '#ffd07a' : '#ffffff', j === 1 ? 11 : 6, 'center')); f.box = [bx, 124, cw, 110]; });
  txt(g, T('CLIC À CÔTÉ : NON MERCI'), W / 2, 270, '#8a84a8', 6, 'center');
}

/* ---- ce qui se passe à chaque instant (60 fois par seconde) ---- */
const OFFERS = [
  {k: 'prod', m: Math.log10(7), d: 1800, l: ['PRODUCTION', '×7', 'PENDANT 30 S']},
  {k: 'prod', m: L3, d: 7200, l: ['PRODUCTION', '×3', 'PENDANT 2 MIN']},
  {k: 'click', m: Math.log10(20), d: 1800, l: ['CLICS', '×20', 'PENDANT 30 S']},
  {k: 'cheap', m: L2, d: 3600, l: ['BÂTIMENTS', '−50 %', 'PENDANT 1 MIN']},
  {k: 'cargo', l: ['CARGAISON', '10 MIN', 'DE PRODUCTION']},
  {k: 'rain', l: ['PLUIE DE', 'MÉTÉORES', 'TOUT DE SUITE']},
];
function shower() { cityFx.shower = cityFx.tick + 900; cityFx.banner = {text: T('PLUIE DE MÉTÉORES !'), t: 150}; sfx('notify'); }
function callMerchant(now) { cityFx.merch = {x: now ? 520 : W + 34, y: 72, st: now ? 'wait' : 'in', t: 1800}; }
function pick(o) {
  const fx = cityFx;
  if (o.k === 'cargo') { const got = prod() + Math.log10(600); gain(got); fx.pops.push({text: '+' + fmt(got), x: 260, y: 150, t: 60}); }
  else if (o.k === 'rain') shower();
  else fx.buffs.push({k: o.k, m: o.m, until: fx.tick + o.d * (br('c3') ? 2 : 1)});
  fx.offer = null; if (fx.merch) fx.merch.st = 'out'; S().merch++; S().evc++; sfx('launch'); ui(true);
}
function spawnEvent(k, i) {
  const fx = cityFx, s = S(), own = [...Array(16).keys()].filter(j => s.b[j] > 0 && !fx.events.some(e => e.i === j));
  i ??= own[Math.random() * own.length | 0]; if (i == null || !(s.b[i] > 0)) return null;
  k ??= Math.random() < .5 ? 'ship' : 'fete';
  const e = {k, i, life: 3600, st: k === 'ship' ? 'in' : 'wait', y: -12}; fx.events.push(e); return e;
}
function update() {
  const fx = cityFx, s = S(), Pl = planet(), lk = luck(), t = fx.tick;
  if (t % 6 === 0) { const now = Date.now(); tickTime(Math.max(0, (now - s.last) / 1000)); s.last = now; }
  if (t % 60 === 0) {
    automate(); achCheck(); sample();
    if (s.ch && L(s.run) >= CHALLENGES[s.ch - 1].goal) { winChallenge(s.ch); s.ch = 0; save(); }
    ui(true);
  }
  if (t % 600 === 0) save();
  if (fx.flash) fx.flash--;
  if (fx.banner && --fx.banner.t <= 0) fx.banner = null;
  fx.zk = Math.max(0, Math.min(1, fx.zk + (fx.zoom != null ? .07 : -.07))); if (fx.zk === 0) fx.lastZoom = null;
  fx.buffs = fx.buffs.filter(b => b.until > t);
  fx.pops = fx.pops.filter(p => (p.y -= .4, --p.t > 0)); fx.booms = fx.booms.filter(b => --b.t > 0);
  if (lk && !fx.ships.some(sh => sh.cargo) && Math.random() < (Pl.cargo || 1) * lk / 2400) fx.ships.push({cargo: true, x: -24, y: 40 + Math.random() * 50, v: .6});
  if (t % 50 === 0 && fx.ships.length < 6) fx.ships.push({x: Math.random() < .5 ? -10 : W + 10, y: 70 + Math.random() * 90, v: 0});
  for (const sh of fx.ships) { if (!sh.v) sh.v = sh.x < 0 ? .4 + Math.random() * .5 : -.4 - Math.random() * .5; sh.x += sh.v; }
  fx.ships = fx.ships.filter(sh => sh.x > -30 && sh.x < W + 30);
  if (lk && t >= fx.nextShower) { shower(); fx.nextShower = t + (10800 + Math.random() * 10800) / lk; }
  if (fx.shower > t && t % 12 === 0) fx.meteors.push({x: 200 + Math.random() * 440, y: -8, vx: -1 - Math.random() * .5, vy: .7 + Math.random() * .3});
  for (const m of fx.meteors) { m.x += m.vx; m.y += m.vy; }
  fx.meteors = fx.meteors.filter(m => !m.hit && m.y < 230 && m.x > -20);
  const m = fx.merch;
  if (lk && !m && !fx.offer && t >= fx.nextMerch) callMerchant(false);
  if (m) {
    if (m.st === 'in') { m.x -= 1.1; if (m.x <= 520) { m.st = 'wait'; m.t = 1800 * (br('c3') ? 2 : 1); } }
    else if (m.st === 'wait') { if (!fx.offer && --m.t <= 0) { m.st = 'out'; fx.missed++; } }
    else { m.x += 1.4; m.y -= .3; if (m.x > W + 40) { fx.merch = null; fx.nextMerch = t + (18000 + Math.random() * 18000) / lk; } }
  }
  if (lk && t >= fx.nextEvent) { if (fx.events.length < 2) spawnEvent(); fx.nextEvent = t + (7200 + Math.random() * 7200) / lk; }
  for (const e of fx.events) {
    const goal = plot(e.i).b - 12;
    if (e.k === 'ship') { if (e.st === 'in') { e.y += Math.max(.4, (goal - e.y) / 40); if (e.y >= goal - .5) { e.y = goal; e.st = 'wait'; } } else if (e.st === 'out') e.y -= 2.2; }
    if (--e.life <= 0 && e.st !== 'out') { if (!e.won) fx.missed++; e.st = 'out'; e.gone = e.k === 'fete' || e.won ? 1 : 0; }
    if (e.k === 'fete' && e.won && t - e.won > 240) e.gone = 1;
  }
  fx.events = fx.events.filter(e => !e.gone && e.y > -20);
  // une fusée décolle du port spatial de temps en temps
  if (s.b[7] && !fx.rocket && t % 1500 === 900) { const st = fx.structs?.find(([i]) => i === 7)?.[1]; if (st) fx.rocket = {x: st.x, y: st.b - 4, v: 0}; }
  if (fx.rocket) { fx.rocket.v += .03; fx.rocket.y -= fx.rocket.v; if (fx.rocket.y < -40) fx.rocket = null; }
}
function gameLoop() {
  const fx = cityFx; cancelAnimationFrame(fx.raf);
  const STEP_MS = 1000 / 60; let acc = 0, last = performance.now();
  const f = now => {
    if (!view.classList.contains('on')) { fx.raf = 0; return; }
    fx.raf = requestAnimationFrame(f);
    acc += Math.min(250, now - last); last = now;
    while (acc >= STEP_MS) { update(); fx.tick++; acc -= STEP_MS; }
    draw();
  };
  fx.raf = requestAnimationFrame(f);
}

/* ---- les clics sur la ville ---- */
function toWorld(e) { const cv = $('apCv'), r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height, c = crop(); return {sx: x, sy: y, x: c.x + x / c.k, y: c.y + y / c.k}; }
const districtAt = (x, y) => { for (let i = 0; i < 16; i++) { const p = plot(i); if (x >= p.x && x < p.x + 80 && y <= p.b + 10 && y >= p.b - (i < 8 ? 64 : 130) && S().b[i] > 0) return i; } return null; };
function zoomTo(i) { const fx = cityFx; if (i == null) { if (fx.zoom != null) fx.lastZoom = fx.zoom; fx.zoom = null; } else { fx.zoom = i; fx.lastZoom = i; } }
function press(e) {
  const fx = cityFx, s = S(), {sx, sy, x, y} = toWorld(e);
  if (fx.offer) { const k = fx.offer.findIndex(o => o.box && sx >= o.box[0] && sx <= o.box[0] + o.box[2] && sy >= o.box[1] && sy <= o.box[1] + o.box[3]); if (k >= 0) pick(fx.offer[k]); else if (sx < 80 || sx > 560 || sy < 72 || sy > 288) { fx.offer = null; if (fx.merch) fx.merch.st = 'out'; } return; }
  if (fx.zoom != null && fx.zk > .5 && sx < 100 && sy > 34 && sy < 58) { zoomTo(null); return; }
  const met = fx.meteors.find(m => Math.hypot(x - m.x, y - m.y) < 14);
  if (met) { met.hit = true; const got = LG.add(Math.log10(5), prod() + Math.log10(8)); gain(got); s.meteors++; fx.booms.push({x: met.x, y: met.y, t: 22}); fx.pops.push({text: '+' + fmt(got), x: Math.min(W - 80, sx), y: sy, t: 40}); sfx('click'); return; }
  const m = fx.merch;
  if (m && m.st !== 'out' && Math.abs(x - m.x) < 20 && y > m.y - 26 && y < m.y + 12) { const pool = [...OFFERS].sort(() => Math.random() - .5); fx.offer = pool.slice(0, br('c3') ? 4 : 3); m.st = 'wait'; sfx('notify'); return; }
  const ev = fx.events.find(ev => { const p = plot(ev.i); return x >= p.x && x < p.x + 80 && (ev.k === 'ship' ? Math.abs(y - ev.y) < 12 || (fx.zoom == null && y > p.b - (ev.i < 8 ? 76 : 112) && y < p.b - (ev.i < 8 ? 50 : 86)) : y > p.b - (ev.i < 8 ? 76 : 112) && y < p.b + 10); });
  if (ev && fx.zoom !== ev.i) { zoomTo(ev.i); sfx('click'); return; }
  if (ev && fx.zk > .9 && !ev.won && ev.st === 'wait') {
    if (ev.k === 'ship') { const got = LG.add(0, prod() + Math.log10(120)); gain(got); s.landings++; ev.st = 'out'; ev.won = fx.tick; fx.pops.push({text: '+' + fmt(got), x: Math.min(W - 80, sx), y: sy - 10, t: 50}); }
    else { fx.buffs.push({k: 'prod', m: L3, until: fx.tick + 7200}); s.parties++; ev.won = fx.tick; fx.pops.push({text: T('PRODUCTION ×3'), x: Math.min(W - 110, sx), y: sy - 10, t: 60}); }
    s.evc++; sfx('launch'); ui(true); return;
  }
  const ship = fx.ships.find(sh => sh.cargo && Math.abs(x - sh.x - 9) < 15 && Math.abs(y - sh.y - 3) < 11);
  const got = ship ? Math.max(1, prod() + Math.log10(30)) : clickL();
  if (got > -Infinity) gain(got);
  s.clicks++; if (ship) { ship.cargo = false; ship.v *= 3; s.ships++; s.evc++; sfx('notify'); }
  if (got > -Infinity) fx.pops.push({text: '+' + fmt(got), x: Math.min(W - 80, sx), y: sy, t: 40});
  ui(true);
}

/* ================= la page : ressources, objectif, onglets ================= */
const confirmBox = host.confirm ? m => host.confirm(m) : async () => true;
const GEM = ['...aa...', '..abba..', '.abccba.', 'abccccba', 'abbccbba', '.abbbba.', '..abba..', '...aa...'];
const MEDAL = ['..aaaa..', '.abbbba.', 'abbccbba', 'abcbbcba', 'abcbbcba', 'abbccbba', '.abbbba.', '..aaaa..', '...dd...', '..d..d..'];
const HAND = ['...aa....', '..abba...', '..abba...', '..abbaaa.', '.aabbbbba', 'abbbbbbba', 'abbbbbbba', '.abbbbba.', '..abbba..', '...aaa...'];
const STAR = ['....a....', '...aba...', 'aaabcbaaa', '.abcccba.', '..abcba..', '.abcbcba.', '.aba.aba.', '.a.....a.'];
const HOLE = ['..aaaa..', '.abbbba.', 'abccccba', 'abcddcba', 'abcddcba', 'abccccba', '.abbbba.', '..aaaa..'];
const FLAG = ['aa......', 'abbbbba.', 'abccccba', 'abbbbba.', 'a.......', 'a.......', 'a.......', 'aa......'];
function sprite(rows, pal, w = 48, h = 42) {
  const cv = el('canvas', 'apIc'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), k = Math.floor(Math.min(w / rows[0].length, h / rows.length) * .7);
  const x0 = (w - rows[0].length * k) >> 1, y0 = (h - rows.length * k) >> 1;
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) { g.fillStyle = c; g.fillRect(x0 + i * k, y0 + j * k, k, k); } } });
  return cv;
}
const gem = (b, c) => () => sprite(GEM, {a: OUT, b, c});
function bIcon(i) {
  const cv = el('canvas', 'apIc'); cv.width = 48; cv.height = 42; const g = cv.getContext('2d'), nf = NF; NF = 0;
  if (i >= 16) station(g, 24, 21, bcol(i), 0);
  else {  // dessiné en vrai, puis réduit au pixel près
    const K = KIND[i], tmp = document.createElement('canvas'); tmp.width = 64; tmp.height = 130; const tg = tmp.getContext('2d');
    K.draw(tg, 32, 128, K.h, COLS[i], i + 1); K.anim?.(tg, 32, 128, K.h, 0, i + 1);
    const k = Math.min(1, 38 / (K.h + 12)), w = 64 * k, h = 130 * k; g.imageSmoothingEnabled = false; g.drawImage(tmp, 24 - w / 2 | 0, 40 - h | 0, w | 0, h | 0);
  }
  NF = nf; return cv;
}
function card(c) {
  if (c.big) { const d = el('div', 'apWide'), cv = c.big(); d.append(cv, el('small', 'hint', c.small)); return d; }
  const row = el('div', 'apCard px' + (c.off ? ' off' : '') + (c.got ? ' got' : '') + (c.wide ? ' apWide' : '')), tx = el('div', 'apTx');
  row.style.setProperty('--c', c.col || '#ffd07a'); tx.append(el('b', '', c.name), el('small', '', c.small));
  if (c.meter != null) { const m = el('div', 'apMeter'), f = el('i'); f.style.width = Math.max(0, Math.min(100, c.meter * 100)) + '%'; m.append(f); tx.append(m); }
  row.append(c.icon ? c.icon() : sprite(GEM, {a: OUT, b: c.col || '#ffd07a', c: '#ffffff'}), tx);
  if (c.btn) { const b = el('button', 'btn px apBtn' + (c.main ? ' main' : ''), c.btn); b.disabled = !c.on; b.onclick = async () => { b.blur(); if (await c.act() !== false) { sfx('notify'); ui(); save(); } }; row.append(b); }
  return row;
}
const frac = (x, goal, from = 0) => x === -Infinity ? 0 : Math.max(0, Math.min(1, (x - from) / (goal - from)));
function goal() {  // le prochain grand pas, avec sa barre
  const s = S();
  if (!totB(s)) return [T('Premier bâtiment'), T('Clique sur la ville pour gagner des crédits, puis achète un Module d’habitat.'), frac(L(s.cr), cost(0))];
  if (s.ch) { const c = CHALLENGES[s.ch - 1]; return [T('Défi : {n}', {n: T(c.name)}), T('Produis {g} crédits dans cette colonie. Règle : {r}.', {g: fmt(c.goal), r: T(c.rule)}), frac(L(s.run), c.goal)]; }
  if (!s.colonies && !s.sings && L(s.run) < memFloor()) return [T('Fonder une colonie'), T('Produis {g} crédits : tu pourras recommencer sur une autre planète avec des Mémoires.', {g: fmt(memFloor())}), frac(L(s.run), memFloor())];
  if (!s.sings) return [T('Première singularité'), T('Produis {g} crédits en tout (toutes colonies) : la ville s’effondre en singularité et la matière noire apparaît.', {g: fmt(SING_AT)}), frac(L(s.sAll), SING_AT)];
  if (!s.gals && s.singAll < GAL_AT) return [T('Ouvrir la galaxie'), T('Gagne {g} singularités ({n} pour l’instant) : l’exode vers la galaxie donne des Étoiles.', {g: GAL_AT, n: s.singAll}), s.singAll / GAL_AT];
  const left = CHALLENGES.findIndex((c, k) => !s.chDone[k + 1]);
  if (left >= 0) return [T('Défi suivant : {n}', {n: T(CHALLENGES[left].name)}), T('Récompense : {r}.', {r: T(CHALLENGES[left].reward)}), Object.keys(s.chDone).length / 8];
  const gg = galGain(); return [T('Prochaine Étoile'), T('Encore {n} singularités pour une Étoile de plus.', {n: Math.max(0, Math.ceil(GAL_AT * (gg + 1) ** 2) - s.singAll)}), frac(s.singAll, GAL_AT * (gg + 1) ** 2, GAL_AT * gg ** 2)];
}
function tip() {
  const s = S(), T2 = [
    [s.clicks < 8, 'Clique sur la ville : chaque clic rapporte des crédits.'],
    [!s.b[0], 'Achète un Module d’habitat : il produit des crédits chaque seconde, même NeoDex fermé.'],
    [totB(s) < 10, 'Tous les 25 exemplaires, un bâtiment produit deux fois plus. Chaque sorte a son quartier dans la ville.'],
    [cityFx?.events.length && cityFx.zoom == null, 'Une bulle au-dessus d’un quartier : clique dessus pour zoomer, puis sur le vaisseau ou la fête.'],
    [!Object.keys(s.up).length && ups().some(u => u.cost <= L(s.cr)), 'Une recherche est prête : onglet Recherches.'],
    [brOpen() && s.branch.length < brMax(), 'Choisis une doctrine pour cette colonie : Industrie, Science ou Commerce.'],
    [!s.meteors, 'De temps en temps, une pluie de météores traverse le ciel : clique sur les météores.'],
    [!s.merch, 'Un marchand passe parfois dans un vaisseau doré : clique dessus pour choisir un bonus.'],
    [memGain() >= 0 && !s.colonies, 'Tu peux fonder une nouvelle colonie : onglet Colonie.'],
    [PERKS.some(p => !(p.max && perk(p.id) >= p.max) && perkCost(p) <= memFree()), 'Tu as des Mémoires à dépenser : onglet Colonie.'],
    [singGain() > 0 && !s.sings, 'La singularité est prête : onglet Singularité.'],
    [LAWS.some(l => !s.laws[l.id] && l.cost <= s.sing), 'Tu as des singularités à dépenser en lois de la physique.'],
    [GAL.some((_, i) => canConquer(i)), 'Un système de la galaxie peut être conquis : onglet Galaxie.'],
  ];
  return T((T2.find(x => x[0]) || [0, 'Double-clique sur un quartier pour le voir de près. La nuit, la ville s’allume.'])[1]);
}
const TABS = [['b', 'BÂTIMENTS', () => true], ['r', 'RECHERCHES', () => true], ['d', 'DOCTRINE', brOpen], ['m', 'COLONIE', () => L(S().all) >= 9 || S().colonies > 0 || S().sings > 0],
  ['x', 'DÉFIS', chOpen], ['u', 'SINGULARITÉ', () => L(S().sAll) >= 40 || S().sings > 0], ['g', 'GALAXIE', () => S().singTot > 0], ['a', 'SUCCÈS', () => true], ['o', 'STATISTIQUES', () => true]];
let lastSig = '';
function ui(soft) {
  if (!cityFx) return;
  const s = S(), Pl = planet();
  // les ressources
  const res = [['#ffd07a', T('Crédits'), fmt(L(s.cr)), '+' + fmt(prod()) + ' / s']];
  if (L(s.mem) > -Infinity) res.push(['#7fe0ee', T('Mémoires'), fmt(memFree()), memGain() >= 0 ? '+' + fmt(memGain()) + ' ' + T('à la colonie') : '']);
  if (s.singTot) res.push(['#ff5ad9', T('Singularités'), nint(s.sing), singGain() ? '+' + nint(singGain()) : '']);
  if (L(s.dm) > -Infinity || s.singAll) res.push(['#b46aee', T('Matière noire'), fmt(L(s.dm)), dmRate() > -Infinity ? '+' + fmt(dmRate()) + ' / s' : '']);
  if (s.stars) res.push(['#bff4ff', T('Étoiles'), nint(starsFree()), galGain() ? '+' + nint(galGain()) : '']);
  $('apRes').replaceChildren(...res.map(([c, n, v, d]) => { const sp = el('span'); sp.style.setProperty('--c', c); sp.append(el('span', '', n), el('b', '', v)); if (d) sp.append(el('i', '', d)); return sp; }));
  $('apPlace').textContent = T(Pl.name) + ' · ' + T('colonie') + ' ' + (s.colonies + 1) + (s.sings ? ' · ' + T('cycle') + ' ' + (s.sings + 1) : '') + (s.gals ? ' · ' + T('galaxie') + ' ' + (s.gals + 1) : '');
  const [gn, gt, gf] = goal(), gb = el('div', 'bar'), gi = el('i'); gi.style.width = Math.round(gf * 100) + '%'; gb.append(gi);
  $('apGoal').replaceChildren(el('b', '', T('OBJECTIF')), el('div', '', gn), el('small', 'hint', gt), gb);
  $('apTip').textContent = tip();
  $('apBuffs').replaceChildren(...cityFx.buffs.map(b => el('div', '', (b.k === 'cheap' ? T('Bâtiments −50 %') : (b.k === 'prod' ? T('Production ×') : T('Clics ×')) + Math.round(10 ** b.m)) + ' · ' + Math.ceil((b.until - cityFx.tick) / 60) + ' s')));
  // les onglets
  const open = TABS.filter(([, , f]) => f()); if (!open.some(([k]) => k === s.tab)) s.tab = 'b';
  const nUp = ups().filter(u => u.cost <= L(s.cr) + 1e-9).length, tabSig = open.map(o => o[0]).join('') + s.tab + nUp + s.ach.length + Object.keys(s.seen).join('');
  if ($('apTabs').dataset.sig !== tabSig) { $('apTabs').dataset.sig = tabSig; $('apTabs').replaceChildren(...open.map(([k, n]) => { const b = el('button', 'btn px' + (k === s.tab ? ' main' : '') + (!s.seen[k] && k !== 'b' && k !== 'a' && k !== 'o' && k !== 'r' ? ' new' : ''), T(n) + (k === 'r' && nUp ? ' (' + nUp + ')' : k === 'a' ? ' ' + s.ach.length + '/' + ACH.length : '')); b.onclick = () => { s.tab = k; s.seen[k] = 1; b.blur(); ui(); }; return b; })); }
  s.seen[s.tab] = 1;
  // la liste de l'onglet
  const cards = tabCards(s.tab), sig = s.tab + JSON.stringify(cards.map(c => [c.name, c.live ? '' : c.small, c.btn, c.on, c.off, c.got]));
  if (!soft || sig !== lastSig) { lastSig = sig; $('apList').replaceChildren(...cards.map(card)); }
  cards.forEach((c, i) => { const sm = c.live && $('apList').children[i]?.querySelector('small'); if (sm) sm.textContent = c.small; });
  bar(s.tab, soft);
  if (s.tab === 'o' && (!$('apGraph')?.dataset.t || cityFx.tick % 300 < 30)) graph();
  if (s.tab === 'g') galDraw();
}
function bar(tab, soft) {  // ce qui est au-dessus de la liste : quantité d'achat, notation, choix de la galaxie
  const s = S(), B = $('apBar'), sig = tab + s.buy + s.opt.fmt + s.opt.auto + law('auto') + (s.opt.gr || '') + (cityFx.galSel ?? '') + starsFree() + galGain() + s.ch;
  if (soft && B.dataset.sig === sig) return; B.dataset.sig = sig;
  const btn = (label, on, f, main) => { const b = el('button', 'btn px' + (on ? ' main' : ''), label); if (main) b.classList.add('main'); b.onclick = async () => { b.blur(); await f(); ui(); save(); }; return b; };
  const out = [];
  if (tab === 'b') {
    out.push(...[1, 10, 100, 'max'].map(k => btn(k === 'max' ? 'MAX' : '×' + k, s.buy === k, () => { s.buy = k; })));
    if (law('auto')) out.push(el('span', 'sp'), btn(T(s.opt.auto ? 'AUTOMATES : OUI' : 'AUTOMATES : NON'), s.opt.auto, () => { s.opt.auto = s.opt.auto ? 0 : 1; }));
  }
  if (tab === 'o') {
    out.push(el('span', 'hint', T('Notation :')), ...NOTATIONS.map(([k, n]) => btn(T(n), s.opt.fmt === k, () => { s.opt.fmt = k; })));
    out.push(el('span', 'sp'), btn(T('2 JOURS'), (s.opt.gr || 'd') === 'd', () => { s.opt.gr = 'd'; }), btn(T('30 JOURS'), s.opt.gr === 'm', () => { s.opt.gr = 'm'; }));
  }
  if (tab === 'g') {
    const i = cityFx.galSel, p = GAL[i];
    if (p) { const own = s.sys.includes(i); out.push(el('span', '', T(p.name) + ' · ' + (p.k ? T(GAL_KINDS[p.k]) : T('ton système d’origine')))); if (!own) out.push(btn(T('CONQUÉRIR ({n} ÉTOILES)', {n: p.cost}), false, () => conquer(i), true)); out[out.length - 1].disabled = !own && !canConquer(i); }
    else out.push(el('span', 'hint', T('Clique sur un système voisin des tiens pour le conquérir avec des Étoiles. Chaque système donne son bonus pour toujours.')));
  }
  B.replaceChildren(...out);
}
function tabCards(tab) {
  const s = S(), cr = L(s.cr);
  if (tab === 'b') return Array.from({length: tiers()}, (_, i) => {
    const have = s.b[i] || 0, k = s.buy === 'max' ? Math.max(1, maxBuy(i)) : s.buy, c = cost(i, k), step = STEP(), ok = allowed(i);
    return {icon: () => bIcon(i), name: bname(i) + ' · ' + nint(have), live: true, small: (have ? fmt(prodOf(i)) + ' / s' : T('chacun') + ' ' + fmt(prodOf(i, 1)) + ' / s') + ' · ×2 ' + T('dans') + ' ' + (step - have % step) + (k > 1 ? ' · ' + T('achat') + ' ×' + nint(k) : '') + (ok ? '' : ' · ' + T('interdit pendant ce défi')),
      meter: (have % step) / step, btn: fmt(c), on: ok && c <= cr + 1e-9, act: () => buy(i, s.buy), col: bcol(i), off: !ok};
  });
  if (tab === 'r') {
    if (chOn(3)) return [{name: T('Aucune recherche pendant ce défi'), small: T(CHALLENGES[2].rule), col: '#6a6490', wide: true}];
    const list = ups().slice(0, 40);
    if (!list.length) return [{icon: gem('#6a6490', '#b46aee'), name: T('Pas de recherche pour l’instant'), small: T('Elles s’ouvrent à 10, 25, 50, 100, 200 et 400 exemplaires d’un bâtiment, et avec les clics.'), wide: true}];
    return list.map(u => ({icon: () => u.i < 0 ? sprite(HAND, {a: OUT, b: '#ffd07a'}) : bIcon(u.i), name: u.name, small: u.text, btn: fmt(u.cost), on: u.cost <= cr + 1e-9, act: () => buyUp(u), col: u.i < 0 ? '#ffd07a' : bcol(u.i)}));
  }
  if (tab === 'd') {
    const out = [{icon: () => sprite(FLAG, {a: OUT, b: '#ffd07a', c: '#ff8ae6'}), name: T('Doctrine de la colonie') + ' · ' + s.branch.length + ' / ' + brMax(), small: T('Choisis une voie : elle donne quatre paliers à acheter avec des crédits. Le choix est pour cette colonie ; la suivante pourra en prendre une autre.'), wide: true, col: '#ffd07a'}];
    for (const b of BRANCHES) {
      const mine = s.branch.includes(b.id);
      if (!mine) { out.push({icon: () => sprite(FLAG, {a: OUT, b: b.col, c: '#ffffff'}), name: T(b.name), small: T(b.text) + ' · ' + b.tiers.map(t => T(t[2])).join(' · '), btn: T('CHOISIR'), on: s.branch.length < brMax(), act: () => pickBranch(b.id), col: b.col, off: s.branch.length >= brMax()}); continue; }
      b.tiers.forEach((t, j) => { const got = s.br[t[0]], prev = !j || s.br[b.tiers[j - 1][0]]; out.push({icon: () => sprite(GEM, {a: OUT, b: b.col, c: got ? '#ffffff' : dn(b.col, .3)}), name: T(b.name) + ' ' + ROMAN(j + 1) + ' · ' + T(t[1]), small: T(t[2]), btn: got ? T('ACQUIS') : fmt(t[3]), on: !got && prev && t[3] <= cr + 1e-9, act: () => buyTier(t), col: b.col, got}); });
    }
    return out;
  }
  if (tab === 'm') {
    const mg = memGain(), nx = planet(s.colonies + 1);
    return [
      {icon: gem('#4f9fe0', '#bff4ff'), name: T('Mémoires : {n}', {n: fmt(memFree())}), small: T('Chaque Mémoire gardée ajoute {p} % de production ; dépensée, elle achète un avantage pour toute la singularité.', {p: chWon(8) ? 12 : 10}), col: '#4f9fe0'},
      {icon: gem('#e0b860', '#fff0b0'), name: T('Nouvelle colonie : {p}', {p: T(nx.name)}), live: true, small: T(nx.text) + ' · ' + (mg >= 0 ? T('tu gagnerais {n} Mémoires', {n: fmt(mg)}) : T('il faut avoir produit {g} crédits dans cette colonie', {g: fmt(memFloor())})), btn: T('FONDER'), on: mg >= 0, main: true, col: '#e0b860',
        act: async () => (await confirmBox(T('Fonder une nouvelle colonie ? Bâtiments, recherches et doctrine repartent de zéro, mais tu gagnes {n} Mémoires. Prochaine planète : {p} ({t}).', {n: fmt(mg), p: T(nx.name), t: T(nx.text)}))) ? colony() : false},
      ...PERKS.map(p => { const lv = perk(p.id), full = p.max && lv >= p.max, c = perkCost(p);
        return {icon: gem('#b46aee', '#ffd0ff'), name: T(p.name) + ' · ' + T('niveau') + ' ' + lv, small: T(p.text) + (p.max ? ' (' + T('au plus') + ' ' + p.max + ')' : ''), btn: full ? 'MAX' : fmt(c) + ' ' + T('MÉM.'), on: !full && c <= memFree() + 1e-9, act: () => buyPerk(p), col: '#b46aee'}; }),
    ];
  }
  if (tab === 'x') {
    const out = [];
    if (s.ch) { const c = CHALLENGES[s.ch - 1]; out.push({icon: () => sprite(FLAG, {a: OUT, b: '#ff4f6d', c: '#ffffff'}), name: T('En cours : {n}', {n: T(c.name)}), live: true, small: T('Produis {g} crédits dans cette colonie ({n} pour l’instant).', {g: fmt(c.goal), n: fmt(L(s.run))}), meter: frac(L(s.run), c.goal), btn: T('ABANDONNER'), on: true, act: async () => (await confirmBox(T('Abandonner le défi ? La colonie recommence, sans Mémoires.'))) ? quitChallenge() : false, col: '#ff4f6d', wide: true}); }
    else out.push({icon: () => sprite(FLAG, {a: OUT, b: '#ff4f6d', c: '#ffffff'}), name: T('Défis'), small: T('Un défi recommence la colonie avec une règle en plus (les Mémoires comptent moitié moins). Atteins le but pour gagner un bonus pour toujours.'), wide: true, col: '#ff4f6d'});
    CHALLENGES.forEach((c, k) => { const won = chWon(k + 1); out.push({icon: () => sprite(MEDAL, won ? {a: OUT, b: '#e0b860', c: '#fff0b0', d: '#ff5ad9'} : {a: OUT, b: '#3a2a6e', c: '#5a4a8e', d: '#3a2a6e'}), name: T(c.name), small: T('Règle : {r}. But : {g} crédits. Récompense : {w}.', {r: T(c.rule), g: fmt(c.goal), w: T(c.reward)}), btn: won ? T('RELEVÉ') : s.ch === k + 1 ? T('EN COURS') : T('RELEVER'), on: !won && !s.ch,
      act: async () => (await confirmBox(T('Commencer le défi « {n} » ? La colonie recommence de zéro (sans Mémoires gagnées).', {n: T(c.name)}))) ? startChallenge(k + 1) : false, col: won ? '#e0b860' : '#ff4f6d', got: won}); });
    return out;
  }
  if (tab === 'u') {
    const g = singGain();
    return [
      {icon: () => sprite(HOLE, {a: OUT, b: '#ff5ad9', c: '#5a1a6a', d: '#000000'}), name: T('Effondrement'), live: true, small: g ? T('La ville s’effondre en {n} singularités. Tout repart de zéro, Mémoires et avantages compris ; restent les succès, les défis, les lois et la matière noire.', {n: nint(g)}) : T('Il faut avoir produit {g} crédits depuis la dernière singularité ({n} pour l’instant). La prochaine singularité de plus : {x}.', {g: fmt(SING_AT), n: fmt(L(s.sAll)), x: fmt(singNext())}),
        meter: g ? null : frac(L(s.sAll), SING_AT), btn: T('EFFONDREMENT'), on: g > 0, main: true, wide: true, col: '#ff5ad9', act: async () => (await confirmBox(T('Provoquer l’effondrement ? Tu gagnes {n} singularités, mais crédits, bâtiments, colonies, Mémoires et avantages repartent de zéro.', {n: nint(g)}))) ? singularity() : false},
      {icon: () => sprite(HOLE, {a: OUT, b: '#b46aee', c: '#3a1a6a', d: '#120020'}), name: T('Matière noire : {n}', {n: fmt(L(s.dm))}), live: true, small: s.singAll ? T('Elle naît des singularités gagnées ({n} par seconde) et multiplie toute la production par (1 + matière noire)², ici ×{m}.', {n: fmt(dmRate()), m: fmt(2 * LG.add(0, L(s.dm)))}) : T('Elle apparaît à la première singularité.'), col: '#b46aee'},
      ...LAWS.map(l => ({icon: () => sprite(STAR, {a: OUT, b: '#ff5ad9', c: '#ffd0ff'}), name: T(l.name), small: T(l.text), btn: s.laws[l.id] ? T('ACQUISE') : l.cost + ' ✦', on: !s.laws[l.id] && l.cost <= s.sing, act: () => buyLaw(l), col: '#ff5ad9', got: s.laws[l.id]})),
      ...DISTS.map(d => { const lv = dist(d.id), full = d.max && lv >= d.max, c = distCost(d); return {icon: () => sprite(HOLE, {a: OUT, b: '#8a5af0', c: '#d8c8ff', d: '#3a1a6a'}), name: T(d.name) + ' · ' + T('niveau') + ' ' + lv, small: T(d.text), btn: full ? 'MAX' : fmt(c) + ' ◆', on: !full && c <= L(s.dm) + 1e-9, act: () => buyDist(d), col: '#8a5af0'}; }),
    ];
  }
  if (tab === 'g') {
    const g = galGain();
    return [{big: () => { const cv = el('canvas', 'apGal'); cv.id = 'apGalCv'; cv.width = 640; cv.height = 320;
        cv.onpointerdown = e => { const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 640 / r.width, y = (e.clientY - r.top) * 320 / r.height, i = GAL.findIndex(p => Math.hypot(p.x - x, p.y - y) < 14); cityFx.galSel = i >= 0 ? i : null; ui(); };
        return cv; }, small: T('Le système doré est chez toi. Les systèmes bleus, voisins des tiens, peuvent être conquis.')},
      {icon: () => sprite(STAR, {a: OUT, b: '#7fe0ee', c: '#ffffff'}), name: T('Exode : {n} Étoiles', {n: nint(g)}), live: true, small: g ? T('Quitter ce coin de l’univers : singularités, matière noire et distorsions repartent de zéro (les lois restent). Tu gagnes {n} Étoiles.', {n: nint(g)}) : T('Il faut {g} singularités gagnées depuis le dernier exode ({n} pour l’instant).', {g: GAL_AT, n: s.singAll}),
      meter: g ? null : s.singAll / GAL_AT, btn: T('EXODE'), on: g > 0, main: true, col: '#7fe0ee', act: async () => (await confirmBox(T('Partir en exode ? Tu gagnes {n} Étoiles ; singularités, matière noire et distorsions repartent de zéro.', {n: nint(g)}))) ? galaxy() : false},
      {icon: () => sprite(STAR, {a: OUT, b: '#bff4ff', c: '#ffffff'}), name: T('Systèmes conquis : {n} / {t}', {n: s.sys.length - 1, t: GAL.length - 1}), small: Object.entries(GAL_KINDS).map(([k, v]) => sys(k) ? T(v) + ' ×' + sys(k) : '').filter(Boolean).join(' · ') || T('aucun pour l’instant'), col: '#bff4ff'}];
  }
  if (tab === 'a') { const pc = br('s3') ? 6 : 3; return ACH.map(([id, name]) => { const on = s.ach.includes(id); return {icon: () => sprite(MEDAL, on ? {a: OUT, b: '#e0b860', c: '#fff0b0', d: '#ff5ad9'} : {a: OUT, b: '#3a2a6e', c: '#5a4a8e', d: '#3a2a6e'}), name, small: on ? T('obtenu · +{p} % de production', {p: pc}) : T('à obtenir'), off: !on, col: on ? '#e0b860' : '#3a2a6e'}; }); }
  if (tab === 'o') {
    const days = (Date.now() - (s.started || s.last)) / 86400000;
    return [{big: () => { const cv = el('canvas', 'apGraph'); cv.id = 'apGraph'; cv.width = 640; cv.height = 240; return cv; }, small: T('Chaque point : la production par seconde (échelle des puissances de 10). Les traits : colonie (or), défi (rouge), singularité (rose), exode (bleu).'), wide: true, col: '#7fe0ee'},
      {name: T('Depuis le début'), small: T('{a} crédits produits · {c} clics · {k} colonies · {u} singularités · {g} exodes · partie commencée il y a {d} jours', {a: fmt(L(s.all)), c: nint(s.clicks), k: s.colonies, u: s.singTot, g: s.gals, d: nint(days)}), col: '#ffd07a'},
      {name: T('Événements attrapés'), small: T('{m} météores · {s} cargos · {v} marchés · {l} vaisseaux · {f} fêtes', {m: s.meteors, s: s.ships, v: s.merch, l: s.landings, f: s.parties}), col: '#8ee8a0'}];
  }
  return [];
}
function graph() {  // le graphique de la production : log10 de la production, avec les grands moments
  const cv = $('apGraph'); if (!cv) return;
  cv.dataset.t = Date.now();
  const g = cv.getContext('2d'), s = S(), long = s.opt.gr === 'm', pts = (long ? s.histL : s.hist).filter(p => p[1] != null), now = Date.now(), span = long ? 30 * 86400000 : 2 * 86400000;
  g.fillStyle = '#06021a'; g.fillRect(0, 0, 640, 240);
  const x0 = 52, x1 = 630, y0 = 14, y1 = 214, X = t => x0 + (x1 - x0) * (1 - (now - t) / span);
  const vs = pts.map(p => p[1]), lo = Math.floor(Math.min(...vs, prod() > -Infinity ? prod() : 0)), hi = Math.ceil(Math.max(...vs, lo + 1, prod() > -Infinity ? prod() : 1)), Y = v => y1 - (y1 - y0) * (v - lo) / Math.max(1, hi - lo);
  g.font = FONT(6); g.fillStyle = '#5a4a8e';
  for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4, y = Y(v); g.fillRect(x0, y | 0, x1 - x0, 1); g.fillStyle = '#8a84a8'; g.textAlign = 'right'; g.fillText(fmt(v), x0 - 4, y + 3); g.fillStyle = '#2a1d52'; }
  g.textAlign = 'center'; g.fillStyle = '#8a84a8';
  for (let k = 0; k <= 4; k++) { const ago = span * (1 - k / 4); g.textAlign = k === 4 ? 'right' : 'center'; g.fillText(ago ? '-' + (long ? Math.round(ago / 86400000) + ' j' : Math.round(ago / 3600000) + ' h') : T('maintenant'), x0 + (x1 - x0) * k / 4, 232); }
  for (const [t, k] of s.marks) { if (now - t > span) continue; g.fillStyle = {c: '#e0b860', d: '#ff4f6d', s: '#ff5ad9', g: '#7fe0ee'}[k] || '#ffffff'; g.fillRect(X(t) | 0, y0, 1, y1 - y0); }
  g.fillStyle = '#7fe0ee'; let prev = null;
  for (const p of pts) { if (now - p[0] > span) continue; const x = X(p[0]), y = Y(p[1]); if (prev && x - prev[0] < (long ? 3600000 : 300000) * 3 / span * (x1 - x0) + 2) { g.strokeStyle = '#7fe0ee'; g.lineWidth = 2; g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(x, y); g.stroke(); } g.fillRect(x - 1, y - 1, 2, 2); prev = [x, y]; }
  if (!pts.length) { g.fillStyle = '#8a84a8'; g.fillText(T('Le graphique se remplit toutes les 5 minutes.'), 340, 120); }
  g.textAlign = 'left';
}
function galDraw() {  // la carte de la galaxie
  const cv = $('apGalCv'); if (!cv) return;
  const g = cv.getContext('2d'), s = S(), t = cityFx.tick;
  g.fillStyle = '#03000c'; g.fillRect(0, 0, 640, 320);
  const r = seeded(77); for (let k = 0; k < 260; k++) { const x = r() * 640, y = r() * 320, a = .2 + r() * .6; R(g, 'rgba(255,255,255,' + a.toFixed(2) + ')', x, y); }
  for (let k = 0; k < 900; k++) { const a = k / 900 * Math.PI * 8, d = 8 + k / 900 * 250; R(g, rgba(k % 3 ? '#4a2a8a' : '#8a5af0', (.25 * (1 - k / 900)).toFixed(2)), 320 + Math.cos(a + t / 3000) * d * 1.05, 160 + Math.sin(a + t / 3000) * d * .5, 2, 1); }
  for (const [i, p] of GAL.entries()) for (const j of p.n) if (j > i) { const own = s.sys.includes(i) && s.sys.includes(j); g.strokeStyle = own ? '#7fe0ee' : '#2a1d52'; g.lineWidth = own ? 2 : 1; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(GAL[j].x, GAL[j].y); g.stroke(); }
  GAL.forEach((p, i) => {
    const own = s.sys.includes(i), can = canConquer(i), near = p.n.some(j => s.sys.includes(j)), c = own ? '#ffd07a' : can ? '#7fe0ee' : near ? '#5a6a9a' : '#2a2a4a';
    if (own) { const im = glow(4, i ? '#ffd07a' : '#ff8ae6'); g.drawImage(im, p.x - im.width / 2, p.y - im.height / 2); }
    disc(g, p.x, p.y, 4, (dx, dy, d) => d > 3.4 ? OUT : c);
    if (can && (t >> 4) % 2) disc(g, p.x, p.y, 8, (dx, dy, d) => d > 7.2 ? '#7fe0ee' : null);
    if (cityFx.galSel === i) disc(g, p.x, p.y, 11, (dx, dy, d) => d > 10.2 ? '#ffffff' : null);
    if (own || near) txt(g, T(p.name), p.x, p.y + 18, own ? '#ffd07a' : '#8a84a8', 6, 'center');
    if (!own && near) txt(g, p.cost + '★', p.x, p.y - 10, can ? '#7fe0ee' : '#5a4a8e', 6, 'center');
  });
  txt(g, T('ÉTOILES : {n}', {n: nint(starsFree())}), 10, 16, '#bff4ff', 7);
}

/* ---- le retour : ce que la ville a fait pendant l'absence, et un choix ---- */
function welcome(sec, got) {
  const s = S(), lk = luck(), box = $('apAway'), d = el('div', 'px win');
  const n = k => Math.floor(k + 1e-9);
  const missed = lk ? {cargo: n(sec * 60 * (planet().cargo || 1) * lk / 2400 / 2), rain: n(sec * 60 * lk / 16200), merch: n(sec * 60 * lk / 27000), ev: n(sec * 60 * lk / 10800)} : {cargo: 0, rain: 0, merch: 0, ev: 0};
  const tot = missed.cargo + missed.rain + missed.merch + missed.ev;
  const li = [T('{n} crédits produits', {n: fmt(got.cr)})];
  if (got.dm > -Infinity) li.push(T('{n} matière noire', {n: fmt(got.dm)}));
  if (law('ver')) li.push(T('Trou de ver : le temps passé loin a compté double'));
  if (tot) li.push(T('{n} événements manqués : {c} cargos, {r} pluies de météores, {m} passages du marchand, {e} vaisseaux et fêtes dans les quartiers', {n: tot, c: missed.cargo, r: missed.rain, m: missed.merch, e: missed.ev}));
  const close = () => { box.classList.remove('on'); box.replaceChildren(); ui(); save(); };
  const opt = (label, sub, f) => { const b = el('button', 'btn px'); b.append(el('b', '', label), el('small', '', sub)); b.onclick = () => { f(); sfx('launch'); close(); }; return b; };
  const choices = [
    opt(T('Encaisser'), T('Tout garder, rien de plus.'), () => {}),
    opt(T('Réinvestir'), T('Acheter tout de suite les bâtiments et recherches les plus rentables.'), () => { let k = 0; for (let n2 = 0; n2 < 400; n2++) { let best = -1, bc = Infinity; for (let i = 0; i < tiers(); i++) if (allowed(i) && cost(i) < bc) { bc = cost(i); best = i; } if (best < 0 || bc > L(s.cr)) break; buy(best, Math.max(1, Math.min(25, maxBuy(best)))); k++; } for (const u of ups()) if (buyUp(u)) k++; toast(T('{n} achats faits', {n: k})); }),
    opt(T('Fête de retour'), T('Donner un quart des gains aux habitants : production ×3 pendant 15 minutes.'), () => { const s2 = S(); s2.cr = LG.sub(L(s2.cr), got.cr + Math.log10(.25)); cityFx.buffs.push({k: 'prod', m: L3, until: cityFx.tick + 54000}); }),
  ];
  if (missed.merch && lk) choices.push(opt(T('Rappeler le marchand'), T('Il revient tout de suite avec ses bonus.'), () => callMerchant(true)));
  const ch = el('div', 'apChoice'); ch.append(...choices);
  const ul = el('ul'); ul.append(...li.map(x => el('li', '', x)));
  d.append(el('h3', '', T('PENDANT TON ABSENCE ({t})', {t: away(sec)})), ul, el('div', 'hint', T('Que fais-tu de tes gains ?')), ch);
  box.replaceChildren(d); box.classList.add('on');
}

/* ---- l'ouverture ---- */
function openGame() {
  const s = S(), sec = Math.max(0, (Date.now() - s.last) / 1000), got = tickTime(sec, true); s.last = Date.now();
  if (!cityFx) {
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }, scene = mk(), st = mk();
    cityFx = {raf: 0, g: $('apCv').getContext('2d'), scene, sg: scene.getContext('2d'), st, stg: st.getContext('2d'), tick: 0, ships: [], pops: [], flash: 0, buffs: [], meteors: [], booms: [], merch: null, offer: null, shower: 0,
      nextShower: 3600, nextMerch: 7200, nextEvent: 1800, events: [], zoom: null, lastZoom: null, zk: 0, rocket: null, missed: 0, dirty: 1, galSel: null};
    $('apCv').__ap = {s: S, fx: () => cityFx, buy, ach: achCheck, shower, ups, prod, merch: () => callMerchant(true), event: (k, i) => spawnEvent(k, i), zoom: zoomTo, colony, sing: singularity, gal: galaxy, conquer, ui,
      fill: () => { const s2 = S(); for (let i = 0; i < 18; i++) { s2.cr = 45; buy(i, 'max'); } cityFx.dirty = 1; ui(); }, welcome, tickTime, startChallenge, buyLaw: id => buyLaw(LAWS.find(l => l.id === id)), pickBranch, buyTier, BRANCHES, GAL, graph, sample,
      load: o => { games.city = o; city = null; cityFx.dirty = 1; return S(); }};  // pour le test : reprendre une partie de la 1.x
  }
  if (sec > 300 && got.cr > 0) welcome(sec, got);
  sample(); save(); ui(); gameLoop();
}
$('apCv').addEventListener('pointerdown', e => { if (e.button === 0) press(e); });
$('apCv').addEventListener('dblclick', e => { if (cityFx.offer) return; const {x, y} = toWorld(e); if (cityFx.zoom != null) zoomTo(null); else { const i = districtAt(x, y); if (i != null) zoomTo(i); } });
view.addEventListener('keydown', e => { if (e.key === 'Escape' && cityFx?.zoom != null) zoomTo(null); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && view.classList.contains('on') && cityFx?.zoom != null) zoomTo(null); });
$('apFs').onclick = () => { $('apFs').blur(); $('apCv').parentElement.requestFullscreen?.().catch(() => {}); };
{  // vérification interne : les grands nombres, les prix, les listes, la galaxie
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const ok = near(LG.add(2, 2), 2 + L2) && LG.sub(2, 2) === -Infinity && near(LG.sub(3, 2), Math.log10(900)) && fmt(Math.log10(1234), 'fr') === (1234).toLocaleString('fr-FR')
    && fmt(9, 'fr') === '1' + (FR ? ',' : '.') + '00 ' + SUF[1] && fmt(40.5, 'sci').startsWith('3' + (FR ? ',' : '.') + '16e40') && fmt(16, 'eng').endsWith('e15') && fmt(9, 'let').endsWith(' B') && fmt(36, 'let').endsWith(' aa') && fmt(2e6).startsWith('e') && ROMAN(14) === 'XIV'
    && near(costRaw(0), 1) && KIND.length === 16 && new Set(ACH.map(a => a[0])).size === ACH.length && PLANETS.every(p => p.sky.length === 5)
    && GAL.length === 22 && GAL.every((p, i) => !i || p.cost >= 1) && GAL.every(p => p.n.length) && CHALLENGES.length === 8 && LAWS.every(l => l.cost > 0);
  console.assert(ok, 'astropole'); view.dataset.selfcheck = ok ? 'ok' : 'astropole';
}
  ctx.onOpen(() => openGame());
}
