/* The Tram Depot · data layer
   Everything that talks to Supabase lives here, so app.js only deals with plain objects.
   Security is enforced by the database rules; this file just asks nicely. */
(function () {
  'use strict';
  const cfg = window.DEPOT_CONFIG;
  let sb = null;
  const client = () => {
    if (!sb) {
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'tram-depot-auth' }
      });
    }
    return sb;
  };
  const photos = () => client().storage.from('photos');

  /* ---------- errors in plain English ---------- */
  function friendly(e) {
    const raw = (e && (e.message || e.error_description || e.msg)) || String(e || '');
    let msg;
    if (/member list/i.test(raw)) msg = raw;
    else if (/rate limit|security purposes|only request this|too many/i.test(raw)) msg = 'Too many attempts. Wait a minute, then try again.';
    else if (/token.*(expired|invalid)|otp.*(expired|invalid)|invalid.*(token|otp)/i.test(raw)) msg = "That code didn't work. Check it's from the latest email, or send a new code.";
    else if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) msg = "Couldn't reach the Depot. Check your internet connection and try again.";
    else if (/row-level security|permission denied|not authorized|jwt/i.test(raw)) msg = "You don't have permission to do that. Try signing out and in again.";
    else if (/payload too large|exceeded the maximum allowed size/i.test(raw)) msg = 'That photo is too large. Try a different one.';
    else if (/mime type|invalid_mime/i.test(raw)) msg = 'That file type is not supported. Use a JPG or PNG photo.';
    else if (raw.length && raw.length < 120 && !/violates|constraint|syntax|relation|column|null value/i.test(raw)) msg = raw;
    else msg = 'Something went wrong. Try again in a moment.';
    const err = new Error(msg);
    err.raw = raw;
    return err;
  }
  const check = ({ data, error }) => { if (error) throw friendly(error); return data; };
  async function run(promise) {
    try { return check(await promise); }
    catch (e) { if (e.raw !== undefined) throw e; throw friendly(e); }
  }

  /* ---------- shape conversion ---------- */
  const LISTING_SELECT =
    'id,seller_id,seller_name,section,category,type,price_type,price,title,description,event_at,spots,position,location,' +
    'status,sold_at,expires_at,created_at,' +
    'photos(id,path,thumb_path,position),' +
    'questions(id,asker_id,asker_name,body,answer,answered_at,hidden,created_at)';

  const toListing = (r) => ({
    id: r.id,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    section: r.section,
    category: r.category,
    type: r.type,
    priceType: r.price_type,
    price: r.price == null ? null : Number(r.price),
    title: r.title,
    desc: r.description,
    eventAt: r.event_at ? new Date(r.event_at) : null,
    spots: r.spots == null ? '' : String(r.spots),
    position: r.position || 'Any',
    where: r.location || '',
    status: r.status,
    soldAt: r.sold_at ? new Date(r.sold_at) : null,
    expires: new Date(r.expires_at),
    created: new Date(r.created_at),
    photos: (r.photos || []).slice().sort((a, b) => a.position - b.position)
      .map((p) => ({ id: p.id, path: p.path, thumb: p.thumb_path, position: p.position })),
    questions: (r.questions || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((q) => ({
        id: q.id, by: q.asker_id, byName: q.asker_name, text: q.body,
        at: new Date(q.created_at), answer: q.answer || '', answeredAt: q.answered_at ? new Date(q.answered_at) : null,
        hidden: !!q.hidden
      }))
  });

  const toMember = (m) => ({
    id: m.id, email: m.email, name: m.full_name, short: m.display_name, role: m.role, active: m.active
  });

  /* ---------- signed photo links (members-only bucket) ---------- */
  const urlCache = new Map();
  async function signUrls(paths) {
    const now = Date.now();
    const need = [...new Set(paths.filter(Boolean))].filter((p) => !(urlCache.get(p) && urlCache.get(p).exp > now));
    for (let i = 0; i < need.length; i += 100) {
      const chunk = need.slice(i, i + 100);
      const { data, error } = await photos().createSignedUrls(chunk, 3600);
      if (error) { console.warn('Photo links failed', error); continue; }
      (data || []).forEach((d) => { if (d && d.signedUrl && d.path) urlCache.set(d.path, { url: d.signedUrl, exp: now + 50 * 60e3 }); });
    }
    const out = {};
    paths.forEach((p) => { const c = urlCache.get(p); if (c) out[p] = c.url; });
    return out;
  }

  async function addPhotos(listingId, memberId, files, usedPositions) {
    const used = new Set(usedPositions || []);
    let pos = 0;
    for (const f of files) {
      while (used.has(pos)) pos++;
      if (pos > 3) break;
      const key = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      const base = memberId + '/' + listingId + '/' + key;
      await run(photos().upload(base + '.jpg', f.full, { contentType: 'image/jpeg', cacheControl: '86400', upsert: false }));
      await run(photos().upload(base + '_t.jpg', f.thumb, { contentType: 'image/jpeg', cacheControl: '86400', upsert: false }));
      await run(client().from('photos').insert({ listing_id: listingId, path: base + '.jpg', thumb_path: base + '_t.jpg', position: pos }));
      used.add(pos);
    }
  }

  async function updateOne(table, id, patch) {
    const rows = await run(client().from(table).update(patch).eq('id', id).select('id'));
    if (!rows || !rows.length) throw new Error("That couldn't be changed. It may have been removed, or you don't have permission.");
  }

  /* ---------- public interface ---------- */
  window.DepotDB = {
    async session() { const { data } = await client().auth.getSession(); return data.session; },
    onAuth(cb) { client().auth.onAuthStateChange((event, session) => cb(event, session)); },
    async sendCode(email) { await run(client().auth.signInWithOtp({ email, options: { shouldCreateUser: true } })); },
    async verifyCode(email, token) { await run(client().auth.verifyOtp({ email, token, type: 'email' })); },
    async signOut() { try { await client().auth.signOut(); } catch (e) { console.warn(e); } },

    async me() {
      const s = await this.session();
      if (!s || !s.user || !s.user.email) return null;
      const rows = await run(client().from('members').select('id,email,full_name,display_name,role,active')
        .eq('email', s.user.email.toLowerCase()).limit(1));
      return rows && rows[0] ? toMember(rows[0]) : { email: s.user.email.toLowerCase(), active: false, missing: true };
    },

    async listings() {
      const rows = await run(client().from('listings').select(LISTING_SELECT).order('created_at', { ascending: false }).limit(1000));
      return rows.map(toListing);
    },
    signUrls,

    async createListing(row, files, memberId) {
      const created = await run(client().from('listings').insert(row).select('id').single());
      if (files && files.length) await addPhotos(created.id, memberId, files, []);
      return created.id;
    },
    async updateListing(id, patch, opts) {
      opts = opts || {};
      if (patch && Object.keys(patch).length) await updateOne('listings', id, patch);
      if (opts.removePhotoIds && opts.removePhotoIds.length) {
        await run(client().from('photos').delete().in('id', opts.removePhotoIds));
      }
      if (opts.files && opts.files.length) await addPhotos(id, opts.memberId, opts.files, opts.keptPositions || []);
    },
    async setListing(id, patch) { await updateOne('listings', id, patch); },
    async deleteListing(id) {
      const rows = await run(client().from('listings').delete().eq('id', id).select('id'));
      if (!rows || !rows.length) throw new Error("That listing couldn't be deleted. It may already be gone.");
    },

    async ask(listingId, text) { await run(client().from('questions').insert({ listing_id: listingId, body: text })); },
    async answer(questionId, text) { await updateOne('questions', questionId, { answer: text }); },
    async hideQuestion(questionId, hidden) { await updateOne('questions', questionId, { hidden }); },
    async report(listingId, reason) { await run(client().from('reports').insert({ listing_id: listingId, reason })); },

    /* moderators only (the database refuses everyone else) */
    async reports() {
      const rows = await run(client().from('reports').select('id,listing_id,reason,created_at,members(full_name)')
        .is('resolved_at', null).order('created_at', { ascending: false }));
      return rows.map((r) => ({ id: r.id, listingId: r.listing_id, reason: r.reason, at: new Date(r.created_at), byName: r.members ? r.members.full_name : 'A member' }));
    },
    async dismissReports(listingId) {
      await run(client().from('reports').update({ resolved_at: new Date().toISOString() }).eq('listing_id', listingId).is('resolved_at', null));
    },
    async members() {
      const rows = await run(client().from('members').select('id,email,full_name,display_name,role,active').order('full_name'));
      return rows.map(toMember);
    },
    async addMember(name, email) {
      await run(client().from('members').insert({ full_name: name, email }));
    },
    async updateMember(id, patch) {
      const p = {};
      if ('active' in patch) p.active = patch.active;
      if ('name' in patch) p.full_name = patch.name;
      await updateOne('members', id, p);
    },
    async importMembers(rows, apply) {
      return await run(client().rpc('member_import', { p_rows: rows, p_apply: !!apply }));
    }
  };
})();
