/* Guest sign-in: validates the form and adds one row to the guest register.
   Talks to Supabase's REST API directly (no library) so it loads fast on a weak signal. */
(function () {
  'use strict';
  var cfg = window.GUEST_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('guest-form'), nameIn = $('name'), emailIn = $('email'), optIn = $('optin'), btn = $('submit');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var STORE = 'tbc-guest';

  $('contact').href = 'mailto:' + cfg.contactEmail;
  $('contact').textContent = cfg.contactEmail;

  // Returning guest on their own phone: fill in last time's details
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved && saved.name) { nameIn.value = saved.name; emailIn.value = saved.email || ''; }
  } catch (e) { /* storage unavailable: ignore */ }

  function showErr(input, el, msg) {
    el.textContent = msg || '';
    el.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  function alertMsg(msg) { var a = $('form-alert'); a.textContent = msg || ''; a.hidden = !msg; }

  function validate() {
    var name = nameIn.value.replace(/\s+/g, ' ').trim();
    var email = emailIn.value.trim();
    var ok = true;
    if (name.length < 2) { showErr(nameIn, $('name-err'), 'Please enter your name.'); ok = false; }
    else showErr(nameIn, $('name-err'), '');
    if (email && !EMAIL_RE.test(email)) { showErr(emailIn, $('email-err'), 'That email doesn’t look right. Check it, or leave it blank.'); ok = false; }
    else if (!email && optIn.checked) { showErr(emailIn, $('email-err'), 'Add your email so we can send you club news, or untick the box.'); ok = false; }
    else showErr(emailIn, $('email-err'), '');
    return ok ? { name: name, email: email, optin: !!(email && optIn.checked) } : null;
  }

  function friendlyError(status, body) {
    var msg = (body && (body.message || body.msg)) || '';
    if (/too many sign-ins/i.test(msg)) return 'Lots of people are signing in right now. Please try again in a minute.';
    if (status === 0) return 'We couldn’t reach the register. Check your phone has signal or Wi-Fi and try again. If it still won’t work, please ask at the bar.';
    return 'Something went wrong saving your sign-in. Please try again, or ask at the bar.';
  }

  function save(data) {
    return fetch(cfg.supabaseUrl + '/rest/v1/guest_visits', {
      method: 'POST',
      headers: { 'apikey': cfg.supabaseKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ guest_name: data.name, email: data.email || null, opt_in: data.optin })
    }).then(function (res) {
      if (res.ok) return;
      return res.json().catch(function () { return {}; }).then(function (b) { throw new Error(friendlyError(res.status, b)); });
    }, function () { throw new Error(friendlyError(0)); });
  }

  function showDone(data) {
    var now = new Date();
    $('done-name').textContent = data.name;
    $('done-when').textContent = now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      + ' · ' + now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
    $('done-news').hidden = !data.optin;
    $('form-view').hidden = true;
    $('done-view').hidden = false;
    window.scrollTo(0, 0);
    $('done-view').focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alertMsg('');
    var data = validate();
    if (!data) { (nameIn.getAttribute('aria-invalid') === 'true' ? nameIn : emailIn).focus(); return; }
    if ($('website').value) { showDone(data); return; }   // bot: pretend it worked, save nothing

    btn.disabled = true; btn.textContent = 'Signing in…';
    save(data).then(function () {
      try { localStorage.setItem(STORE, JSON.stringify({ name: data.name, email: data.email })); } catch (err) { /* ignore */ }
      showDone(data);
    }).catch(function (err) {
      alertMsg(err.message);
    }).then(function () {
      btn.disabled = false; btn.textContent = 'Sign in';
    });
  });

  // Clear an error as soon as the person fixes it
  [nameIn, emailIn].forEach(function (el) {
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); });
  });
  optIn.addEventListener('change', function () { if (emailIn.getAttribute('aria-invalid') === 'true') validate(); });

  $('another').addEventListener('click', function () {
    form.reset();
    nameIn.value = ''; emailIn.value = '';
    [[nameIn, 'name-err'], [emailIn, 'email-err']].forEach(function (p) { showErr(p[0], $(p[1]), ''); });
    $('done-view').hidden = true;
    $('form-view').hidden = false;
    nameIn.focus();
  });
})();
