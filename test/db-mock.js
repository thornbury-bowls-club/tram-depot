/* Test stand-in for site/db.js. Same interface, in-memory data, simple permission rules.
   Used only by test/index.html for local testing; never deployed. */
(function () {
  const DAY = 864e5, now = () => Date.now();
  const uid = () => Math.random().toString(16).slice(2, 10) + '-' + Math.random().toString(16).slice(2, 6);
  const short = (n) => { const p = n.trim().split(/\s+/); return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0].toUpperCase() + '.' : p[0]; };
  const members = [
    { id: 'm-mod', email: 'mod@example.com', name: 'Depot Moderator', role: 'moderator', active: true },
    { id: 'm-alex', email: 'alex@example.com', name: 'Alex Morgan', role: 'member', active: true },
    { id: 'm-jo', email: 'jo@example.com', name: 'Jo Sutherland', role: 'member', active: true },
    { id: 'm-gone', email: 'gone@example.com', name: 'Gone Person', role: 'member', active: false }
  ];
  members.forEach((m) => { m.short = short(m.name); });
  const byId = (id) => members.find((m) => m.id === id);
  let listings = [], reports = [];
  const blobs = {};
  const L = (o) => { const l = Object.assign({ id: uid(), type: 'sale', price_type: null, price: null, event_at: null, spots: null, position: null, location: null, status: 'active', sold_at: null, created_at: new Date(now() - DAY).toISOString(), photos: [], questions: [] }, o); l.seller_name = byId(l.seller_id).short; listings.push(l); return l; };
  L({ seller_id: 'm-jo', section: 'market', category: 'bowls', title: 'Henselite bowls, size 3', description: 'Set of four, light wear.', price_type: 'amount', price: 120, expires_at: new Date(now() + 20 * DAY).toISOString(),
      questions: [{ id: uid(), asker_id: 'm-alex', asker_name: 'Alex M.', body: 'Grip or no grip?', answer: null, answered_at: null, hidden: false, created_at: new Date(now() - 3600e3).toISOString() }] });
  L({ seller_id: 'm-alex', section: 'market', category: 'food', title: 'Lemon marmalade', description: 'Ten jars.', price_type: 'free', expires_at: new Date(now() + 2 * DAY).toISOString(),
      questions: [{ id: uid(), asker_id: 'm-jo', asker_name: 'Jo S.', body: 'Still got some?', answer: null, answered_at: null, hidden: false, created_at: new Date(now() - 7200e3).toISOString() }] });
  L({ seller_id: 'm-jo', section: 'bowlers', category: 'tournament', title: 'Skip wanted, Darebin Fours', description: 'Entry paid.', event_at: new Date(now() + 9 * DAY).toISOString(), expires_at: new Date(now() + 10 * DAY).toISOString(), spots: 1, position: 'Skip' });
  L({ seller_id: 'm-jo', section: 'market', category: 'furniture', title: 'Old chairs (sold)', description: 'Gone.', price_type: 'amount', price: 30, status: 'sold', sold_at: new Date(now() - DAY).toISOString(), expires_at: new Date(now() + 9 * DAY).toISOString() });
  const rep = L({ seller_id: 'm-jo', section: 'market', category: 'other', title: 'Esky', description: 'Free esky.', price_type: 'free', expires_at: new Date(now() + 5 * DAY).toISOString() });
  reports.push({ id: uid(), listing_id: rep.id, reporter_id: 'm-alex', reason: 'Already gone', created_at: new Date().toISOString(), resolved_at: null });

  let session = null;
  try { session = JSON.parse(localStorage.getItem('mock-session')); } catch (e) {}
  const me = () => session && members.find((m) => m.email === session.email && m.active);
  const isMod = () => !!(me() && me().role === 'moderator');
  const need = () => { if (!me()) throw new Error("You don't have permission to do that. Try signing out and in again."); };
  const visibleTo = (l) => { const m = me(); if (!m) return false; if (l.seller_id === m.id || m.role === 'moderator') return true; if (l.status === 'active' && new Date(l.expires_at) > now()) return true; return l.status === 'sold' && new Date(l.sold_at) > now() - 3 * DAY; };
  const toL = (r) => ({ id: r.id, sellerId: r.seller_id, sellerName: r.seller_name, section: r.section, category: r.category, type: r.type, priceType: r.price_type, price: r.price, title: r.title, desc: r.description, eventAt: r.event_at ? new Date(r.event_at) : null, spots: r.spots == null ? '' : String(r.spots), position: r.position || 'Any', where: r.location || '', status: r.status, soldAt: r.sold_at ? new Date(r.sold_at) : null, expires: new Date(r.expires_at), created: new Date(r.created_at),
    photos: r.photos.slice().sort((a, b) => a.position - b.position).map((p) => ({ id: p.id, path: p.path, thumb: p.thumb_path, position: p.position })),
    questions: r.questions.filter((q) => !q.hidden || isMod() || r.seller_id === me().id).map((q) => ({ id: q.id, by: q.asker_id, byName: q.asker_name, text: q.body, at: new Date(q.created_at), answer: q.answer || '', answeredAt: null, hidden: q.hidden })) });
  const delay = () => new Promise((r) => setTimeout(r, 30));
  const own = (id) => { const l = listings.find((x) => x.id === id); if (!l || !(l.seller_id === me().id || isMod())) throw new Error("That couldn't be changed. It may have been removed, or you don't have permission."); return l; };
  const applyTrigger = (l, patch) => {
    if ('status' in patch) { if (!isMod() && (patch.status === 'hidden') !== (l.status === 'hidden')) throw new Error('Only a moderator can hide or restore a listing.'); }
    Object.assign(l, patch);
    if (l.status === 'sold' && !l.sold_at) l.sold_at = new Date().toISOString();
    if (l.status !== 'sold') l.sold_at = null;
    if (l.section !== 'market' && l.event_at) { const d = new Date(l.event_at); d.setDate(d.getDate() + 2); d.setHours(0, 0, 0, 0); l.expires_at = d.toISOString(); }
    if (l.section === 'market' && new Date(l.expires_at) > now() + 366 * DAY) throw new Error('A listing can run for at most 12 months.');
  };
  window.__mock = { members, listings: () => listings, reports: () => reports, emails: [] };

  window.DepotDB = {
    async session() { return session; },
    onAuth() {},
    async sendCode(email) { await delay(); const m = members.find((x) => x.email === email && x.active); if (!m) throw new Error("That email isn't on the member list. Check the spelling, or ask the club to update your details."); window.__mock.emails.push(email); },
    async verifyCode(email, token) { await delay(); if (token !== '123456') throw new Error("That code didn't work. Check it's from the latest email, or send a new code."); session = { email }; localStorage.setItem('mock-session', JSON.stringify(session)); },
    async signOut() { session = null; localStorage.removeItem('mock-session'); },
    async me() { if (!session) return null; const m = members.find((x) => x.email === session.email); return m ? Object.assign({}, m) : { email: session.email, active: false }; },
    async listings() { await delay(); need(); return listings.filter(visibleTo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(toL); },
    async signUrls(paths) { const o = {}; paths.forEach((p) => { if (blobs[p]) o[p] = blobs[p]; }); return o; },
    async createListing(row, files) {
      await delay(); need();
      const l = { id: uid(), seller_id: me().id, seller_name: me().short, status: 'active', sold_at: null, created_at: new Date().toISOString(), photos: [], questions: [], type: 'sale', price_type: null, price: null, event_at: null, spots: null, position: null, location: null, expires_at: row.expires_at };
      applyTrigger(l, row); listings.push(l);
      (files || []).slice(0, 4).forEach((f, i) => { const p = me().id + '/' + l.id + '/' + uid(); blobs[p + '.jpg'] = URL.createObjectURL(f.full); blobs[p + '_t.jpg'] = URL.createObjectURL(f.thumb); l.photos.push({ id: uid(), path: p + '.jpg', thumb_path: p + '_t.jpg', position: i }); });
      return l.id;
    },
    async updateListing(id, patch, opts) {
      await delay(); const l = own(id); const p = Object.assign({}, patch); delete p.section; applyTrigger(l, p);
      opts = opts || {};
      l.photos = l.photos.filter((x) => !(opts.removePhotoIds || []).includes(x.id));
      const used = new Set(opts.keptPositions || []); let pos = 0;
      (opts.files || []).forEach((f) => { while (used.has(pos)) pos++; if (pos > 3) return; const pth = me().id + '/' + l.id + '/' + uid(); blobs[pth + '.jpg'] = URL.createObjectURL(f.full); blobs[pth + '_t.jpg'] = URL.createObjectURL(f.thumb); l.photos.push({ id: uid(), path: pth + '.jpg', thumb_path: pth + '_t.jpg', position: pos }); used.add(pos); });
    },
    async setListing(id, patch) { await delay(); applyTrigger(own(id), patch); },
    async deleteListing(id) { await delay(); own(id); listings = listings.filter((x) => x.id !== id); },
    async ask(listingId, text) { await delay(); need(); const l = listings.find((x) => x.id === listingId); if (!l || l.seller_id === me().id || l.status !== 'active') throw new Error("You don't have permission to do that. Try signing out and in again."); l.questions.push({ id: uid(), asker_id: me().id, asker_name: me().short, body: text, answer: null, hidden: false, created_at: new Date().toISOString() }); window.__mock.emails.push('question:' + l.seller_id); },
    async answer(qid, text) { await delay(); const l = listings.find((x) => x.questions.some((q) => q.id === qid)); if (!l || l.seller_id !== me().id) throw new Error("That couldn't be changed. It may have been removed, or you don't have permission."); l.questions.find((q) => q.id === qid).answer = text; },
    async hideQuestion(qid, hidden) { await delay(); if (!isMod()) throw new Error('no'); listings.forEach((l) => l.questions.forEach((q) => { if (q.id === qid) q.hidden = hidden; })); },
    async report(listingId, reason) { await delay(); need(); reports.push({ id: uid(), listing_id: listingId, reporter_id: me().id, reason, created_at: new Date().toISOString(), resolved_at: null }); },
    async reports() { if (!isMod()) throw new Error("You don't have permission to do that."); return reports.filter((r) => !r.resolved_at).map((r) => ({ id: r.id, listingId: r.listing_id, reason: r.reason, at: new Date(r.created_at), byName: byId(r.reporter_id).name })); },
    async dismissReports(listingId) { reports.forEach((r) => { if (r.listing_id === listingId) r.resolved_at = new Date().toISOString(); }); },
    async members() { if (!isMod()) throw new Error("You don't have permission to do that."); return members.map((m) => Object.assign({}, m)); },
    async addMember(name, email) { if (!isMod()) throw new Error('no'); members.push({ id: uid(), email, name, short: short(name), role: 'member', active: true }); },
    async updateMember(id, patch) { if (!isMod()) throw new Error('no'); const m = byId(id); if ('active' in patch) m.active = patch.active; if ('name' in patch) { m.name = patch.name; m.short = short(m.name); } },
    async importMembers(rows, apply) {
      if (!isMod()) throw new Error('Only a moderator can update the member list.');
      const emails = new Set(rows.map((r) => r.email));
      const res = { valid_rows: rows.length, skipped_rows: 0, new: rows.filter((r) => !members.some((m) => m.email === r.email)).length, restored: rows.filter((r) => members.some((m) => m.email === r.email && !m.active)).length, renamed: 0,
        removed: members.filter((m) => m.active && m.role !== 'moderator' && !emails.has(m.email)).length, removed_names: members.filter((m) => m.active && m.role !== 'moderator' && !emails.has(m.email)).map((m) => m.name), applied: !!apply };
      if (apply) { rows.forEach((r) => { const m = members.find((x) => x.email === r.email); if (m) { m.active = true; m.name = r.name; } else members.push({ id: uid(), email: r.email, name: r.name, short: short(r.name), role: 'member', active: true }); }); members.forEach((m) => { if (m.role !== 'moderator' && !emails.has(m.email)) m.active = false; }); }
      return res;
    }
  };
})();
