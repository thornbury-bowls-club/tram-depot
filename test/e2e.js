const { chromium } = require('playwright');
const SP = process.argv[2] || '.';  // folder for screenshots and the test photo bowls.jpg
const URL = 'http://127.0.0.1:8765/test/index.html';
(async () => {
  const b = await chromium.launch();
  const errors = [];
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 } });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const step = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { console.log('FAIL', name, '-', e.message.split('\n')[0]); await pg.screenshot({ path: SP + '/shots/fail-' + name.replace(/\W+/g, '_') + '.png', fullPage: true }); } };
  const text = async () => pg.innerText('body');
  const expectText = async (t) => { await pg.waitForFunction((t) => document.body.innerText.includes(t), t, { timeout: 4000 }); };

  await pg.goto(URL); await pg.waitForSelector('#em');
  await pg.screenshot({ path: SP + '/shots/01-signin.png' });
  await step('stranger refused', async () => { await pg.fill('#em', 'who@nowhere.com'); await pg.click('form[data-f=email] button'); await expectText("isn't on the member list"); });
  await step('wrong code refused', async () => { await pg.fill('#em', 'alex@example.com'); await pg.click('form[data-f=email] button'); await pg.waitForSelector('#code'); await pg.fill('#code', '111111'); await pg.click('form[data-f=code] button'); await expectText("didn't work"); });
  await step('sign in alex', async () => { await pg.fill('#code', '123456'); await pg.click('form[data-f=code] button'); await expectText('MARKETPLACE'); });
  await pg.screenshot({ path: SP + '/shots/02-browse.png' });
  await step('sold shows ribbon, available count excludes it', async () => { await expectText('SOLD'); const t = await text(); if (!/\b3 available/.test(t)) throw new Error('count: ' + (t.match(/\d+ available/) || [])[0]); });
  await step('unanswered banner', async () => { await expectText('1 question on your listings needs an answer'); });
  await step('answer from My listings', async () => { await pg.click('.todo-banner'); await pg.waitForSelector('.todo input'); await pg.fill('.todo input', 'Yes, plenty left.'); await pg.click('.todo .btn.primary'); await expectText("all caught up"); });
  await step('search + sort', async () => { await pg.click('[data-a=home]'); await pg.fill('#q', 'hensel'); await expectText('Henselite'); const n = await pg.$$eval('.card', (c) => c.length); if (n !== 1) throw new Error('cards ' + n); await pg.fill('#q', ''); await pg.selectOption('#sort', 'high'); });
  await step('ask question on Jo listing', async () => { await pg.click('.card:has-text("Henselite")'); await pg.waitForSelector('#askq'); await pg.fill('#askq', 'Would you take $100?'); await pg.click('form[data-f=ask] button'); await expectText('Would you take $100?'); });
  await step('report listing', async () => { await pg.click('text=Report this listing'); await pg.fill('#rep', 'Test report'); await pg.click('form[data-f=report] button'); await expectText('A moderator will take a look'); });
  await step('new market post with photo', async () => {
    await pg.click('[data-a=home]'); await pg.click('.fab'); await pg.click('[data-s=market]');
    await pg.click('form[data-f=post] .btn.go'); await expectText('Add a title');
    await pg.fill('#f-title', 'Bowls measure set'); await pg.selectOption('#f-cat', 'bowls'); await pg.fill('#f-price', '15'); await pg.fill('#f-desc', 'Barely used.');
    await pg.setInputFiles('#f-photo', SP + '/bowls.jpg'); await pg.waitForSelector('.pslot img', { timeout: 8000 });
    await pg.selectOption('#f-exp', '365');
    await pg.click('form[data-f=post] .btn.go'); await expectText('Your listing is up'); await expectText('Bowls measure set');
    const src = await pg.getAttribute('.gallery .main img', 'src'); if (!src || !src.startsWith('blob:')) throw new Error('no photo shown');
  });
  await pg.screenshot({ path: SP + '/shots/03-detail-own.png', fullPage: true });
  await step('photo sizes', async () => { const m = await pg.evaluate(() => { const l = window.__mock.listings().find((x) => x.title === 'Bowls measure set'); return l.photos.length; }); if (m !== 1) throw new Error('photos ' + m); });
  await step('edit listing', async () => { await pg.click('text=Edit'); await pg.fill('#f-title', 'Bowls measure and chalk set'); await pg.click('form[data-f=post] .btn.go'); await expectText('Changes saved'); await expectText('Bowls measure and chalk set'); });
  await step('mark sold', async () => { await pg.click('[data-a=sold]'); await expectText('Marked as sold'); await expectText('This listing comes down on'); });
  await step('extend reactivates', async () => { await pg.click('.iconbtn[data-h="#mine"]'); await pg.click('.lrow:has-text("chalk set") [data-a=extend]'); await pg.click('[data-a=doextend]'); await expectText('Now showing until'); });
  await step('bowlers post', async () => {
    await pg.click('.btn.go[data-h="#new"]'); await pg.click('[data-s=bowlers]');
    const d = new Date(Date.now() + 4 * 864e5); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    await pg.fill('#f-title', 'Need 2 for triples'); await pg.selectOption('#f-cat', 'socialbowls'); await pg.fill('#f-date', ds); await pg.fill('#f-time', '17:30'); await pg.fill('#f-spots', '2'); await pg.fill('#f-desc', 'Friday twilight.');
    await pg.click('form[data-f=post] .btn.go'); await expectText('Your listing is up'); await expectText('5:30pm');
  });
  await step('bowlers tab list', async () => { await pg.click('[data-a=home]'); await pg.click('.tab[data-h="#bowlers"]'); await expectText('Need 2 for triples'); await expectText('Need 2'); });
  await pg.screenshot({ path: SP + '/shots/04-bowlers.png' });
  await step('delete listing', async () => { await pg.click('.ecard:has-text("triples")'); await pg.click('[data-a=askdel]'); await pg.click('[data-a=del]'); await expectText('Listing deleted'); });
  await step('deep link #listing works', async () => { const id = await pg.evaluate(() => window.__mock.listings().find((x) => x.title.startsWith('Henselite')).id); await pg.goto(URL + '#listing-' + id); await expectText('Grip or no grip?'); });
  await step('sign out', async () => { await pg.click('[data-a=signout]'); await pg.waitForSelector('#em'); });
  await step('sign in moderator', async () => { await pg.fill('#em', 'mod@example.com'); await pg.click('form[data-f=email] button'); await pg.fill('#code', '123456'); await pg.click('form[data-f=code] button'); await pg.waitForSelector('.iconbtn[data-h="#mod"]'); });
  await step('mod reports', async () => { await pg.click('.iconbtn[data-h="#mod"]'); await expectText('Reports (2)'); await expectText('Test report'); await pg.screenshot({ path: SP + '/shots/05-mod.png', fullPage: true }); await pg.click('.lrow:has-text("Esky") [data-a=hide]'); await expectText('Listing hidden'); await pg.click('.lrow:has-text("Esky") [data-a=dismiss]'); await expectText('Report dismissed'); await expectText('Reports (1)'); });
  await step('mod members add/remove', async () => { await pg.click('[data-t=members]'); await pg.fill('#nm-name', 'Chris Taylor'); await pg.fill('#nm-email', 'chris@example.com'); await pg.click('form[data-f=addmember] button'); await expectText('Chris Taylor added'); await pg.fill('#msearch', 'jo'); await pg.click('[data-a=askrmmember]'); await pg.click('[data-a=rmmember]'); await expectText('Jo Sutherland removed'); await pg.fill('#msearch', ''); });
  await step('mod csv preview/apply', async () => { await pg.fill('#csv', 'Name,Email\n"Taylor, Chris",chris@example.com\nAlex Morgan,alex@example.com\nNew Bowler,newb@example.com'); await pg.click('[data-a=previewcsv]'); await expectText('nothing changed yet'); await pg.click('[data-a=applycsv]'); await expectText('Member list updated.'); });
  await pg.screenshot({ path: SP + '/shots/06-members.png', fullPage: true });
  await step('mod hide question', async () => { const id = await pg.evaluate(() => window.__mock.listings().find((x) => x.title.startsWith('Henselite')).id); await pg.goto(URL + '#listing-' + id); await pg.click('[data-a=hideq] >> nth=0'); await expectText('Question hidden'); });
  await step('removed member blocked', async () => { await pg.click('[data-a=signout]'); await pg.fill('#em', 'jo@example.com'); await pg.click('form[data-f=email] button'); await expectText("isn't on the member list"); });
  await step('no horizontal scroll', async () => { const w = await pg.evaluate(() => document.documentElement.scrollWidth); if (w > 400) throw new Error('width ' + w); });
  // desktop look
  const p2 = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  p2.on('pageerror', (e) => errors.push('pageerror(desktop): ' + e.message));
  await p2.goto(URL); await p2.fill('#em', 'alex@example.com'); await p2.click('form[data-f=email] button'); await p2.fill('#code', '123456'); await p2.click('form[data-f=code] button');
  await p2.waitForSelector('.grid'); await p2.screenshot({ path: SP + '/shots/07-desktop.png' });
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})();
