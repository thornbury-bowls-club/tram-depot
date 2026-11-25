/* Guest register viewer for Tram Depot moderators.
   Sign in with the same emailed 6-digit code as The Tram Depot. The database only returns
   rows to moderators, so this page shows nothing to anyone else. */
(function () {
  'use strict';
  var cfg = window.GUEST_CONFIG;
  var app = document.getElementById('app');
  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'tbc-guest-register' }
  });
  var TZ = 'Australia/Melbourne';
  var S = { step: 'email', email: '', err: '', rows: [], from: '', to: '', confirm: null, loading: false, msg: '' };

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ymd = function (d) { return d.toLocaleDateString('en-CA', { timeZone: TZ }); };            // 2026-11-25
  var today = function () { return ymd(new Date()); };
  var addDays = function (s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  var dayLabel = function (s) { return new Date(s + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); };
  var timeLabel = function (iso) { return new Date(iso).toLocaleTimeString('en-AU', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }); };

  function render(html) { app.innerHTML = html; }

  /* ---------- Sign in ---------- */
  function signInView() {
    var codeStep = S.step === 'code';
    render('<div class="stack narrow">' +
      '<form class="panel stack" id="signin" novalidate>' +
      (codeStep
        ? '<h1>Check your email</h1><p class="lead">We sent a 6-digit code to <b>' + esc(S.email) + '</b>. It works for 10 minutes.</p>' +
          '<div class="field"><label for="code">6-digit code</label><input type="text" id="code" class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"></div>'
        : '<h1>Moderator sign-in</h1><p class="lead">Use the email you use for The Tram Depot. Only Tram Depot moderators can see the register.</p>' +
          '<div class="field"><label for="em">Email</label><input type="email" id="em" autocomplete="email" value="' + esc(S.email) + '"></div>') +
      (S.err ? '<p class="alert" role="alert">' + esc(S.err) + '</p>' : '') +
      '<button class="btn primary">' + (codeStep ? 'Sign in' : 'Send code') + '</button>' +
      (codeStep ? '<button type="button" class="btn link" id="back">Use a different email</button>' : '') +
      '</form></div>');
    var f = document.getElementById('signin');
    (document.getElementById(codeStep ? 'code' : 'em')).focus();
    if (codeStep) document.getElementById('back').onclick = function () { S.step = 'email'; S.err = ''; signInView(); };
    f.onsubmit = function (e) {
      e.preventDefault();
      if (!codeStep) {
        S.email = document.getElementById('em').value.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(S.email)) { S.err = 'Enter your full email address.'; return signInView(); }
        sb.auth.signInWithOtp({ email: S.email, options: { shouldCreateUser: true } }).then(function (r) {
          if (r.error) { S.err = /member list/i.test(r.error.message) ? r.error.message : 'Couldn’t send a code: ' + r.error.message; }
          else { S.err = ''; S.step = 'code'; }
          signInView();
        });
      } else {
        var code = document.getElementById('code').value.trim();
        if (!/^\d{6}$/.test(code)) { S.err = 'Enter the 6 digits from the email.'; return signInView(); }
        sb.auth.verifyOtp({ email: S.email, token: code, type: 'email' }).then(function (r) {
          if (r.error) { S.err = 'That code didn’t work. Check it, or go back and send a new one.'; return signInView(); }
          S.err = ''; start();
        });
      }
    };
  }

  /* ---------- Register ---------- */
  function load() {
    S.loading = true; draw();
    sb.from('guest_visits').select('id, visit_date, visited_at, guest_name, email, opt_in')
      .gte('visit_date', S.from).lte('visit_date', S.to)
      .order('visited_at', { ascending: false }).limit(5000)
      .then(function (r) {
        S.loading = false;
        if (r.error) { S.msg = 'Couldn’t load the register: ' + r.error.message; S.rows = []; }
        else { S.msg = ''; S.rows = r.data; }
        draw();
      });
  }

  function draw() {
    var rows = S.rows, optins = rows.filter(function (r) { return r.opt_in; }).length;
    var body = rows.map(function (r, i) {
      var newDay = i === 0 || rows[i - 1].visit_date !== r.visit_date;
      if (S.confirm === r.id) {
        return '<tr><td colspan="5"><div class="confirm">Delete ' + esc(r.guest_name) + '’s sign-in? This can’t be undone.' +
          '<button class="btn small danger" data-a="del" data-id="' + r.id + '">Delete</button><button class="btn small" data-a="nodel">Keep</button></div></td></tr>';
      }
      return '<tr><td class="day">' + (newDay ? esc(dayLabel(r.visit_date)) : '') + '</td><td class="t">' + esc(timeLabel(r.visited_at)) + '</td>' +
        '<td>' + esc(r.guest_name) + '</td><td class="e">' + esc(r.email || '') + (r.opt_in ? ' <span class="yes">News</span>' : '') + '</td>' +
        '<td class="noprint"><button class="btn link" data-a="askdel" data-id="' + r.id + '" aria-label="Delete ' + esc(r.guest_name) + '">Delete</button></td></tr>';
    }).join('');
    var range = S.from === S.to ? dayLabel(S.from) : dayLabel(S.from) + ' to ' + dayLabel(S.to);
    render('<div class="stack">' +
      '<div class="toolbar noprint">' +
        '<div class="field"><label for="from">From</label><input type="date" id="from" value="' + S.from + '" max="' + today() + '"></div>' +
        '<div class="field"><label for="to">To</label><input type="date" id="to" value="' + S.to + '" max="' + today() + '"></div>' +
        '<button class="btn small" data-a="range" data-n="0">Today</button>' +
        '<button class="btn small" data-a="range" data-n="6">Last 7 days</button>' +
        '<button class="btn small" data-a="range" data-n="29">Last 30 days</button>' +
      '</div>' +
      '<div class="toolbar noprint">' +
        '<button class="btn small primary" data-a="csv"' + (rows.length ? '' : ' disabled') + '>Download CSV</button>' +
        '<button class="btn small" data-a="csvnews"' + (optins ? '' : ' disabled') + '>Download news sign-ups</button>' +
        '<button class="btn small" data-a="print"' + (rows.length ? '' : ' disabled') + '>Print</button>' +
        '<button class="btn link" data-a="signout">Sign out</button>' +
      '</div>' +
      '<h1>Guest register: ' + esc(range) + '</h1>' +
      '<p class="summary">' + (S.loading ? 'Loading…' : rows.length + ' sign-in' + (rows.length === 1 ? '' : 's') + (optins ? ' · ' + optins + ' asked for club news' : '')) + '</p>' +
      (S.msg ? '<p class="alert" role="alert">' + esc(S.msg) + '</p>' : '') +
      (rows.length
        ? '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Email</th><th class="noprint"></th></tr></thead><tbody>' + body + '</tbody></table></div>'
        : (S.loading ? '' : '<div class="panel"><p class="lead">No guests signed in for these dates.</p></div>')) +
      '</div>');
  }

  function csv(rows, cols) {
    var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [cols.map(function (c) { return c[0]; }).join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return q(c[1](r)); }).join(','); }));
    return '﻿' + lines.join('\r\n');
  }
  function download(name, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'range') { S.to = today(); S.from = addDays(S.to, -Number(b.dataset.n)); load(); }
    if (a === 'askdel') { S.confirm = Number(b.dataset.id); draw(); }
    if (a === 'nodel') { S.confirm = null; draw(); }
    if (a === 'del') {
      var id = Number(b.dataset.id);
      sb.from('guest_visits').delete().eq('id', id).then(function (r) {
        S.confirm = null;
        if (r.error) S.msg = 'Couldn’t delete: ' + r.error.message;
        else S.rows = S.rows.filter(function (x) { return x.id !== id; });
        draw();
      });
    }
    if (a === 'csv') download('guest-register_' + S.from + '_to_' + S.to + '.csv', csv(S.rows, [
      ['Date', function (r) { return r.visit_date; }], ['Time', function (r) { return timeLabel(r.visited_at); }],
      ['Name', function (r) { return r.guest_name; }], ['Email', function (r) { return r.email; }],
      ['Club news', function (r) { return r.opt_in ? 'Yes' : ''; }]]));
    if (a === 'csvnews') {
      var seen = {}, list = S.rows.filter(function (r) { if (!r.opt_in || seen[r.email]) return false; seen[r.email] = 1; return true; });
      download('guest-news-signups_' + S.from + '_to_' + S.to + '.csv', csv(list, [
        ['EMAIL', function (r) { return r.email; }], ['FIRSTNAME', function (r) { return r.guest_name.split(' ')[0]; }],
        ['LASTNAME', function (r) { return r.guest_name.split(' ').slice(1).join(' '); }], ['SIGNED_UP', function (r) { return r.visit_date; }]]));
    }
    if (a === 'print') window.print();
    if (a === 'signout') sb.auth.signOut().then(function () { S.step = 'email'; S.rows = []; signInView(); });
  });
  app.addEventListener('change', function (e) {
    if (e.target.id === 'from' || e.target.id === 'to') {
      S.from = document.getElementById('from').value || today();
      S.to = document.getElementById('to').value || today();
      if (S.from > S.to) { var t = S.from; S.from = S.to; S.to = t; }
      load();
    }
  });

  function start() {
    sb.rpc('is_moderator').then(function (r) {
      if (r.error || !r.data) {
        render('<div class="panel stack"><h1>Moderators only</h1><p class="lead">You’re signed in, but the guest register is only open to Tram Depot moderators. Ask the Chairperson if you need access.</p><button class="btn" id="so">Sign out</button></div>');
        document.getElementById('so').onclick = function () { sb.auth.signOut().then(function () { S.step = 'email'; signInView(); }); };
        return;
      }
      S.from = S.to = today();
      load();
    });
  }

  sb.auth.getSession().then(function (r) { if (r.data && r.data.session) start(); else signInView(); });
})();
