// lancé par le test « local » de NeoDex : vérification interne, clics, premier achat, la ville remplie de jour, au crépuscule et de nuit,
// le zoom sur un quartier et ses événements (vaisseau, fête), une recherche, une doctrine, le marchand, une colonie et un avantage,
// un défi, la singularité et une loi, l'exode et un système de la galaxie, la notation, le graphique, le rapport d'absence, la mise en page
module.exports = async ({ pj, sleep }) => {
  const C = `document.getElementById('apCv').__ap`;
  const shot = async name => { const dir = process.env.NEO_SHOTS; if (!dir) return; const d = await pj(`document.getElementById('apCv').toDataURL()`); require('fs').writeFileSync(require('path').join(dir, 'astropole-' + name + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  const ptr = (x, y, type = 'pointerdown') => pj(`(() => { const cv = document.getElementById('apCv'), r = cv.getBoundingClientRect(), k = r.width / 640; cv.dispatchEvent(new ${type === 'dblclick' ? 'MouseEvent' : 'PointerEvent'}('${type}', {clientX: r.left + ${x} * k, clientY: r.top + ${y} * k, pointerId: 1, button: 0, bubbles: true})); return 0; })()`);
  const S = expr => pj(`(() => { const a = ${C}, s = a.s(), f = a.fx(); return ${expr}; })()`);
  const run = expr => pj(`(() => { const a = ${C}, s = a.s(), f = a.fx(); ${expr}; a.ui(); return 0; })()`);
  const phase = async (p, name) => { await run(`f.phase = ${p}`); await sleep(400); await shot(name); };
  const tab = async t => { await pj(`([...document.querySelectorAll('#apTabs .btn')].find(b => b.textContent.startsWith(${JSON.stringify(t)}))?.click(), 0)`); await sleep(150); };
  const clickFirst = () => pj(`([...document.querySelectorAll('#apList .apBtn')].find(b => !b.disabled)?.click(), 0)`);
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  await sleep(600); await run(`document.getElementById('apAway').classList.remove('on')`); await phase(.25, 'debut');
  const cr0 = await S('s.cr'); for (let i = 0; i < 10; i++) await ptr(320, 200);
  if (!(await S('s.cr') > cr0)) throw new Error('les clics ne rapportent rien');
  await pj(`document.querySelector('#apList .apBtn').click(), 0`); await sleep(100);
  if (!(await S('s.b[0]') >= 1)) throw new Error('le premier bâtiment ne s’achète pas');
  await run(`a.fill()`); await sleep(300);
  await phase(.25, 'jour'); await phase(.48, 'crepuscule'); await phase(.75, 'nuit'); await run(`f.phase = .3`);
  // le zoom : un vaisseau arrive dans le quartier 3, on clique sa bulle, puis le vaisseau posé
  await run(`f.events = []; f.nextEvent = 1e12; a.event('ship', 3)`); await sleep(200);
  await ptr(3 * 80 + 40, 300 - 64); await sleep(1500);
  if (await S('f.zoom') !== 3) throw new Error('la bulle ne zoome pas sur le quartier');
  for (let k = 0; k < 40 && await S(`f.events[0]?.st`) !== 'wait'; k++) await sleep(150);
  await shot('zoom');
  const xy = await S(`(() => { const e = f.events[0], cx = Math.max(0, Math.min(320, 280 - 160)), cy = Math.max(0, Math.min(180, 300 - 180 * .62)); return [(280 - cx) * 2, (e.y - cy) * 2]; })()`);
  await ptr(xy[0], xy[1]); await sleep(150);
  if (await S('s.landings') !== 1) throw new Error('le vaisseau du quartier ne se clique pas : ' + JSON.stringify(xy));
  await run(`a.event('fete', 3)`); await sleep(100); await ptr(320, 250); await sleep(150);
  if (await S('s.parties') !== 1) throw new Error('la fête ne se rejoint pas');
  await shot('fete'); await ptr(40, 46); await sleep(1200);
  if (await S('f.zoom') !== null) throw new Error('le bouton Ville ne dézoome pas');
  await run(`a.ach()`); const ach = await S('s.ach.length'); if (ach < 10) throw new Error('succès : ' + ach);
  await tab('RECHERCHES'); await clickFirst(); await sleep(100);
  if (await S('Object.keys(s.up).length') < 1) throw new Error('aucune recherche achetée');
  await run(`s.run = 30; s.cr = 30`); await tab('DOCTRINE'); await clickFirst(); await sleep(100); await clickFirst(); await sleep(100);
  if (!(await S('s.branch.length === 1 && Object.keys(s.br).length === 1'))) throw new Error('doctrine : ' + JSON.stringify(await S('[s.branch, s.br]')));
  await run(`f.merch = null; a.merch()`); await sleep(200); await ptr(520, 64); await sleep(200);
  const nOff = await S('f.offer?.length'); if (nOff !== 3) throw new Error('le marchand ne propose rien : ' + nOff);
  await shot('marchand');
  const box = await S('f.offer[0].box'); await ptr(box[0] + 20, box[1] + 30); await sleep(200);
  if (await S('f.offer') !== null || await S('s.merch') !== 1) throw new Error('le choix du marchand ne marche pas');
  await run(`s.run = 16; a.colony()`); await sleep(200);
  const col = await S('[s.colonies, s.b.length, s.mem, s.branch.length]'); if (col[0] !== 1 || col[1] !== 0 || !(col[2] >= 2) || col[3] !== 0) throw new Error('nouvelle colonie : ' + JSON.stringify(col));
  await tab('COLONIE'); await pj(`([...document.querySelectorAll('#apList .apBtn')].slice(1).find(b => !b.disabled)?.click(), 0)`); await sleep(100);
  if (await S('Object.values(s.perk).reduce((a, b) => a + b, 0)') < 1) throw new Error('aucun avantage acheté');
  // un défi : Panne de clics, gagné en atteignant le but
  await run(`s.colonies = 5; a.startChallenge(1)`); await sleep(100);
  const g1 = await S('[s.ch, s.cr]'); await ptr(320, 200); if (g1[0] !== 1 || await S('s.cr') !== g1[1]) throw new Error('le défi Panne de clics laisse cliquer');
  await run(`s.run = 30`); await sleep(1300);
  if (!(await S('s.chDone[1] && !s.ch'))) throw new Error('le défi ne se gagne pas');
  // la singularité, une loi, la matière noire, les automates
  await run(`s.sAll = 60`); await tab('SINGULARITÉ'); await shot('avant-singularite');
  await run(`a.sing()`); const sg = await S('[s.sing, s.sings, s.colonies, s.mem, Object.keys(s.perk).length]');
  if (!(sg[0] >= 2 && sg[1] === 1 && sg[2] === 0 && sg[3] == null && sg[4] === 0)) throw new Error('singularité : ' + JSON.stringify(sg));
  await run(`a.buyLaw('auto')`); if (!(await S('s.laws.auto'))) throw new Error('la loi Automates ne s’achète pas');
  await run(`a.tickTime(100)`); if (!(await S('s.dm > -1'))) throw new Error('pas de matière noire');
  await run(`s.cr = 20`); await sleep(1300); if (!(await S('s.b[0] > 0'))) throw new Error('les automates n’achètent rien');
  // l'exode et un système de la galaxie
  await run(`s.singAll = 120; a.gal()`); const gx = await S('[s.stars, s.sing, s.dm]'); if (!(gx[0] >= 2 && gx[1] === 0 && gx[2] == null)) throw new Error('exode : ' + JSON.stringify(gx));
  await tab('GALAXIE'); const ni = await S('a.GAL.findIndex((p, i) => i && p.n.includes(0))');
  await run(`f.galSel = ${ni}`); await sleep(100); await pj(`([...document.querySelectorAll('#apBar .btn')].find(b => !b.disabled)?.click(), 0)`); await sleep(100);
  if (await S('s.sys.length') !== 2) throw new Error('aucun système conquis');
  if (process.env.NEO_SHOTS) { const d = await pj(`document.getElementById('apGalCv').toDataURL()`); require('fs').writeFileSync(require('path').join(process.env.NEO_SHOTS, 'astropole-galaxie.png'), Buffer.from(d.split(',')[1], 'base64')); }
  // la notation et le graphique
  await tab('STATISTIQUES'); await run(`s.hist.push([Date.now() - 3600000, 4], [Date.now() - 1800000, 6]); s.marks.push([Date.now() - 2000000, 'c']); a.graph()`);
  await pj(`([...document.querySelectorAll('#apBar .btn')].find(b => /^(Scientifique|Scientific)/.test(b.textContent))?.click(), 0)`); await sleep(100);
  if (await S('s.opt.fmt') !== 'sci') throw new Error('la notation ne change pas');
  if (process.env.NEO_SHOTS) { const d = await pj(`document.getElementById('apGraph').toDataURL()`); require('fs').writeFileSync(require('path').join(process.env.NEO_SHOTS, 'astropole-graphique.png'), Buffer.from(d.split(',')[1], 'base64')); }
  await run(`s.opt.fmt = 'fr'`);
  // le rapport d'absence et un choix
  await run(`a.welcome(7200, a.tickTime(7200, true))`); await sleep(150);
  const aw = await pj(`(() => { const b = document.getElementById('apAway'); return b.classList.contains('on') && b.querySelectorAll('.apChoice button').length >= 3; })()`);
  if (!aw) throw new Error('pas de rapport d’absence');
  const spill = await pj(`[...document.querySelectorAll('#apAway .apChoice button')].filter(b => b.scrollHeight > b.clientHeight + 1 || [...b.children].some(c => c.getBoundingClientRect().bottom > b.getBoundingClientRect().bottom + 1)).map(b => b.textContent.slice(0, 20)).join(', ')`);
  if (spill) throw new Error('texte qui dépasse des boutons d’absence : ' + spill);
  await pj(`document.querySelectorAll('#apAway .apChoice button')[2].click(), 0`); await sleep(100);
  if (!(await S('f.buffs.some(b => b.k === "prod")')) || await pj(`document.getElementById('apAway').classList.contains('on')`)) throw new Error('le choix « fête de retour » ne marche pas');
  // une partie de la 1.4.1 continue telle quelle
  const old = await S(`(() => { const o = {cr: 20, run: 20, all: 25, b: [50, 30, 10], mem: 3, memSpent: 1, colonies: 2, last: Date.now() - 1000, clicks: 40, ships: 2, buy: 'max', up: {'b0.0': 1}, ach: ['n10'], perk: {prod: 1}, meteors: 3, merch: 1, tab: 'm'}; const n = a.load(o); a.ui(); return [n.v, n.sAll, n.tab, n.b.join(), n.colonies, n.perk.prod, n.up['b0.0'], n.sing, a.prod() > 0, document.querySelectorAll('#apList .apCard').length]; })()`);
  if (JSON.stringify(old) !== JSON.stringify([2, 25, 'b', '50,30,10', 2, 1, 1, 0, true, 4])) throw new Error('ancienne partie : ' + JSON.stringify(old));
  for (const [k, name] of [[1, 'cryos'], [2, 'pyra'], [3, 'sylve'], [4, 'aurore'], [5, 'nebula']]) { await run(`s.colonies = ${k}; a.fill()`); await phase(k % 2 ? .3 : .8, name); }
  const lay = await pj(`(() => { const c = document.getElementById('apCv').getBoundingClientRect(), s = document.querySelector('.apSide').getBoundingClientRect(); return { beside: s.left >= c.right - 1, fits: document.documentElement.scrollWidth <= innerWidth + 1, w: innerWidth }; })()`);
  if (!lay.fits || (lay.w >= 800 && !lay.beside)) throw new Error('mise en page : ' + JSON.stringify(lay));
  await pj(`document.getElementById('apFs').click(), 0`); await sleep(700);
  const fs = await pj(`(() => { const c = document.getElementById('apCv'); return document.fullscreenElement === c.parentElement && Math.abs(c.getBoundingClientRect().height - innerHeight) < 3; })()`);
  await pj(`document.fullscreenElement && document.exitFullscreen(), 0`); await sleep(300);
  if (!fs) throw new Error('le plein écran ne remplit pas la hauteur');
  { // la zone de jeu tient dans la fenêtre, quelle que soit sa taille
    const L = await pj(`(() => { const c = document.getElementById('apCv'), r = c.getBoundingClientRect(); let s = 0; for (let e = c.parentElement; e; e = e.parentElement) s += e.scrollTop; return { top: Math.round(r.top + s), bottom: Math.round(r.bottom + s), h: Math.round(r.height), w: Math.round(r.width), wh: innerHeight, ww: innerWidth, sw: document.documentElement.scrollWidth }; })()`);
    if (process.env.NEO_FIT_LOG) console.log('FIT', JSON.stringify(L));
    if (L.bottom > L.wh + 1 || L.sw > L.ww + 1) throw new Error('la zone de jeu dépasse la fenêtre : ' + JSON.stringify(L));
  }
  return ach + ' succès · zoom, vaisseau et fête · doctrine · colonie et avantage · défi · singularité, loi et matière noire · exode et système · absence · fenêtre ' + lay.w + ' px';
};
