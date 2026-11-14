// Astropole : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap wide\">\n      <div class=\"agHead\"><span class=\"label\">Astropole</span><span class=\"hint\" id=\"ciInfo\"></span><div class=\"agNav\"><button class=\"btn px\" id=\"gFs\">PLEIN ÉCRAN</button><button class=\"btn main px\" id=\"ciColony\" title=\"Tout recommencer sur une autre planète, avec des Mémoires à dépenser en avantages\">NOUVELLE COLONIE</button></div></div>\n      <div class=\"gMain\">\n        <div class=\"gameBox\"><canvas id=\"ciCanvas\" width=\"480\" height=\"270\"></canvas></div>\n        <div class=\"gSide\"><div class=\"ciTip px\" id=\"ciTip\"></div><div class=\"hint\" id=\"ciStats\"></div></div>\n      </div>\n      <div class=\"ciTabs\" id=\"ciTabs\"><button class=\"btn px\" data-t=\"b\">BÂTIMENTS</button><button class=\"btn px\" data-t=\"r\">RECHERCHES</button><button class=\"btn px\" data-t=\"a\">SUCCÈS</button><button class=\"btn px\" data-t=\"m\">MÉMOIRES</button><span class=\"sp\"></span><span class=\"row\" id=\"ciBuy\"><button class=\"btn px\" data-k=\"1\">×1</button><button class=\"btn px\" data-k=\"10\">×10</button><button class=\"btn px\" data-k=\"100\">×100</button><button class=\"btn px\" data-k=\"max\">MAX</button></span></div>\n      <div class=\"ciList\" id=\"ciList\"></div>\n      <div class=\"hint\">La ville produit des crédits chaque seconde, même quand NeoDex est fermé : à l'ouverture, tout le temps passé est compté (depuis la dernière sauvegarde, sur n'importe lequel de tes PC). Chaque sorte de bâtiment a son quartier ; tous les 25 d'un même bâtiment, sa production double. Les recherches multiplient bâtiments et clics, chaque succès ajoute 3 % de production pour toujours. Clique sur la ville, les météores, les cargos jaunes et le marchand. Après 1 billion de crédits produits, « Nouvelle colonie » recommence sur une autre planète avec des Mémoires à dépenser en avantages. Le jour et la nuit passent toutes les 4 minutes. Sauvegardé et synchronisé.</div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.gMain{display:flex;gap:18px;align-items:flex-start}
.gameBox{display:grid;place-items:center;padding:10px;background:#05010b;box-shadow:0 0 0 3px var(--line2);flex:1 1 0;min-width:0;max-width:calc(min(58vh,620px)*480/270 + 20px);position:relative}
.gameBox canvas{width:100%;height:auto;aspect-ratio:480/270;image-rendering:pixelated;cursor:var(--cp,pointer)}
.gSide{flex:0 0 260px;display:flex;flex-direction:column;gap:10px}
.ciTip{padding:10px 12px;border-left:4px solid #ffd07a;line-height:1.5}
.gameBox:fullscreen{padding:0;max-width:none}
.gameBox:fullscreen canvas{max-width:none;width:auto;height:100vh}
@media(max-width:620px){.gMain{flex-direction:column}.gSide{flex:none;width:100%}.gameBox{max-width:none;width:100%}}
.ciTabs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:14px 0 8px}
.ciTabs .sp{flex:1}
.ciList{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px}
.ciRow{--fill:var(--win);display:flex;align-items:center;gap:10px;padding:8px 10px}
.ciRow{border-left:4px solid var(--c,#7fe0ee)}
.ciRow.off{opacity:.45}
.ciIcon{width:51px;height:45px;flex:none;image-rendering:pixelated;background:linear-gradient(#0b031c,#2a1d52);box-shadow:inset 0 0 0 2px var(--line2)}
.ciBar{height:4px;background:#2a1d52;margin-top:4px}.ciBar i{display:block;height:100%;background:var(--c,#7fe0ee)}
.ciTxt b{font-size:15px}
.ciTxt{flex:1;display:flex;flex-direction:column;min-width:0}
.ciTxt small{color:var(--muted)}
.ciBtn{flex:none;min-width:110px;font-size:12px;white-space:nowrap}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "cityApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const LEGACY_GAMES = {"top":["city"],"best":"^$"};
  let games = await doc('games');
  if (games == null) {  // première ouverture : tu retrouves tes records et tes parties d'avant
    const old = legacy.api ? await legacy.api('games').catch(() => null) : null; games = { best: {} };
    if (old) { const re = new RegExp(LEGACY_GAMES.best); for (const [k, v] of Object.entries(old.best || {})) if (re.test(k)) games.best[k] = v; for (const k of LEGACY_GAMES.top) if (old[k] !== undefined) games[k] = old[k]; await folder.write('games', games); }
  }
  games = { best: {}, ...games };
  let gamesTimer = null;
  const saveGames = () => { clearTimeout(gamesTimer); gamesTimer = setTimeout(() => { gamesTimer = null; folder.write('games', games).catch(() => {}); }, 500); };
  const best = (k, v, higher = true) => { const b = games.best[k]; if (b == null || (higher ? v > b : v < b)) { games.best[k] = v; saveGames(); return true; } return false; };
  const gstore = (k, init) => (games[k] ??= init);  // la section d'un jeu
function gameLoop(st, appKey, update, draw) {
  cancelAnimationFrame(st.raf);
  const STEP = 1000 / 60; let acc = 0, last = performance.now();
  const frame = t => {
    if (!view.classList.contains('on')) { st.raf = 0; if (st.mode === 'play') st.mode = 'pause'; return; }  // leaving the tab pauses the game
    st.raf = requestAnimationFrame(frame);
    acc += Math.min(200, t - last); last = t;
    while (acc >= STEP) { if (st.mode === 'play') update(); st.tick++; acc -= STEP; }
    draw();
  };
  st.raf = requestAnimationFrame(frame);
}
function gameText(g, w, lines, y0) {  // centred pixel-font lines over a dark band
  g.fillStyle = 'rgba(11,3,28,.72)'; g.fillRect(0, y0 - 14, w, lines.length * 14 + 14);
  g.textAlign = 'center';
  lines.forEach(([text, color, size], i) => { g.fillStyle = color; g.font = (size || 8) + 'px "Press Start 2P", monospace'; g.fillText(text, w / 2, y0 + i * 14); });
  g.textAlign = 'left';
}
const px = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); };
function sprite(g, rows, x, y, pal) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) px(g, c, x + i, y + j); } }); }
  // ---- ton code d'origine ----
const seeded = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const mixc = (a, b, k) => { const p = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)), x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

/* ---------- jeu "Astropole": an idle space city. Buildings make crédits every second, even when NeoDex is closed (on opening, the time
   spent away is counted from the last save, on whichever PC). Numbers are kept as their log10, so they can grow without limit, and the
   building tiers never end (after the 16 named ones come numbered megastructures, stations in orbit). Every 25 of a building doubles it;
   research multiplies buildings and clicks; achievements add production for good; meteor showers and a merchant come by. "Nouvelle colonie"
   starts over on another planet with Mémoires, spent on perks. Saved in games.city (synced). ---------- */
