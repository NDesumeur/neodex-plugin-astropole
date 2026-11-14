// lancé par le test « local » de NeoDex : vérification interne, clics, premier achat, la ville remplie de jour, au crépuscule et de nuit,
// une recherche, les succès, une pluie de météores, le marchand, une nouvelle colonie et un avantage des Mémoires, chaque planète, la mise en page et le plein écran
module.exports = async ({ pj, sleep }) => {
  const C = `document.getElementById('ciCanvas').__ci`;
  const shot = async name => { const dir = process.env.NEO_SHOTS; if (!dir) return; const d = await pj(`document.getElementById('ciCanvas').toDataURL()`); require('fs').writeFileSync(require('path').join(dir, 'astropole-' + name + '.png'), Buffer.from(d.split(',')[1], 'base64')); };
  const ptr = (x, y) => pj(`(() => { const cv = document.getElementById('ciCanvas'), r = cv.getBoundingClientRect(), k = r.width / 480; cv.dispatchEvent(new PointerEvent('pointerdown', {clientX: r.left + ${x} * k, clientY: r.top + ${y} * k, pointerId: 1, bubbles: true})); return 0; })()`);
  const S = expr => pj(`(() => { const s = ${C}.s(), c = ${C}.ci(); return ${expr}; })()`);
  const phase = async (p, name) => { await pj(`(${C}.ci().phase = ${p}, 0)`); await sleep(400); await shot(name); };
  const sc = await pj(`document.querySelector('[data-selfcheck]')?.dataset.selfcheck`); if (sc !== 'ok') throw new Error('vérification interne : ' + sc);
  await sleep(600); await phase(.25, 'debut');
  const cr0 = await S('s.cr'); for (let i = 0; i < 10; i++) await ptr(240, 150);
  if (!(await S('s.cr') > cr0)) throw new Error('les clics ne rapportent rien');
  await pj(`document.querySelector('#ciList .ciBtn').click(), 0`);
  if (!(await S('s.b[0]') >= 1)) throw new Error('le premier bâtiment ne s’achète pas');
  await pj(`(${C}.fill(), 0)`); await sleep(300);
  await phase(.25, 'jour'); await phase(.48, 'crepuscule'); await phase(.75, 'nuit');
  await pj(`(${C}.ach(), 0)`); const ach = await S('s.ach.length'); if (ach < 10) throw new Error('succès : ' + ach);
  await pj(`(document.querySelector('[data-t="r"]').click(), 0)`); await sleep(200);
  await pj(`([...document.querySelectorAll('#ciList .ciBtn')].find(b => !b.disabled)?.click(), 0)`);
  const ups = await S('Object.keys(s.up).length'); if (ups < 1) throw new Error('aucune recherche achetée');
  await pj(`(${C}.shower(), 0)`);
  let met = 0; for (let k = 0; k < 40 && !met; k++) { await sleep(150); met = await pj(`(() => { const c = ${C}.ci(), m = c.meteors.find(m => m.y > 40 && m.x > 20 && m.x < 460); if (!m) return 0; const cv = document.getElementById('ciCanvas'), r = cv.getBoundingClientRect(), q = r.width / 480; cv.dispatchEvent(new PointerEvent('pointerdown', {clientX: r.left + m.x * q, clientY: r.top + m.y * q, pointerId: 1, bubbles: true})); return 1; })()`); if (k === 10) await shot('meteores'); }
  if (await S('s.meteors') < 1) throw new Error('aucun météore attrapé');
  await pj(`(${C}.ci().shower = 0, ${C}.ci().meteors = [], ${C}.merch(), 0)`); await sleep(200); await ptr(380, 58); await sleep(200);
  if (await S('c.offer?.length') !== 3) throw new Error('le marchand ne propose rien');
  await shot('marchand'); await ptr(125, 140); await sleep(200);
  if (await S('c.offer') !== null || await S('s.merch') !== 1) throw new Error('le choix du marchand ne marche pas');
  await pj(`(${C}.s().run = 16, ${C}.colony(), 0)`); await sleep(300);
  const col = await S('[s.colonies, s.b.length, ' + C + '.s().mem]'); if (col[0] !== 1 || col[1] !== 0 || !(col[2] >= 2)) throw new Error('nouvelle colonie : ' + JSON.stringify(col));
  await pj(`(document.querySelector('[data-t="m"]').click(), 0)`); await sleep(200);
  await pj(`([...document.querySelectorAll('#ciList .ciBtn')].find(b => !b.disabled)?.click(), 0)`);
  const perk = await S('Object.values(s.perk).reduce((a, b) => a + b, 0)'); if (perk < 1) throw new Error('aucun avantage acheté');
  for (const [k, name] of [[1, 'cryos'], [2, 'pyra'], [3, 'sylve'], [4, 'aurore'], [5, 'nebula']]) { await pj(`(${C}.s().colonies = ${k}, ${C}.fill(), 0)`); await phase(k % 2 ? .3 : .8, name); }
  const lay = await pj(`(() => { const c = document.getElementById('ciCanvas').getBoundingClientRect(), s = document.querySelector('.gSide').getBoundingClientRect(); return { beside: s.left >= c.right - 1, fits: document.documentElement.scrollWidth <= innerWidth + 1, w: innerWidth }; })()`);
  if (!lay.fits || (lay.w >= 700 && !lay.beside)) throw new Error('mise en page : ' + JSON.stringify(lay));
  await pj(`document.getElementById('gFs').click(), 0`); await sleep(700);
  const fs = await pj(`(() => { const c = document.getElementById('ciCanvas'); return document.fullscreenElement === c.parentElement && Math.abs(c.getBoundingClientRect().height - innerHeight) < 3; })()`);
  await pj(`document.fullscreenElement && document.exitFullscreen(), 0`); await sleep(300);
  if (!fs) throw new Error('le plein écran ne remplit pas la hauteur');
  return ach + ' succès · ' + ups + ' recherche · météore et marchand · colonie 2 et ' + perk + ' avantage · fenêtre ' + lay.w + ' px';
};