const CI = {W: 480, H: 270, R: Math.log10(1.15),
  names: ['Module d\'habitat', 'Serre hydroponique', 'Champ solaire', 'Mine d\'astéroïdes', 'Raffinerie de glace', 'Chantier naval', 'Laboratoire orbital', 'Port spatial',
    'Anneau d\'habitation', 'Ascenseur spatial', 'Forge stellaire', 'Essaim de Dyson', 'Portail de saut', 'Cerveau-planète', 'Moteur à trou noir', 'Architecte du vide'],
  cols: ['#7fe0ee', '#5fd08a', '#ffd07a', '#a08a70', '#c9e8ff', '#8f8fa8', '#b46aee', '#ff8ae6', '#4f9fe0', '#e8e4d0', '#ff7a4f', '#ffc23a', '#ff5ad9', '#8ee8a0', '#6a3ad0', '#d8c8ff'],
};
// big numbers: x is stored as log10(x), -Infinity is 0
const LG = {
  add: (a, b) => { if (a === -Infinity) return b; if (b === -Infinity) return a; const m = Math.max(a, b); return m + Math.log10(1 + 10 ** (Math.min(a, b) - m)); },
  sub: (a, b) => { if (b === -Infinity) return a; const d = b - a; return d >= 0 ? -Infinity : a + Math.log10(1 - 10 ** d); },  // a - b, never below 0
  of: x => x > 0 ? Math.log10(x) : -Infinity,
};
const CI_SUF = ['million', 'milliard', 'billion', 'billiard', 'trillion', 'trilliard', 'quadrillion', 'quadrilliard', 'quintillion', 'quintilliard'];
function ciFmt(L) {
  if (L === -Infinity || L < 0) return L === -Infinity ? '0' : (10 ** L).toFixed(1).replace('.', ',');
  if (L < 6) return Math.floor(10 ** L + 1e-9).toLocaleString('fr-FR');
  if (L < 36) { const i = Math.floor((L - 6) / 3); return (10 ** (L - 6 - i * 3)).toFixed(2).replace('.', ',') + ' ' + CI_SUF[i] + (10 ** (L - 6 - i * 3) >= 2 ? 's' : ''); }
  if (L < 1e6) return (10 ** (L % 1)).toFixed(2).replace('.', ',') + 'e' + Math.floor(L).toLocaleString('fr-FR');
  return 'e' + ciFmt(Math.log10(L));  // a number of digits so large it is itself written short
}
const ROMAN = n => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const ciName = i => CI.names[i] || 'Mégastructure ' + ROMAN(i - CI.names.length + 1);
const L2 = Math.log10(2), L3 = Math.log10(3), CI_START = Math.log10(15);
const ciCostRaw = i => 1 + i * 1.25 + i * i * .04;            // log10 of the first one's price (before discounts)
const CI_EARLY = [.3, .4, .3, .15];                             // the first kinds are cheaper, for a quick start
const ciCost0 = i => ciCostRaw(i) - (CI_EARLY[i] || 0) - ciPerk('cheap') * Math.log10(1 / .9) - ciBuffL('cheap');
const ciProd0 = i => ciCostRaw(i) - 2 - i * .18;               // log10 of what one makes a second
function ciSave() {
  const s = gstore('city', {cr: CI_START, run: CI_START, all: CI_START, b: [], mem: null, colonies: 0, last: Date.now(), clicks: 0, ships: 0, buy: 1});
  s.up ??= {}; s.ach ??= []; s.perk ??= {}; s.meteors ??= 0; s.merch ??= 0; s.tab ??= 'b';  // older saves get the new parts
  return s;
}
// JSON has no -Infinity: it is saved as null
const ciL = v => v == null ? -Infinity : v;
const ciPerk = k => ciSave().perk[k] || 0;
const ciBuffL = k => ci ? ci.buffs.reduce((L, b) => b.k === k && b.until > ci.tick ? L + b.m : L, 0) : 0;
const ciMemFree = () => LG.sub(ciL(ciSave().mem), ciL(ciSave().memSpent));
// the planets: the first colony is on Néa, then each new one lands on the next planet, each with its own strengths (fam: tier → log10 multiplier)
const CI_PL = [
  {name: 'Néa', text: 'la planète d’origine, sans effet particulier', fam: {}, sky: ['#0b031c', '#4a1f7a', '#3a3a9a', '#d8a0e0', '#ff8a6a'], mtn: ['#3a2468', '#251845'], ground: '#2a1f50', moon: '#ffd07a', flora: '#8ee8a0', aurora: '#8ee8a0'},
  {name: 'Cryos', text: 'raffineries de glace ×10, champs solaires ×0,5', fam: {4: 1, 2: -L2}, sky: ['#06121f', '#0f4a6a', '#4a8ad0', '#d8f2ff', '#ffb0c8'], mtn: ['#9ab8e0', '#6a88b8'], ground: '#3a5a80', moon: '#c9e8ff', flora: '#e8f4ff', snow: 1, aurora: '#7fe0ee'},
  {name: 'Pyra', text: 'mines d’astéroïdes ×10, clics ×3', fam: {3: 1}, click: L3, sky: ['#140308', '#5a1a10', '#9a4a2a', '#ffc080', '#ff5a2a'], mtn: ['#4a2020', '#2a1010'], ground: '#3a1a18', moon: '#ff7a4f', flora: '#ff7a2f', lava: 1},
  {name: 'Sylve', text: 'serres ×10, événements deux fois plus fréquents', fam: {1: 1}, luck: 2, sky: ['#031a14', '#0f6a4a', '#3a9a8a', '#e0f8c0', '#ffd08a'], mtn: ['#2a6a4a', '#1a4a30'], ground: '#24402a', moon: '#8ee8a0', flora: '#5fd08a'},
  {name: 'Aurore', text: 'chantiers navals et ports spatiaux ×5, cargos trois fois plus fréquents', fam: {5: .7, 7: .7}, cargo: 3, sky: ['#14031e', '#6a1f5a', '#c06aa0', '#ffd8ec', '#ffa0a0'], mtn: ['#7a3a7a', '#4a2050'], ground: '#4a2a50', moon: '#ff8ae6', flora: '#ff8ae6', aurora: '#ff8ae6'},
  {name: 'Nébula', text: 'laboratoires ×10, recherches deux fois moins chères', fam: {6: 1}, res: L2, sky: ['#05031a', '#2a1a7a', '#4a3ab0', '#c0b0ff', '#ff9ad0'], mtn: ['#3a2a8a', '#22185a'], ground: '#2a2060', moon: '#b46aee', flora: '#b46aee'},
];
const ciPl = (c = ciSave().colonies) => CI_PL[c ? 1 + (c - 1) % (CI_PL.length - 1) : 0];
// everything that multiplies all production: free Mémoires (+10 % each), achievements (+3 % each), the Héritage perk, the merchant's bonus
const ciMult = () => { const m = ciMemFree(); return LG.of(1 + .1 * 10 ** Math.min(300, m)) + (m > 300 ? m - 300 : 0) + LG.of(1 + .03 * ciSave().ach.length) + ciPerk('prod') * L2 + ciBuffL('prod'); };
const CI_UP_N = [10, 25, 50, 100, 200, 400];                    // research of a building opens at these counts, ×3 each
const ciUpL = i => { const s = ciSave(); let L = ciPl().fam[i] || 0; for (let r = 0; r < CI_UP_N.length; r++) if (s.up['b' + i + '.' + r]) L += L3; if (s.up['s' + i]) L += Math.log10(1 + .01 * (s.b[i - 1] || 0)); return L; };
const ciProdOf = (i, n = ciSave().b[i] || 0) => n ? ciProd0(i) + Math.log10(n) + Math.floor(n / 25) * L2 + ciUpL(i) + ciMult() : -Infinity;
const ciProd = () => (ciSave().b.length ? ciSave().b : [0]).reduce((L, n, i) => LG.add(L, ciProdOf(i, n)), -Infinity);
const ciCost = (i, k = 1) => { const n = ciSave().b[i] || 0; return ciCost0(i) + n * CI.R + (k > 200 ? k * CI.R - Math.log10(.15) : Math.log10((1.15 ** k - 1) / .15)); };  // k more, in one go
function ciMaxBuy(i) {
  const s = ciSave(), x = ciL(s.cr) - ciCost0(i) - (s.b[i] || 0) * CI.R + Math.log10(.15);
  return Math.max(0, Math.floor((x > 15 ? x : Math.log10(1 + 10 ** x)) / CI.R + 1e-9));
}
const ciTiers = () => Math.min((ciSave().b.length || 0) + 1, Math.max(1, ciSave().b.findLastIndex(n => n > 0) + 2));  // the next tier shows once the last one has one
// the time spent away: everything the city made since the last save
function ciCatchUp(now = Date.now()) {
  const s = ciSave(), dt = Math.max(0, (now - s.last) / 1000); s.last = now;
  if (!dt) return -Infinity;
  const got = ciProd() + Math.log10(dt);
  ciGain(got); return got;
}
function ciGain(L) { const s = ciSave(); s.cr = LG.add(ciL(s.cr), L); s.run = LG.add(ciL(s.run), L); s.all = LG.add(ciL(s.all), L); }
function ciBuy(i, k) {
  const s = ciSave(); k = k === 'max' ? ciMaxBuy(i) : k; if (!k) return false;
  const c = ciCost(i, k); if (c > ciL(s.cr) + 1e-9) return false;
  s.cr = LG.sub(ciL(s.cr), c); s.b[i] = (s.b[i] || 0) + k;
  sfx('click'); ciUi(); return true;
}
// a click: 1 crédit + 1 s of production, ×2 per click research
const CI_CLICK = [1.7, 3, 4.5, 6.5, 9, 12, 16, 21, 27, 34, 42, 51];
const ciClickN = () => { let r = 0; while (ciSave().up['c' + r]) r++; return r; };
const ciClickL = () => LG.add(0, ciProd()) + ciClickN() * L2 + ciPerk('click') * Math.log10(5) + (ciPl().click || 0) + ciBuffL('click');
// the research this colony can buy now (requirements met, not bought yet), cheapest first
function ciUps() {
  const s = ciSave(), out = [], rd = ciPl().res || 0;
  for (let i = 0; i < ciTiers(); i++) {
    const n = s.b[i] || 0;
    CI_UP_N.forEach((req, r) => { if (n >= req) out.push({id: 'b' + i + '.' + r, i, name: ciName(i) + ' ' + ROMAN(r + 1), text: 'production ×3 (ouverte à ' + req + ')', cost: ciCostRaw(i) + req * CI.R + 1 + r * .5 - rd}); });
    if (i && n >= 25 && (s.b[i - 1] || 0) >= 25) out.push({id: 's' + i, i, name: 'Liaison : ' + ciName(i), text: '+1 % de production par ' + ciName(i - 1), cost: ciCostRaw(i) + 25 * CI.R + 2 - rd});
  }
  const c = ciClickN(); if (c < CI_CLICK.length) out.push({id: 'c' + c, i: -1, name: 'Clic ' + ROMAN(c + 1), text: 'chaque clic rapporte deux fois plus', cost: CI_CLICK[c] - rd});
  return out.filter(u => !s.up[u.id]).sort((a, b) => a.cost - b.cost);
}
function ciBuyUp(u) { const s = ciSave(); if (s.up[u.id] || u.cost > ciL(s.cr) + 1e-9) return false; s.cr = LG.sub(ciL(s.cr), u.cost); s.up[u.id] = 1; sfx('notify'); ciUi(); return true; }
// achievements: each adds 3 % of production, for good
const CI_ACH = (() => {
  const a = [], tot = s => s.b.reduce((x, n) => x + (n || 0), 0), pl = (n, one, many) => n + ' ' + (n > 1 ? many : one);
  for (const n of [10, 50, 100, 250, 500, 1000, 2500, 5000]) a.push(['n' + n, n + ' bâtiments', s => tot(s) >= n]);
  for (const L of [3, 6, 9, 12, 15, 18, 24, 30, 40, 50, 75, 100]) a.push(['p' + L, ciFmt(L) + ' crédits produits', s => ciL(s.all) >= L]);
  for (const n of [50, 500, 2500, 10000]) a.push(['c' + n, n + ' clics', s => s.clicks >= n]);
  for (const n of [1, 10, 50]) a.push(['s' + n, pl(n, 'cargo attrapé', 'cargos attrapés'), s => s.ships >= n]);
  for (const n of [10, 100, 500]) a.push(['m' + n, n + ' météores', s => s.meteors >= n]);
  for (const n of [1, 10, 50]) a.push(['v' + n, pl(n, 'marché conclu', 'marchés conclus'), s => s.merch >= n]);
  for (const n of [1, 3, 6, 10, 25]) a.push(['k' + n, pl(n, 'colonie fondée', 'colonies fondées'), s => s.colonies >= n]);
  for (const n of [5, 25, 60]) a.push(['r' + n, n + ' recherches dans une colonie', s => Object.keys(s.up).length >= n]);
  for (let i = 0; i < 16; i++) for (const n of [25, 100]) a.push(['t' + i + '.' + n, n + ' × ' + CI.names[i], s => (s.b[i] || 0) >= n]);
  return a;
})();
function ciAchCheck() {
  const s = ciSave(), got = CI_ACH.filter(([id, , f]) => !s.ach.includes(id) && f(s)); if (!got.length) return 0;
  s.ach.push(...got.map(a => a[0])); sfx('notify'); saveGames();
  toast(got.length === 1 ? 'Succès : ' + got[0][1] + ' (+3 % de production)' : got.length + ' succès débloqués (+' + got.length * 3 + ' % de production)');
  return got.length;
}
// the Mémoires' perks: their price grows with each level
const CI_PERKS = [
  {id: 'prod', name: 'Héritage', text: 'production ×2 par niveau', base: L2, step: L3},
  {id: 'click', name: 'Mains d’or', text: 'clics ×5 par niveau', base: 0, step: L3},
  {id: 'cheap', name: 'Architectes', text: 'bâtiments 10 % moins chers par niveau', base: L3, step: Math.log10(4), max: 20},
  {id: 'start', name: 'Fondations', text: 'chaque colonie démarre avec ×100 crédits par niveau', base: 0, step: Math.log10(5)},
  {id: 'luck', name: 'Bonne étoile', text: 'événements 25 % plus fréquents par niveau', base: L2, step: L3, max: 8},
];
const ciPerkCost = p => p.base + ciPerk(p.id) * p.step;
function ciBuyPerk(p) {
  const s = ciSave(); if ((p.max && ciPerk(p.id) >= p.max) || ciPerkCost(p) > ciMemFree() + 1e-9) return false;
  s.memSpent = LG.add(ciL(s.memSpent), ciPerkCost(p)); s.perk[p.id] = ciPerk(p.id) + 1; sfx('notify'); ciUi(); saveGames(); return true;
}
// a new colony: start again from nothing on the next planet, with Mémoires (square root of what this run made, past a trillion)
const ciMemGain = () => { const L = ciL(ciSave().run); return L >= 12 ? (L - 12) / 2 : -Infinity; };
async function ciColony(sure) {
  const g = ciMemGain(); if (g < 0) return toast('Il faut avoir produit 1 billion de crédits dans cette colonie', true);
  const nx = ciPl(ciSave().colonies + 1);
  if (!sure && await ask('Fonder une nouvelle colonie ?', 'oui', 'Bâtiments et recherches repartent de zéro, mais tu gagnes ' + ciFmt(g) + ' Mémoires à dépenser en avantages. Prochaine planète : ' + nx.name + ' (' + nx.text + '). Tape « oui ».') !== 'oui') return;
  const s = ciSave(); s.mem = LG.add(ciL(s.mem), g); s.colonies++; s.b = []; s.up = {}; s.cr = s.run = CI_START + 2 * ciPerk('start');
  ci.flash = 40; ci.buffs = []; ci.offer = null; sfx('launch'); ciUi(); saveGames();
}
// events: meteor showers to click, and a merchant whose bonus you choose
const CI_OFFERS = [
  {k: 'prod', m: Math.log10(7), d: 1800, l: ['PRODUCTION', '×7', 'PENDANT 30 S']},
  {k: 'prod', m: L3, d: 7200, l: ['PRODUCTION', '×3', 'PENDANT 2 MIN']},
  {k: 'click', m: Math.log10(20), d: 1800, l: ['CLICS', '×20', 'PENDANT 30 S']},
  {k: 'cheap', m: L2, d: 3600, l: ['BÂTIMENTS', '−50 %', 'PENDANT 1 MIN']},
  {k: 'cargo', l: ['CARGAISON', '10 MIN', 'DE PRODUCTION']},
  {k: 'rain', l: ['PLUIE DE', 'MÉTÉORES', 'TOUT DE SUITE']},
];
function ciShower() { ci.shower = ci.tick + 900; ci.banner = {text: 'PLUIE DE MÉTÉORES !', t: 150}; sfx('notify'); }
function ciPick(o) {
  if (o.k === 'cargo') { const got = ciProd() + Math.log10(600); ciGain(got); ci.pops.push({text: '+' + ciFmt(got), x: 200, y: 120, t: 60}); }
  else if (o.k === 'rain') ciShower();
  else ci.buffs.push({k: o.k, m: o.m, until: ci.tick + o.d});
  ci.offer = null; if (ci.merch) ci.merch.st = 'out'; sfx('launch'); ciUi(true);
}
let ci = null;
function ciOpen() {
  const s = ciSave(), away = (Date.now() - s.last) / 1000, got = ciCatchUp();
  if (away > 60 && got > 0) toast('Pendant ton absence (' + fmtAway(away) + '), Astropole a produit ' + ciFmt(got) + ' crédits');
  ci ??= {raf: 0, g: $('ciCanvas').getContext('2d'), tick: 0, ships: [], pops: [], flash: 0, buffs: [], meteors: [], booms: [], merch: null, offer: null, shower: 0, nextShower: 3600, nextMerch: 7200, rocket: null};
  ci.mode = 'play';
  $('ciCanvas').__ci = {s: ciSave, ci: () => ci, buy: ciBuy, ach: ciAchCheck, shower: ciShower, colony: () => ciColony(true), ups: ciUps, prod: ciProd,
    merch: () => { ci.merch = {x: 380, y: 64, st: 'wait', t: 1800}; },
    fill: () => { const s = ciSave(); for (let i = 0; i < 18; i++) { s.cr = 45; ciBuy(i, 'max'); } ciUi(); }};
  saveGames(); ciUi(); gameLoop(ci, 'neodex:city', ciUpdate, ciDraw);
}
const fmtAway = s => s < 3600 ? Math.round(s / 60) + ' min' : s < 86400 ? Math.floor(s / 3600) + ' h ' + String(Math.round(s % 3600 / 60)).padStart(2, '0') : Math.floor(s / 86400) + ' j ' + Math.floor(s % 86400 / 3600) + ' h';
function ciUpdate() {
  if (ci.mode !== 'play') return;
  const s = ciSave(), P = ciPl(), luck = (P.luck || 1) * (1 + .25 * ciPerk('luck'));
  if (ci.tick % 6 === 0) ciCatchUp();
  if (ci.tick % 30 === 0) { ciAchCheck(); ciUi(true); }
  if (ci.tick % 600 === 0) saveGames();
  if (ci.flash) ci.flash--;
  ci.buffs = ci.buffs.filter(b => b.until > ci.tick);
  // a cargo ship crosses the sky now and then: clicking it brings 30 s of production
  if (!ci.ships.some(sh => sh.cargo) && Math.random() < (P.cargo || 1) * luck / 2400) ci.ships.push({cargo: true, x: -20, y: 34 + Math.random() * 40, v: .6});
  if (ci.tick % 50 === 0 && ci.ships.length < 6) ci.ships.push({x: Math.random() < .5 ? -10 : CI.W + 10, y: 60 + Math.random() * 70, v: 0});
  for (const sh of ci.ships) { if (!sh.v) sh.v = sh.x < 0 ? .4 + Math.random() * .5 : -.4 - Math.random() * .5; sh.x += sh.v; }
  ci.ships = ci.ships.filter(sh => sh.x > -30 && sh.x < CI.W + 30);
  // meteor showers: 15 s of meteors to catch
  if (ci.tick >= ci.nextShower) { ciShower(); ci.nextShower = ci.tick + (10800 + Math.random() * 10800) / luck; }
  if (ci.shower > ci.tick && ci.tick % 12 === 0) ci.meteors.push({x: 160 + Math.random() * 360, y: -8, vx: -1 - Math.random() * .5, vy: .7 + Math.random() * .3});
  for (const m of ci.meteors) { m.x += m.vx; m.y += m.vy; }
  ci.meteors = ci.meteors.filter(m => !m.hit && m.y < 205 && m.x > -20);
  // the merchant: comes in, waits 30 s for a click, leaves
  const m = ci.merch;
  if (!m && !ci.offer && ci.tick >= ci.nextMerch) ci.merch = {x: CI.W + 30, y: 64, st: 'in', t: 0};
  if (m) {
    if (m.st === 'in') { m.x -= 1; if (m.x <= 380) { m.st = 'wait'; m.t = 1800; } }
    else if (m.st === 'wait') { if (!ci.offer && --m.t <= 0) m.st = 'out'; }
    else { m.x += 1.4; m.y -= .3; if (m.x > CI.W + 40) { ci.merch = null; ci.nextMerch = ci.tick + (18000 + Math.random() * 18000) / luck; } }
  }
  // a rocket takes off from the space port
  if (s.b[7] && !ci.rocket && ci.tick % 1800 === 900 && ci.portX != null) ci.rocket = {x: ci.portX, y: ci.portY, v: 0};
  if (ci.rocket) { const r = ci.rocket; r.v += .015; r.y -= r.v; if (r.y < -40) ci.rocket = null; }
  for (const b of ci.booms) b.t--; ci.booms = ci.booms.filter(b => b.t > 0);
  for (const p of ci.pops) { p.y -= .4; p.t--; } ci.pops = ci.pops.filter(p => p.t > 0);
  if (ci.banner && --ci.banner.t <= 0) ci.banner = null;
}
/* ---------- drawing: each kind of building has its own district, the city fills up as you buy; day and night pass every 4 minutes ---------- */
const ciHash = (a, b = 0, c = 0) => { let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519) ^ Math.imul(c + 3266489917, 3266489917); h = Math.imul(h ^ h >>> 13, 1274126177); return (h ^ h >>> 16) >>> 0; };
const ciShade = (c, k) => k >= 0 ? mixc(c, '#ffffff', k) : mixc(c, '#000000', -k);
const ciRgba = (hex, a) => 'rgba(' + [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)).join(',') + ',' + a + ')';
// the night darkens every colour (cached per shade); lights (lit) stay bright
let NF = 0; const ciNC = new Map();
const ciN = c => { if (!NF || c[0] !== '#') return c; let v = ciNC.get(c); if (!v) { v = mixc(c, '#140a3a', NF * .6); ciNC.set(c, v); } return v; };
const pz = (g, c, x, y, w = 1, h = 1) => px(g, ciN(c), x, y, w, h);
const lit = px;
const ciWin = (g, on, x, y, w, h) => on ? lit(g, '#ffd07a', x, y, w, h) : pz(g, NF > .5 ? '#241a48' : '#7a8ac0', x, y, w, h);
function ciBlk(g, x, y, w, h, col) {  // a volume: dark outline, lit left side, shadow on the right
  pz(g, '#0d0620', x - 1, y - 1, w + 2, h + 2); pz(g, col, x, y, w, h); pz(g, ciShade(col, .3), x, y, 1, h); pz(g, ciShade(col, .2), x, y, w, 1); pz(g, ciShade(col, -.35), x + w - 1, y, 1, h);
}
function ciWins(g, x, y, w, h, seed, t) {  // windows: more of them lit at night, one blinks now and then
  for (let yy = y + 2; yy + 2 <= y + h - 1; yy += 4) for (let xx = x + 2; xx + 2 <= x + w - 3; xx += 4) { const hv = ciHash(seed, xx, yy); if (hv % 53 === (t >> 6) % 53) lit(g, '#fff6c8', xx, yy, 2, 2); else ciWin(g, hv % 10 < 2 + NF * 6, xx, yy, 2, 2); }
}
// 16 kinds of buildings: width, height and drawing (x = left edge, b = ground, h = height, col = colour, s = seed, t = time)
const CI_W = [22, 22, 24, 16, 20, 22, 10, 26, 26, 14, 24, 22, 28, 24, 22, 18];
const CI_H = [14, 12, 10, 24, 24, 24, 26, 26, 30, 40, 26, 32, 36, 36, 56, 54];
const CI_ART = [
  (g, x, b, h, col, s, t) => {  // module d'habitat: glass dome on a slab
    const r = 10; ciBlk(g, x, b - 3, 22, 3, '#4a3c86');
    for (let dy = 0; dy < r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)), y = b - 4 - dy; pz(g, '#0d0620', x + 11 - hw - 1, y, 1, 1); pz(g, '#0d0620', x + 11 + hw, y, 1, 1); pz(g, ciShade(col, .5 - dy / r * .5), x + 11 - hw, y, hw * 2, 1); }
    pz(g, '#0d0620', x + 5, b - 4 - r, 12, 1); pz(g, '#ffffff', x + 5, b - 12, 2, 1); pz(g, '#ffffff', x + 4, b - 11, 1, 2);
    for (let k = 0; k < 4; k++) ciWin(g, ciHash(s, k) % 10 < 3 + NF * 6, x + 5 + k * 4, b - 7, 2, 3);
  },
  (g, x, b, h, col, s, t) => {  // serre hydroponique: pink grow lights at night
    ciBlk(g, x, b - 11, 22, 11, '#2f6a52'); for (let k = 0; k < 5; k++) { pz(g, k % 2 ? '#8ee8a0' : '#5fd08a', x + 2 + k * 4, b - 9, 3, 7); pz(g, '#2a8a4a', x + 2 + k * 4, b - 3, 3, 2); }
    pz(g, '#c8ffe0', x + 1, b - 11, 20, 1); if (NF > .3) lit(g, ciRgba('#ff7ad9', (NF * .5).toFixed(2)), x + 1, b - 10, 20, 7); else pz(g, '#ffffff', x + 3 + (t >> 4) % 14, b - 10, 1, 4);
  },
  (g, x, b, h, col, s, t) => {  // champ solaire: panels that catch the light by day
    for (let q = 0; q < 3; q++) { const x0 = x + q * 8; pz(g, '#5a5470', x0 + 3, b - 5, 2, 5); ciBlk(g, x0, b - 10, 7, 5, '#2f6bc0'); pz(g, '#1d4f9a', x0 + 3, b - 10, 1, 5); pz(g, '#1d4f9a', x0, b - 8, 7, 1); if (NF < .5) pz(g, '#cfe8ff', x0 + (q * 2 + (t >> 3)) % 6, b - 9, 1, 3); }
  },
  (g, x, b, h, col, s, t) => {  // mine d'astéroïdes: crane and its bucket
    ciBlk(g, x, b - 6, 16, 6, '#4a4a60'); ciBlk(g, x + 10, b - h, 4, h - 6, '#6a6a84'); pz(g, '#0d0620', x, b - h - 1, 15, 4); pz(g, '#e0b860', x + 1, b - h, 13, 2);
    const sw = Math.round(Math.sin(t / 30 + s) * 2); pz(g, '#222222', x + 3 + sw, b - h + 2, 1, 9); ciBlk(g, x + 1 + sw, b - h + 10, 5, 3, '#a08a70'); pz(g, '#a08a70', x - 4, b - 3, 4, 3); pz(g, '#6a5a48', x - 6, b - 1, 6, 1);
    lit(g, (t >> 5) % 2 ? '#ff4f6d' : '#5a1020', x + 12, b - h - 2, 1, 1);
  },
  (g, x, b, h, col, s, t) => {  // raffinerie de glace: two tanks and a smoking chimney
    ciBlk(g, x, b - h + 4, 8, h - 4, '#c9e8ff'); ciBlk(g, x + 8, b - h + 10, 6, h - 10, '#a8d0f0'); pz(g, '#6aa0d0', x + 1, b - h + 9, 6, 1); pz(g, '#6aa0d0', x + 1, b - h + 15, 6, 1);
    ciBlk(g, x + 15, b - h - 6, 4, h + 6, '#8f8fa8'); lit(g, '#ff5a5a', x + 15, b - h - 6, 4, 2); lit(g, '#ff5a5a', x + 15, b - h, 4, 2);
    for (let k = 0; k < 4; k++) { const u = ((t >> 1) + k * 9) % 36; px(g, ciRgba(ciN('#e6e0ff'), .55 - u / 80), x + 16 + Math.round(Math.sin(u / 6 + k) * 2), b - h - 8 - u / 2 | 0, 2, 2); }
  },
  (g, x, b, h, col, s, t) => {  // chantier naval: gantry and a hull being built, welding sparks
    pz(g, '#0d0620', x - 1, b - h - 1, 24, 4); pz(g, '#6a6490', x, b - h, 22, 2); ciBlk(g, x, b - h + 2, 2, h - 2, '#6a6490'); ciBlk(g, x + 20, b - h + 2, 2, h - 2, '#6a6490');
    ciBlk(g, x + 4, b - 9, 14, 6, col); pz(g, '#ffffff', x + 14, b - 8, 3, 2); pz(g, ciShade(col, -.4), x + 5, b - 4, 12, 1); lit(g, '#ffd07a', x + 2, b - 3, 18, 1);
    if ((t >> 3) % 3) lit(g, '#fff6c8', x + 5 + (t >> 2) % 10, b - 10, 2, 2);
  },
  (g, x, b, h, col, s, t) => {  // laboratoire orbital: glass tower, dish and beacon
    ciBlk(g, x, b - h, 10, h, col); ciWins(g, x, b - h, 10, h, s, t); pz(g, '#c0c0d0', x + 4, b - h - 8, 1, 8); pz(g, '#dddde8', x + 6, b - h - 5, 3, 2); lit(g, (t >> 4) % 2 ? '#ff4f6d' : '#5a1020', x + 4, b - h - 9, 1, 1);
  },
  (g, x, b, h, col, s, t) => {  // port spatial: landing pad with a shuttle, control tower
    ciBlk(g, x, b - 4, 26, 4, '#5a5478'); pz(g, '#e8e070', x + 2, b - 4, 14, 1);
    for (let k = 0; k < 4; k++) lit(g, (t >> 4) % 4 === k ? '#7fe0ee' : '#2a5a6a', x + 1 + k * 5, b - 2, 2, 1);
    ciBlk(g, x + 20, b - h, 4, h - 4, '#8a84a8'); ciBlk(g, x + 18, b - h - 5, 8, 5, col); lit(g, '#bff4ff', x + 19, b - h - 4, 6, 2); lit(g, (t >> 5) % 2 ? '#ff4f6d' : '#5a1020', x + 21, b - h - 7, 2, 2);
    ciBlk(g, x + 3, b - 10, 12, 6, '#e8e4f0'); pz(g, '#e8e4f0', x + 15, b - 8, 2, 3); pz(g, col, x + 3, b - 7, 12, 1); pz(g, '#4a8ad0', x + 11, b - 9, 3, 2); pz(g, '#9a94b8', x + 1, b - 6, 3, 2);
  },
  (g, x, b, h, col, s, t) => {  // anneau d'habitation: a standing ring of homes on a pylon
    const R = 11, cx = x + 13, cy = b - h + R + 1;
    ciBlk(g, cx - 2, cy + R, 4, b - cy - R, '#6a6490'); ciBlk(g, x + 4, b - 3, 18, 3, '#4a3c86');
    for (let a = 0; a < 72; a++) { const an = a / 72 * Math.PI * 2; pz(g, '#0d0620', cx + Math.cos(an) * R - 1, cy + Math.sin(an) * R - 1, 3, 3); }
    for (let a = 0; a < 72; a++) { const an = a / 72 * Math.PI * 2; pz(g, ciShade(col, -Math.sin(an + .8) * .3), cx + Math.cos(an) * R, cy + Math.sin(an) * R, 2, 2); }
    for (let k = 0; k < 10; k++) { const an = k / 10 * Math.PI * 2 + t / 500; ciWin(g, ciHash(s, k) % 10 < 3 + NF * 6, cx + Math.cos(an) * R, cy + Math.sin(an) * R, 1, 1); }
  },
  (g, x, b, h, col, s, t) => {  // ascenseur spatial: a cable up out of sight, a capsule climbing it
    const live = g === ci?.g;
    if (live) { g.fillStyle = ciRgba('#e8e4d0', .3); g.fillRect(x + 6, 0, 1, b - h - 6); }
    ciBlk(g, x, b - h, 14, h, '#6a6490'); ciBlk(g, x + 3, b - h - 6, 8, 6, col); ciWins(g, x, b - h + 2, 14, h - 2, s, t);
    if (live) { const cy = (b - h - 10) - ((t * .4 + s % 300) % (b - h - 10)); ciBlk(g, x + 4, cy, 5, 4, '#e8e4d0'); lit(g, '#7fe0ee', x + 5, cy + 1, 3, 1); }
  },
  (g, x, b, h, col, s, t) => {  // forge stellaire: a furnace with a glowing core
    ciBlk(g, x, b - h + 8, 24, h - 8, '#4a3a4a'); ciBlk(g, x + 2, b - h, 4, 8, '#5a4a5a'); ciBlk(g, x + 18, b - h - 4, 4, 12, '#5a4a5a'); pz(g, col, x, b - h + 8, 24, 2);
    const p = .6 + Math.sin(t / 20 + s) * .4; lit(g, ciRgba('#ff7a2f', (.5 + p * .5).toFixed(2)), x + 7, b - h + 12, 10, 8); lit(g, ciRgba('#ffe08a', p.toFixed(2)), x + 9, b - h + 14, 6, 4);
    for (let k = 0; k < 3; k++) { const u = ((t >> 1) + k * 12) % 36; px(g, ciRgba(ciN('#c0a0a0'), .5 - u / 80), x + 19 + Math.round(Math.sin(u / 5 + k) * 2), b - h - 6 - u / 2 | 0, 2, 2); }
  },
  (g, x, b, h, col, s, t) => {  // essaim de Dyson: a dish beaming the sun's power down
    ciBlk(g, x + 8, b - h + 10, 6, h - 10, '#6a6490'); ciBlk(g, x + 3, b - 4, 16, 4, '#4a3c86');
    for (let dx = 0; dx < 22; dx++) { const y0 = b - h + 2 + Math.round((dx - 11) ** 2 / 18); pz(g, '#0d0620', x + dx, y0 - 1, 1, 4); pz(g, ciShade(col, .25 - dx / 60), x + dx, y0, 1, 2); }
    lit(g, '#fff6c8', x + 10, b - h - 4, 2, 2); pz(g, '#c0c0d0', x + 10, b - h - 2, 2, 4);
    if (g === ci?.g && ci.sun) { const [sx, sy] = ci.sun, n = Math.hypot(sx - x - 11, sy - b + h + 4) / 4; for (let k = 1; k < n; k += 1) if ((k + (t >> 2)) % 3 === 0) lit(g, ciRgba('#ffe08a', .45), x + 11 + (sx - x - 11) * k / n, b - h - 4 + (sy - b + h + 4) * k / n, 1, 1); }
  },
  (g, x, b, h, col, s, t) => {  // portail de saut: a frame with a swirl inside
    ciBlk(g, x, b - h, 4, h, '#5a5478'); ciBlk(g, x + 24, b - h, 4, h, '#5a5478'); ciBlk(g, x, b - h - 3, 28, 4, '#6a6490'); ciBlk(g, x - 2, b - 3, 32, 3, '#4a3c86');
    lit(g, ciRgba(col, .25), x + 4, b - h + 1, 20, h - 4);
    for (let k = 0; k < 30; k++) { const an = k * 2.4 + t / 25, rr = (k * 7 % 10 + 1) / 11; lit(g, ciRgba(k % 3 ? col : '#ffffff', (.4 + rr * .6).toFixed(2)), x + 14 + Math.cos(an) * 9 * rr, b - h / 2 - 2 + Math.sin(an) * (h / 2 - 4) * rr, 2, 2); }
  },
  (g, x, b, h, col, s, t) => {  // cerveau-planète: a dome of folds with synapses flashing, an antenna
    const R = 11, cy = b - 5; ciBlk(g, x + 10, b - h, 4, h - 14, '#6a6490'); lit(g, (t >> 4) % 2 ? '#ff8ae6' : '#5a1050', x + 11, b - h - 2, 2, 2);
    ciBlk(g, x, b - 5, 24, 5, '#4a3c86');
    for (let dy = 0; dy < R; dy++) { const hw = Math.round(Math.sqrt(R * R - dy * dy)); pz(g, '#0d0620', x + 12 - hw - 1, cy - 1 - dy, hw * 2 + 2, 1); pz(g, mixc('#ff8ad8', '#6a2a6a', dy / R * .5), x + 12 - hw, cy - 1 - dy, hw * 2, 1); }
    for (let k = 0; k < 14; k++) pz(g, '#c05aa0', x + 4 + ciHash(s, k) % 16, cy - 2 - ciHash(s, k, 1) % 8, 3, 1);
    for (let k = 0; k < 5; k++) if (((t >> 3) + k * 5) % 11 < 3) lit(g, '#fff0ff', x + 5 + ciHash(s, k, 2) % 14, cy - 3 - ciHash(s, k, 3) % 7, 1, 1);
  },
  (g, x, b, h, col, s, t) => {  // moteur à trou noir: a tower holding a black sphere in a glowing disc
    ciBlk(g, x + 6, b - h + 14, 10, h - 14, '#3a3450'); ciBlk(g, x + 2, b - 6, 18, 6, '#4a3c86'); ciWins(g, x + 6, b - h + 16, 10, h - 18, s, t);
    const cx = x + 11, cy = b - h + 6, ring = front => { for (let a = 0; a < 48; a++) { const an = a / 48 * Math.PI * 2 + t / 60; if ((Math.sin(an) >= 0) === front) lit(g, front ? '#ffe08a' : ciRgba('#ffb04f', .8), cx + Math.cos(an) * 13, cy + Math.sin(an) * 3, 2, 1); } };
    ring(false);
    for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const d = Math.hypot(dx, dy); if (d <= 5) px(g, d > 4.2 ? '#ff7a2f' : '#05010b', cx + dx, cy + dy); }
    ring(true);
  },
  (g, x, b, h, col, s, t) => {  // architecte du vide: a crystal floating over its base
    ciBlk(g, x + 1, b - 4, 16, 4, '#4a3c86'); lit(g, ciRgba('#b46aee', .5), x + 4, b - 6, 10, 2);
    const bob = Math.round(Math.sin(t / 30 + s) * 2), top = b - h + bob, bot = b - 10 + bob, mid = top + (bot - top) * .6;
    for (let y = top; y < bot; y++) { const k = y < mid ? (y - top) / (mid - top) : (bot - y) / (bot - mid), hw = Math.max(1, Math.round(k * 7)); pz(g, '#0d0620', x + 9 - hw - 1, y, hw * 2 + 2, 1); pz(g, mixc('#2a1050', col, .35 + .35 * (y % 7) / 7), x + 9 - hw, y, hw, 1); pz(g, mixc('#5a2a9a', '#ffffff', .25), x + 9, y, hw, 1); }
    lit(g, ciRgba('#ffffff', .8), x + 9, top + 3, 1, bot - top - 6);
  },
];
function ciPaint(g, i, x, b, h, t, seed) { CI_ART[i % 16](g, x, b, h, CI.cols[i % 16], seed, t); }
function ciStation(g, x, y, col, t) {  // a megastructure: a station in orbit, its ring turning
  const ring = front => { for (let a = 0; a < 56; a++) { const an = a / 56 * Math.PI * 2 + t / 200; if ((Math.sin(an) > 0) === front) pz(g, front ? col : ciShade(col, -.45), x + Math.cos(an) * 16, y + Math.sin(an) * 5, 2, 2); } };
  ring(false); pz(g, '#2f6bc0', x - 13, y - 1, 7, 3); pz(g, '#2f6bc0', x + 7, y - 1, 7, 3);
  ciBlk(g, x - 3, y - 6, 7, 12, '#c0c0d0'); pz(g, col, x - 3, y - 1, 7, 2); lit(g, (t >> 4) % 2 ? '#ffffff' : col, x, y - 8, 1, 2);
  ring(true); for (let k = 0; k < 6; k++) { const an = k / 6 * Math.PI * 2 + t / 200; if (Math.sin(an) > 0) lit(g, '#ffd07a', x + Math.cos(an) * 16, y + Math.sin(an) * 5, 1, 1); }
}
function ciSite(g, x, b, t) {  // a building site where the next kind of building will stand
  pz(g, '#5a5478', x, b - 18, 1, 18); pz(g, '#5a5478', x + 14, b - 18, 1, 18);
  for (let y = b - 18; y < b; y += 6) { pz(g, '#5a5478', x, y, 15, 1); for (let k = 0; k < 6; k++) pz(g, '#4a4470', x + k * 2.5, y + k, 1, 1); }
  pz(g, '#e0b860', x + 7, b - 30, 1, 30); pz(g, '#e0b860', x - 4, b - 30, 22, 1); pz(g, '#222222', x + 16 - ((t >> 5) % 6), b - 29, 1, 8); lit(g, (t >> 4) % 2 ? '#ff4f6d' : '#5a1020', x + 7, b - 32, 1, 1);
  for (const cx of [x - 5, x + 17]) { pz(g, '#ff7a2f', cx, b - 3, 3, 3); pz(g, '#ffffff', cx, b - 2, 3, 1); }
}
// where every building stands: front row the small kinds, then the towers, then the giants; copies fill their district as you buy more
function ciCity(s) {
  const out = [], nxt = ciTiers() - 1;
  for (let i = 0; i < 16; i++) {
    const n = s.b[i] || 0, row = i < 6 ? 0 : i < 11 ? 1 : 2, dw = row ? 96 : 80, dx = (row ? i - (row === 1 ? 6 : 11) : i) * dw, base = [232, 222, 214][row];
    if (!n) { if (i === nxt) out.push({i, row, site: true, x: dx + dw / 2 - 7, b: base}); continue; }
    const c = Math.min(row ? 4 : 5, 1 + Math.floor(Math.log(n) / Math.log(4))), grow = Math.min(20, Math.floor(Math.log2(n)) * 2);
    for (let j = 0; j < c; j++) out.push({i, j, row, x: Math.round(dx + dw * (j + .5) / c - CI_W[i] / 2 + (c > 1 ? ciHash(i, j, 9) % 7 - 3 : 0)), b: base - (j % 2) * 2, h: CI_H[i] + grow + ciHash(i, j) % 6 - (j % 2) * 3});
  }
  return out.sort((a, b) => b.row - a.row || a.b - b.b);
}
function ciPlanet(pc, sky) {  // the big moon, drawn once: bands, shade, craters
  const key = pc + sky; if (ci.planet?.key === key) return ci.planet.cv;
  const cv = document.createElement('canvas'), R = 22; cv.width = cv.height = R * 2 + 14; const g = cv.getContext('2d');
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const d = Math.hypot(dx, dy); if (d > R) continue;
    const lt = (-dx * .6 - dy * .8) / R, band = Math.sin(dy / 2.6 + Math.sin(dx / 9)) * .08;
    let c = mixc(pc, '#ffffff', Math.max(0, lt) * .35 + band); if (lt < -.1) c = mixc(c, sky, Math.min(.85, -lt * .9)); if (d > R - 1.2) c = mixc(c, sky, .35);
    px(g, c, dx + R + 7, dy + R + 7);
  }
  for (const [cx, cy, cr] of [[-8, -4, 3], [6, 8, 4], [4, -12, 2]]) for (let dy = -cr; dy <= cr; dy++) for (let dx = -cr; dx <= cr; dx++) if (Math.hypot(dx, dy) <= cr && Math.hypot(cx + dx, cy + dy) < R - 2) px(g, mixc(pc, sky, .35), cx + dx + R + 7, cy + dy + R + 7);
  ci.planet = {key, cv}; return cv;
}
function ciDisc(r, col) {  // the sun or the small moon, with its halo, drawn once
  const key = r + col; ci.discs ??= {}; if (ci.discs[key]) return ci.discs[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 36; const g = cv.getContext('2d');
  for (let dy = -18; dy < 18; dy++) for (let dx = -18; dx < 18; dx++) { const d = Math.hypot(dx + .5, dy + .5); if (d < r) px(g, mixc(col, '#ffffff', Math.max(0, (-dx - dy) / r * .3)), dx + 18, dy + 18); else if (d < r * 2.4) px(g, ciRgba(col, (.22 * (1 - (d - r) / (r * 1.4))).toFixed(3)), dx + 18, dy + 18); }
  return ci.discs[key] = cv;
}
function ciMtn(k) {  // a planet's mountains, computed once
  ci.mtn ??= {}; if (ci.mtn[k]) return ci.mtn[k];
  const r = seeded(900 + k), p = Array.from({length: 6}, () => r() * 6.28), f = [], n = [];
  for (let x = 0; x < CI.W; x += 2) { f.push(Math.round(26 + 14 * Math.sin(x / 61 + p[0]) + 8 * Math.sin(x / 23 + p[1]) + 3 * Math.sin(x / 7 + p[2]))); n.push(Math.round(10 + 7 * Math.sin(x / 37 + p[3]) + 4 * Math.sin(x / 15 + p[4]) + 2 * Math.sin(x / 5 + p[5]))); }
  return ci.mtn[k] = {f, n};
}
const CI_CARS = ['#ff5ad9', '#7fe0ee', '#ffd07a', '#8ee8a0', '#ff7a4f', '#e8e4f0'];
function ciDraw() {
  const g = ci.g, t = ci.tick, s = ciSave(), P = ciPl(), pk = CI_PL.indexOf(P), W = CI.W, H = CI.H, tot = s.b.reduce((a, n) => a + (n || 0), 0);
  // the hour: a full day every 4 minutes, the same on every PC
  const ph = ci.phase ?? (Date.now() / 240000) % 1, sa = Math.sin(ph * Math.PI * 2), day = Math.max(0, Math.min(1, sa * 2.5 + .5)), dusk = Math.max(0, 1 - Math.abs(sa) * 3.5);
  const nf = Math.round((1 - day) * 32) / 32; if (nf !== NF) { NF = nf; ciNC.clear(); }
  const top = mixc(P.sky[0], P.sky[2], day), hor = mixc(P.sky[1], P.sky[3], day);
  for (let y = 0; y < 216; y += 3) { let c = mixc(top, hor, Math.pow(y / 216, 1.5)); if (dusk) c = mixc(c, P.sky[4], dusk * Math.pow(y / 216, 2.5) * .8); px(g, c, 0, y, W, 3); }
  if (NF > .05) { const r = seeded(5 + pk); for (let i = 0; i < 160; i++) { const x = r() * W | 0, y = r() * 190 | 0, tw = (i * 7 + (t >> 4)) % 13; px(g, 'rgba(255,255,255,' + (NF * (tw === 0 ? 1 : tw < 3 ? .3 : .65)).toFixed(2) + ')', x, y); } }
  if (P.aurora && NF > .3) for (let x = 0; x < W; x += 2) { const y = 34 + Math.sin(x / 50 + t / 200) * 14 + Math.sin(x / 13 + t / 90) * 4 | 0, a = Math.max(0, NF * (.16 + .1 * Math.sin(x / 30 + t / 70))); g.fillStyle = ciRgba(P.aurora, a.toFixed(3)); g.fillRect(x, y, 2, 24); g.fillStyle = ciRgba(P.aurora, (a * .45).toFixed(3)); g.fillRect(x, y + 24, 2, 16); }
  // the sun by day, the small moon by night, the big moon always, the Dyson swarm around the sun
  const sx = -20 + (ph / .5) * (W + 40), sy = 205 - sa * 175, mph = (ph + .5) % 1, msa = Math.sin(mph * Math.PI * 2);
  ci.sun = sa > .05 && NF < .6 ? [sx, sy] : null;
  if (sa > -.15) g.drawImage(ciDisc(7, '#fff0c0'), sx - 18 | 0, sy - 18 | 0);
  if (msa > -.15) g.drawImage(ciDisc(5, '#e8e4ff'), -20 + (mph / .5) * (W + 40) - 18 | 0, 205 - msa * 175 - 18 | 0);
  if (s.b[11] && sa > -.15) for (let k = 0; k < 24; k++) { const an = k / 24 * Math.PI * 2 + t / 300 * (k % 2 ? 1 : -1), rr = 14 + k % 3 * 4; lit(g, '#ffd07a', sx + Math.cos(an) * rr, sy + Math.sin(an) * rr * .4, 1, 1); }
  g.globalAlpha = .55 + NF * .45;
  if (s.colonies || tot > 50) { g.strokeStyle = 'rgba(255,208,122,.35)'; g.lineWidth = 2; g.beginPath(); g.ellipse(410, 58, 36, 8, -.35, Math.PI, Math.PI * 2); g.stroke(); }
  g.drawImage(ciPlanet(P.moon, P.sky[0]), 410 - 29, 58 - 29);
  if (s.colonies || tot > 50) { g.beginPath(); g.ellipse(410, 58, 36, 8, -.35, 0, Math.PI); g.stroke(); }
  g.globalAlpha = 1;
  const megas = s.b.slice(16).filter(n => n > 0).length;
  for (let k = 0; k < Math.min(6, megas); k++) ciStation(g, 50 + k * 62, 48 + (k % 2) * 22, CI.cols[(k * 5 + 2) % 16], t + k * 50);
  // clouds
  const cr = seeded(31 + pk), cc = mixc(mixc(hor, '#ffffff', .55), '#2a2050', NF * .7);
  for (let k = 0; k < 7; k++) { const w = 30 + cr() * 50 | 0, y = 40 + cr() * 100 | 0, sp = .02 + cr() * .04, x = ((cr() * (W + 140) + t * sp) % (W + 140)) - 70 | 0; g.fillStyle = ciRgba(cc, .5); g.fillRect(x, y, w, 4); g.fillRect(x + 5, y - 3, w - 14, 3); g.fillRect(x + w * .35 | 0, y - 6, w * .3 | 0, 3); g.fillStyle = ciRgba(mixc(cc, '#ffffff', .35), .35); g.fillRect(x + 6, y - 3, w - 18, 1); }
  for (const sh of ci.ships) {
    if (sh.cargo) { px(g, '#0d0620', sh.x - 1, sh.y - 1, 18, 7); px(g, '#ffd07a', sh.x, sh.y, 16, 5); px(g, '#ffffff', sh.x + 11, sh.y + 1, 4, 2); px(g, '#ff7a4f', sh.x - 3 - (t >> 2) % 2, sh.y + 1, 3, 3); px(g, '#fff6c8', sh.x + 2, sh.y + 1, 2, 1); }
    else { pz(g, '#d9c6ff', sh.x, sh.y, 5, 2); lit(g, '#7fe0ee', sh.x + (sh.v > 0 ? -2 : 5), sh.y, 2, 2); for (let k = 1; k < 5; k++) px(g, ciRgba('#7fe0ee', .4 - k * .07), sh.x + (sh.v > 0 ? -2 - k * 2 : 6 + k * 2), sh.y, 1, 1); }
  }
  // the mountains (snow on Cryos, lava on Pyra) and, far away, the lights of the rest of the colony
  const M = ciMtn(pk), fc = mixc(P.mtn[0], top, .5 + NF * .15), nc = mixc(P.mtn[1], top, .25 + NF * .2);
  for (let x = 0; x < W; x += 2) { const h = M.f[x >> 1]; px(g, fc, x, 200 - h, 2, h + 14); if (P.snow && h > 28) px(g, mixc('#ffffff', top, .3 + NF * .3), x, 200 - h, 2, Math.min(4, h - 28)); }
  const fr = seeded(77 + pk), far = Math.min(80, tot / 4 | 0), fcol = mixc(nc, top, .35);
  for (let k = 0; k < far; k++) { const x = fr() * W | 0, h = 4 + fr() * 22 | 0; px(g, fcol, x, 208 - h, 5, h); if (NF > .3 && fr() < .7) lit(g, 'rgba(255,208,122,.55)', x + 2, 208 - h + 2 + (fr() * 4 | 0), 1, 1); }
  for (let x = 0; x < W; x += 2) { const h = M.n[x >> 1]; px(g, nc, x, 212 - h, 2, h + 4); if (P.lava && (x * 7) % 46 < 2) lit(g, ciRgba('#ff6a2a', (.3 + NF * .5).toFixed(2)), x, 212 - h + 3, 1, h); }
  // the ground
  pz(g, mixc(P.ground, top, .3), 0, 208, W, 6); pz(g, P.ground, 0, 214, W, 22); pz(g, ciShade(P.ground, .15), 0, 214, W, 1); pz(g, ciShade(P.ground, -.12), 0, 224, W, 1);
  // the buildings, row by row, with some haze between
  ci.portX = null; let lastRow = 2;
  const rowDone = row => {
    if (row === 2) { g.fillStyle = ciRgba(hor, .14); g.fillRect(0, 100, W, 116);
      if (tot >= 30) {  // the monorail
        for (let x = 10; x < W; x += 64) pz(g, '#4a4470', x, 202, 3, 14); pz(g, '#0d0620', 0, 199, W, 4); pz(g, '#6a6490', 0, 200, W, 2);
        const tx = (t * 1.3 % (W + 300)) - 150 | 0; for (let c = 0; c < 3; c++) { const cx = tx + c * 20; pz(g, '#0d0620', cx - 1, 191, 19, 9); pz(g, '#e8e4f0', cx, 192, 17, 7); pz(g, CI.cols[pk + 1], cx, 197, 17, 1); for (let w = 0; w < 4; w++) ciWin(g, true, cx + 2 + w * 4, 193, 2, 2); }
      }
      if (tot >= 20) for (let k = 0; k < Math.min(6, tot / 20 | 0); k++) { const dir = k % 2 ? -1 : 1, y = 152 + (k * 13) % 30, x = ((k * 131 + dir * t * (.6 + k % 3 * .2)) % (W + 30) + W + 30) % (W + 30) - 15 | 0; pz(g, '#0d0620', x - 1, y - 1, 8, 4); pz(g, CI_CARS[k % 6], x, y, 6, 2); lit(g, (t >> 3) % 2 ? '#ff4f6d' : '#5a1020', dir > 0 ? x : x + 5, y + 2, 1, 1); lit(g, '#fff6c8', dir > 0 ? x + 6 : x - 1, y, 1, 1); }
    }
    if (row === 1) { g.fillStyle = ciRgba(hor, .08); g.fillRect(0, 150, W, 72); }
  };
  for (const it of ciCity(s)) {
    while (lastRow > it.row) rowDone(lastRow--);
    if (it.site) ciSite(g, it.x, it.b, t); else ciPaint(g, it.i, it.x, it.b, it.h, t + it.j * 40, ciHash(it.i, it.j, 5));
    if (it.i === 7 && it.j === 0) { ci.portX = it.x + 9; ci.portY = it.b - 10; }
  }
  while (lastRow > 0) rowDone(lastRow--);
  if (ci.rocket) { const r = ci.rocket, x = r.x | 0, y = r.y | 0; for (let k = 0; k < 10; k++) px(g, ciRgba(ciN('#d8d0e8'), (.5 - k * .045).toFixed(2)), x - 1 - k / 3, y + 12 + k * 4, 4 + k / 1.5, 4); pz(g, '#0d0620', x - 1, y - 4, 6, 15); pz(g, '#e8e4f0', x, y - 2, 4, 12); pz(g, '#ff4f6d', x + 1, y - 4, 2, 2); pz(g, '#4a8ad0', x + 1, y + 1, 2, 2); lit(g, (t >> 1) % 2 ? '#ffe08a' : '#ff7a2f', x, y + 10, 4, 3 + (t >> 1) % 3); }
  // sidewalk with people, the road with hover cars, street lamps, the foreground
  pz(g, ciShade(P.ground, .25), 0, 232, W, 4);
  const np = s.b[0] ? Math.min(18, 2 + Math.floor(Math.log2(s.b[0]) * 1.5)) : 0;
  for (let k = 0; k < np; k++) { const dir = k % 2 ? 1 : -1, x = ((k * 61 + dir * t * (.1 + (k % 3) * .04)) % W + W) % W | 0, st = ((t >> 3) + k) & 1; pz(g, '#f0d0b0', x, 228, 1, 1); pz(g, CI_CARS[k % 6], x, 229, 1, 3); pz(g, '#2a2248', x - (st ? 1 : 0), 232, 1, 2); pz(g, '#2a2248', x + (st ? 1 : 0), 232, 1, 2); }
  pz(g, '#1a1430', 0, 236, W, 16); pz(g, '#2a2248', 0, 236, W, 1); for (let x = 0; x < W; x += 20) pz(g, '#5a5080', x, 243, 8, 1);
  const nv = tot ? Math.min(10, 1 + Math.floor(tot / 15)) : 0;
  for (let k = 0; k < nv; k++) {
    const dir = k % 2 ? -1 : 1, y = dir > 0 ? 238 : 246, x = ((k * 97 + dir * t * (.5 + (k * 37 % 10) / 14)) % (W + 30) + W + 30) % (W + 30) - 15 | 0, c = CI_CARS[k % 6];
    lit(g, ciRgba('#7fe0ee', .45), x + 1, y + 4, 7, 1); pz(g, '#0d0620', x - 1, y - 2, 11, 6); pz(g, c, x, y, 9, 3); pz(g, ciShade(c, .35), x + 2, y - 1, 5, 1); pz(g, '#9ad8ff', x + (dir > 0 ? 5 : 2), y, 2, 1);
    lit(g, '#fff6c8', dir > 0 ? x + 9 : x - 1, y + 1, 1, 1); lit(g, '#ff4f6d', dir > 0 ? x - 1 : x + 9, y + 1, 1, 1);
    if (NF > .4) { g.fillStyle = ciRgba('#fff6c8', (NF * .22).toFixed(2)); g.fillRect(dir > 0 ? x + 10 : x - 10, y, 9, 3); }
  }
  for (let x = 20; x < W; x += 60) { pz(g, '#5a5478', x, 220, 1, 16); pz(g, '#5a5478', x, 220, 4, 1); lit(g, NF > .35 ? '#fff0b0' : '#8a84a8', x + 3, 221, 2, 1); if (NF > .35) { g.fillStyle = ciRgba('#fff0b0', (NF * .12).toFixed(2)); g.fillRect(x - 3, 222, 13, 14); } }
  pz(g, '#3a2a6e', 0, 252, W, 2); pz(g, ciShade(P.ground, -.35), 0, 254, W, H - 254);
  const pr = seeded(55 + pk); for (let k = 0; k < 40; k++) { const x = pr() * W | 0, y = 258 + pr() * 10 | 0, h = 2 + pr() * 3 | 0; pz(g, P.flora, x, y - h, 1, h); pz(g, ciShade(P.flora, -.3), x + 1, y - h + 1, 1, h - 1); }
  // events: meteors, the merchant, bursts
  for (const m of ci.meteors) { for (let k = 14; k > 0; k--) px(g, ciRgba(k < 5 ? '#ffe08a' : '#ff7a2f', ((1 - k / 15) * .8).toFixed(2)), m.x - m.vx * k * 2, m.y - m.vy * k * 2, 2, 2); px(g, ciRgba('#ffe08a', .3), m.x - 4, m.y - 4, 9, 9); px(g, '#0d0620', m.x - 2, m.y - 2, 5, 5); px(g, '#fff6c8', m.x - 1, m.y - 1, 3, 3); }
  if (ci.merch) {
    const m = ci.merch, x = m.x | 0, y = m.y + Math.sin(t / 20) * 2 | 0;
    px(g, ciRgba('#7fe0ee', (.45 + .3 * Math.sin(t / 5)).toFixed(2)), x - 8, y + 6, 16, 2);
    px(g, '#0d0620', x - 15, y - 1, 30, 7); px(g, '#e0b860', x - 14, y, 28, 5); px(g, '#fff0b0', x - 12, y, 24, 1); px(g, '#a07a30', x - 14, y + 4, 28, 1);
    px(g, '#0d0620', x - 6, y - 6, 12, 6); px(g, '#9ad8ff', x - 5, y - 5, 10, 5); px(g, '#ffffff', x - 3, y - 4, 2, 2);
    for (let k = 0; k < 5; k++) px(g, ((t >> 3) + k) % 5 === 0 ? '#ffffff' : '#ff8ae6', x - 12 + k * 6, y + 2, 2, 1);
    if (m.st === 'wait' && !ci.offer) { const by = y - 21 + ((t >> 4) % 2); px(g, '#0d0620', x - 5, by, 11, 12); px(g, '#ffffff', x - 4, by + 1, 9, 10); px(g, '#ff4f6d', x - 1, by + 3, 3, 4); px(g, '#ff4f6d', x - 1, by + 8, 3, 2); }
  }
  for (const b of ci.booms) { const r = (22 - b.t) * 1.3; for (let k = 0; k < 12; k++) px(g, ciRgba('#ffe08a', (b.t / 22).toFixed(2)), b.x + Math.cos(k / 12 * Math.PI * 2) * r, b.y + Math.sin(k / 12 * Math.PI * 2) * r, 2, 2); }
  g.font = '7px "Press Start 2P", monospace';
  for (const p of ci.pops) { g.fillStyle = '#05010b'; g.fillText(p.text, p.x + 1, p.y + 1); g.fillStyle = '#ffd07a'; g.fillText(p.text, p.x, p.y); }
  if (ci.flash) { g.fillStyle = 'rgba(255,208,244,' + ci.flash / 50 + ')'; g.fillRect(0, 0, W, H); }
  if (ci.banner) gameText(g, W, [[ci.banner.text, '#ffd07a', 10]], 64);
  // the counter, and the merchant's bonus running
  px(g, 'rgba(11,3,28,.72)', 0, 0, W, 25); px(g, '#3a2a6e', 0, 25, W, 1);
  g.font = '8px "Press Start 2P", monospace'; g.fillStyle = '#ffd07a'; g.fillText(ciFmt(ciL(s.cr)) + ' ⌬', 8, 12);
  g.font = '6px "Press Start 2P", monospace'; g.fillStyle = '#d9c6ff'; g.fillText('+' + ciFmt(ciProd()) + ' / s', 8, 21);
  g.textAlign = 'right'; g.fillText(P.name.toUpperCase() + ' · COLONIE ' + (s.colonies + 1), W - 8, 12); if (ciL(s.mem) > -Infinity) g.fillText(ciFmt(ciMemFree()) + ' MÉMOIRES', W - 8, 21);
  if (ci.buffs.length) { g.textAlign = 'center'; g.fillStyle = '#8ee8a0'; g.fillText(ci.buffs.map(b => (b.k === 'cheap' ? 'PRIX −50 %' : (b.k === 'prod' ? 'PROD ×' : 'CLICS ×') + Math.round(10 ** b.m)) + ' ' + Math.ceil((b.until - t) / 60) + ' S').join('   '), W / 2, 16); }
  g.textAlign = 'left';
  if (ci.offer) {
    px(g, 'rgba(5,1,11,.6)', 0, 0, W, H); px(g, '#0d0620', 58, 58, 364, 156); px(g, '#2a1d52', 60, 60, 360, 152); px(g, '#e0b860', 60, 60, 360, 2);
    g.textAlign = 'center'; g.font = '8px "Press Start 2P", monospace'; g.fillStyle = '#ffd07a'; g.fillText('LE MARCHAND', W / 2, 78); g.font = '6px "Press Start 2P", monospace'; g.fillStyle = '#d9c6ff'; g.fillText('CHOISIS UN BONUS', W / 2, 90);
    ci.offer.forEach((o, k) => { const bx = 75 + k * 115; px(g, '#0d0620', bx - 1, 99, 102, 82); px(g, '#3a2a6e', bx, 100, 100, 80); px(g, '#ffd07a', bx, 100, 100, 1);
      o.l.forEach((l, n) => { g.fillStyle = n === 1 ? '#ffd07a' : '#ffffff'; g.font = (n === 1 ? 10 : 6) + 'px "Press Start 2P", monospace'; g.fillText(l, bx + 50, 124 + n * 20); }); });
    g.font = '6px "Press Start 2P", monospace'; g.fillStyle = '#8a84a8'; g.fillText('CLIC À CÔTÉ : NON MERCI', W / 2, 202); g.textAlign = 'left';
  }
}
/* ---------- page: tips, buildings, research, achievements, Mémoires ---------- */
function ciTip() {
  const s = ciSave(), tot = s.b.reduce((a, n) => a + (n || 0), 0);
  const T = [
    [s.clicks < 8, 'Clique sur la ville : chaque clic rapporte des crédits.'],
    [!s.b[0], 'Achète un Module d’habitat : il produit des crédits chaque seconde, même NeoDex fermé.'],
    [tot < 10, 'Continue d’acheter : tous les 25 exemplaires, un bâtiment produit deux fois plus. Chaque sorte a son quartier dans la ville.'],
    [!Object.keys(s.up).length && ciUps().some(u => u.cost <= ciL(s.cr)), 'Une recherche est prête : ouvre l’onglet Recherches.'],
    [!s.meteors, 'De temps en temps, une pluie de météores traverse le ciel : clique sur les météores.'],
    [!s.merch, 'Un marchand passe parfois dans un vaisseau doré : clique dessus pour choisir un bonus.'],
    [!s.ships, 'Les cargos jaunes rapportent 30 secondes de production quand tu cliques dessus.'],
    [ciMemGain() >= 0 && !s.colonies, 'Tu peux fonder une nouvelle colonie : tu gagnes des Mémoires à dépenser en avantages, sur une autre planète.'],
    [CI_PERKS.some(p => !(p.max && ciPerk(p.id) >= p.max) && ciPerkCost(p) <= ciMemFree()), 'Tu as des Mémoires à dépenser : onglet Mémoires.'],
  ];
  return (T.find(x => x[0]) || [0, 'La nuit, la ville s’allume. Chaque succès ajoute 3 % de production pour toujours.'])[1];
}
function ciIcon(i) {  // a small picture of a building (by day)
  const ic = el('canvas', 'ciIcon'); ic.width = 34; ic.height = 30; const g = ic.getContext('2d'), nf = NF; NF = 0;
  if (i >= 16) ciStation(g, 17, 15, CI.cols[((i - 16) * 5 + 2) % 16], 0); else ciPaint(g, i, 17 - (CI_W[i] >> 1), 28, Math.min(26, CI_H[i]), 0, i + 1);
  NF = nf; return ic;
}
function ciSprite(rows, pal) { const ic = el('canvas', 'ciIcon'); ic.width = 34; ic.height = 30; const g = ic.getContext('2d'); g.scale(2, 2); sprite(g, rows, (17 - rows[0].length) >> 1, (15 - rows.length) >> 1, pal); return ic; }
const CI_MEDAL = ['..aaaa..', '.abbbba.', 'abbccbba', 'abcbbcba', 'abcbbcba', 'abbccbba', '.abbbba.', '..aaaa..', '...dd...', '..d..d..'];
const CI_HAND = ['...aa....', '..abba...', '..abba...', '..abbaaa.', '.aabbbbba', 'abbbbbbba', 'abbbbbbba', '.abbbbba.', '..abbba..', '...aaa...'];
const CI_GEM = ['...aa...', '..abba..', '.abccba.', 'abccccba', 'abbccbba', '.abbbba.', '..abba..', '...aa...'];
function ciCard(c) {
  const row = el('div', 'ciRow px' + (c.off ? ' off' : '')), txt = el('div', 'ciTxt');
  row.style.setProperty('--c', c.col || '#ffd07a'); txt.append(el('b', '', c.name), el('small', '', c.small)); row.append(c.icon(), txt);
  if (c.btn) { const b = el('button', 'btn px ciBtn', c.btn); b.disabled = !c.on; b.onclick = () => { c.act(); b.blur(); }; row.append(b); }
  return row;
}
function ciCards(tab) {
  const s = ciSave(), cr = ciL(s.cr);
  if (tab === 'r') {
    const ups = ciUps().slice(0, 40);
    if (!ups.length) return [{icon: () => ciSprite(CI_GEM, {a: '#0d0620', b: '#6a6490', c: '#b46aee'}), name: 'Pas de recherche pour l’instant', small: 'Elles s’ouvrent à 10, 25, 50, 100, 200 et 400 exemplaires d’un bâtiment, et avec les clics.'}];
    return ups.map(u => ({icon: () => u.i < 0 ? ciSprite(CI_HAND, {a: '#0d0620', b: '#ffd07a'}) : ciIcon(u.i), name: u.name, small: u.text, btn: ciFmt(u.cost), on: u.cost <= cr + 1e-9, act: () => ciBuyUp(u), col: u.i < 0 ? '#ffd07a' : CI.cols[u.i % 16]}));
  }
  if (tab === 'a') return CI_ACH.map(([id, name]) => { const on = s.ach.includes(id); return {icon: () => ciSprite(CI_MEDAL, on ? {a: '#0d0620', b: '#e0b860', c: '#fff0b0', d: '#ff5ad9'} : {a: '#0d0620', b: '#3a2a6e', c: '#5a4a8e', d: '#3a2a6e'}), name, small: on ? 'obtenu · +3 % de production' : 'à obtenir', off: !on, col: on ? '#e0b860' : '#3a2a6e'}; });
  const free = ciMemFree(), mg = ciMemGain(), nx = ciPl(s.colonies + 1);
  return [
    {icon: () => ciSprite(CI_GEM, {a: '#0d0620', b: '#4f9fe0', c: '#bff4ff'}), name: 'Mémoires : ' + ciFmt(free), small: 'Chaque Mémoire gardée ajoute 10 % de production ; dépensée, elle achète un avantage pour toujours.', col: '#4f9fe0'},
    {icon: () => ciSprite(CI_GEM, {a: '#0d0620', b: '#e0b860', c: '#fff0b0'}), name: 'Nouvelle colonie : ' + nx.name, small: nx.text + ' · ' + (mg >= 0 ? 'tu gagnerais ' + ciFmt(mg) + ' Mémoires' : 'il faut avoir produit 1 billion de crédits dans cette colonie'), live: true, col: '#e0b860'},
    ...CI_PERKS.map(p => { const lv = ciPerk(p.id), full = p.max && lv >= p.max, c = ciPerkCost(p);
      return {icon: () => ciSprite(CI_GEM, {a: '#0d0620', b: '#b46aee', c: '#ffd0ff'}), name: p.name + ' · niveau ' + lv, small: p.text + (p.max ? ' (au plus ' + p.max + ')' : ''), btn: full ? 'MAX' : ciFmt(c) + ' MÉM.', on: !full && c <= free + 1e-9, act: () => ciBuyPerk(p), col: '#b46aee'}; }),
  ];
}
function ciUi(soft) {
  const s = ciSave(), list = $('ciList'), n = ciTiers(), k = s.buy, P = ciPl(), tot = s.b.reduce((a, x) => a + (x || 0), 0), tab = s.tab;
  $('ciInfo').textContent = ciFmt(ciL(s.cr)) + ' crédits · ' + ciFmt(ciProd()) + ' / s · ' + tot + ' bâtiments · ' + P.name + ', colonie ' + (s.colonies + 1);
  $('ciTip').textContent = ciTip();
  $('ciStats').textContent = 'Planète ' + P.name + ' : ' + P.text + '. Succès ' + s.ach.length + ' / ' + CI_ACH.length + ' (+' + s.ach.length * 3 + ' % de production). Clic : ' + ciFmt(ciClickL()) + ' crédits.';
  const mg = ciMemGain(); $('ciColony').textContent = mg >= 0 ? 'NOUVELLE COLONIE (+' + ciFmt(mg) + ' MÉM.)' : 'NOUVELLE COLONIE'; $('ciColony').disabled = mg < 0;
  const nUp = ciUps().filter(u => u.cost <= ciL(s.cr) + 1e-9).length;
  for (const b of $('ciTabs').querySelectorAll('[data-t]')) { b.classList.toggle('main', b.dataset.t === tab); b.textContent = {b: 'BÂTIMENTS', r: 'RECHERCHES' + (nUp ? ' (' + nUp + ')' : ''), a: 'SUCCÈS ' + s.ach.length + '/' + CI_ACH.length, m: 'MÉMOIRES'}[b.dataset.t]; }
  $('ciBuy').style.display = tab === 'b' ? '' : 'none';
  [...$('ciBuy').children].forEach(b => b.classList.toggle('main', b.dataset.k === String(k)));
  if (tab !== 'b') {
    const cards = ciCards(tab), sig = tab + JSON.stringify(cards.map(c => [c.name, c.live ? '' : c.small, c.btn, c.on]));
    if (!soft || list.dataset.sig !== sig) { list.dataset.sig = sig; list.replaceChildren(...cards.map(ciCard)); }
    cards.forEach((c, i) => { if (c.live) list.children[i].querySelector('small').textContent = c.small; });
    return;
  }
  if (!soft || list.dataset.sig !== 'b' + n) { list.dataset.sig = 'b' + n; list.replaceChildren(...Array.from({length: n}, (_, i) => {
    const row = el('div', 'ciRow px'), b = el('button', 'btn px ciBtn'); b.dataset.i = i;
    row.style.setProperty('--c', CI.cols[i % CI.cols.length]); row.append(ciIcon(i), el('div', 'ciTxt'), b);
    b.onclick = () => { ciBuy(i, s.buy === 'max' ? 'max' : s.buy); b.blur(); };
    return row;
  })); }
  [...list.children].forEach((row, i) => {
    const have = s.b[i] || 0, kk = k === 'max' ? Math.max(1, ciMaxBuy(i)) : k, c = ciCost(i, kk), next = 25 - have % 25;
    row.children[1].replaceChildren(el('b', '', ciName(i) + ' · ' + have), el('small', '', (have ? ciFmt(ciProdOf(i)) + ' / s' : 'chacun ' + ciFmt(ciProdOf(i, 1)) + ' / s') + ' · ×2 dans ' + next + (kk > 1 ? ' · achat ×' + kk.toLocaleString('fr-FR') : '')), (() => { const bar = el('div', 'ciBar'), f = el('i'); f.style.width = (have % 25) / 25 * 100 + '%'; bar.append(f); return bar; })());
    const btn = row.children[2]; btn.textContent = ciFmt(c); btn.disabled = c > ciL(s.cr) + 1e-9;
  });
}
$('ciBuy').onclick = e => { const k = e.target.dataset?.k; if (!k) return; ciSave().buy = k === 'max' ? 'max' : +k; ciUi(); e.target.blur(); };
$('ciTabs').addEventListener('click', e => { const t = e.target.dataset?.t; if (!t) return; ciSave().tab = t; ciUi(); e.target.blur(); });
$('ciColony').onclick = () => { ciColony(); $('ciColony').blur(); };
$('gFs').onclick = () => { $('ciCanvas').parentElement.requestFullscreen?.().catch(() => {}); };
$('ciCanvas').onpointerdown = e => {
  const cv = $('ciCanvas'), r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * CI.W / r.width, y = (e.clientY - r.top) * CI.H / r.height, s = ciSave();
  if (ci.offer) {
    const k = ci.offer.findIndex((o, n) => x >= 75 + n * 115 && x <= 175 + n * 115 && y >= 100 && y <= 180);
    if (k >= 0) ciPick(ci.offer[k]); else if (x < 60 || x > 420 || y < 60 || y > 212) { ci.offer = null; if (ci.merch) ci.merch.st = 'out'; }
    return;
  }
  const met = ci.meteors.find(m => Math.hypot(x - m.x, y - m.y) < 13);
  if (met) { met.hit = true; const got = LG.add(Math.log10(5), ciProd() + Math.log10(8)); ciGain(got); s.meteors++; ci.booms.push({x: met.x, y: met.y, t: 22}); ci.pops.push({text: '+' + ciFmt(got), x: Math.min(CI.W - 60, met.x), y: met.y, t: 40}); sfx('click'); ciUi(true); return; }
  const m = ci.merch;
  if (m && m.st !== 'out' && Math.abs(x - m.x) < 18 && y > m.y - 24 && y < m.y + 10) { const pool = [...CI_OFFERS].sort(() => Math.random() - .5); ci.offer = pool.slice(0, 3); s.merch++; sfx('notify'); return; }
  const ship = ci.ships.find(sh => sh.cargo && Math.abs(x - sh.x - 8) < 14 && Math.abs(y - sh.y - 2) < 10);
  const got = ship ? Math.max(1, ciProd() + Math.log10(30)) : ciClickL();
  ciGain(got); s.clicks++; if (ship) { ship.cargo = false; ship.v *= 3; s.ships++; sfx('notify'); }
  ci.pops.push({text: '+' + ciFmt(got), x: Math.min(CI.W - 60, x), y, t: 40}); ciUi(true);
};
{  // self-check of the big numbers, the prices and the lists
  const near = (a, b) => Math.abs(a - b) < 1e-9;
  const ok = near(LG.add(2, 2), 2 + Math.log10(2)) && LG.sub(2, 2) === -Infinity && near(LG.sub(3, 2), Math.log10(900)) && ciFmt(Math.log10(1234)) === (1234).toLocaleString('fr-FR')
    && ciFmt(9) === '1,00 milliard' && ciFmt(40.5).startsWith('3,16e40') && ciFmt(2e6).startsWith('e2,00 million') && ROMAN(14) === 'XIV'
    && near(ciCostRaw(0), 1) && near(Math.log10((1.15 ** 3 - 1) / .15), Math.log10(1 + 1.15 + 1.3225))
    && CI_ART.length === 16 && CI_W.length === 16 && CI_H.length === 16 && new Set(CI_ACH.map(a => a[0])).size === CI_ACH.length && CI_PL.every(p => p.sky.length === 5);
  console.assert(ok, 'astropole numbers'); view.dataset.selfcheck = ok ? 'ok' : 'astropole numbers';
}  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { ciOpen(); });
}
