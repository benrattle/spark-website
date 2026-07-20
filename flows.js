/* Spark — interactive flows re-implemented in vanilla JS (no DC runtime):
   1) EV charger cart (localStorage) + slide-over drawer  [ev-chargers.html]
   2) Get-a-quote 3-step wizard + booking                 [get-a-quote.html]
   3) EV checkout                                          [ev-checkout.html]
   Data & copy mirror the original Claude Design logic. */
(function () {
  'use strict';
  var RED = '#F60F00', NAVY = '#1B2135', INK = '#51607A';
  var fmt = function (n) { return '£' + Math.round(n).toLocaleString('en-GB'); };
  var CART_KEY = 'spark_ev_basket';
  var CATALOGUE = [
    { id: 'sc7t', name: 'Spark Smart 7kW (tethered)', price: 849, monthly: 18, tile: 'linear-gradient(150deg,#1F2A44,#141B2C)' },
    { id: 'sc7u', name: 'Spark Smart 7kW (untethered)', price: 799, monthly: 17, tile: 'linear-gradient(150deg,#243049,#141B2C)' },
    { id: 'scpro', name: 'Spark Pro 22kW', price: 1149, monthly: 24, tile: 'linear-gradient(150deg,#1B2A22,#10160F)' },
    { id: 'scsync', name: 'Solar-Sync 7kW', price: 999, monthly: 21, tile: 'linear-gradient(150deg,#3A2418,#1A1009)' }
  ];
  var byId = function (id) { for (var i = 0; i < CATALOGUE.length; i++) if (CATALOGUE[i].id === id) return CATALOGUE[i]; return null; };
  function getCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function setCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }
  function cartCount(c) { c = c || getCart(); var n = 0; for (var k in c) n += c[k]; return n; }
  function cartTotal(c) { c = c || getCart(); var t = 0; CATALOGUE.forEach(function (p) { t += (c[p.id] || 0) * p.price; }); return t; }
  function cartMonthly(c) { c = c || getCart(); var t = 0; CATALOGUE.forEach(function (p) { t += (c[p.id] || 0) * p.monthly; }); return t; }
  function inputStyle() { return "font-family:'Hanken Grotesk',sans-serif;font-size:16px;padding:14px 16px;border:1.5px solid rgba(27,33,53,0.14);border-radius:11px;background:#FBFAF8;color:#1B2135;outline:none;width:100%"; }
  function primaryBtn(enabled) { return 'width:100%;background:' + (enabled === false ? '#C9CDD4' : RED) + ';color:#fff;border:none;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:16px;padding:16px;border-radius:12px;cursor:' + (enabled === false ? 'not-allowed' : 'pointer') + ';box-shadow:0 8px 18px rgba(246,15,0,0.2)'; }

  /* =========================================================
     1) EV CHARGER CART  (ev-chargers.html)
     ========================================================= */
  function initEvCart() {
    var adds = document.querySelectorAll('[data-js="ev-add"]');
    var openBtn = document.querySelector('[data-js="ev-basket-open"]');
    if (!adds.length && !openBtn) return;

    // slide-over drawer
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,19,34,0.5);z-index:90;display:none';
    var drawer = document.createElement('div');
    drawer.style.cssText = "position:fixed;top:0;right:0;height:100%;width:380px;max-width:calc(100vw - 20px);background:#F4F4F2;z-index:91;box-shadow:-20px 0 50px -20px rgba(15,19,34,0.5);display:none;flex-direction:column;font-family:'Hanken Grotesk',sans-serif";
    document.body.appendChild(overlay); document.body.appendChild(drawer);

    function open() { overlay.style.display = 'block'; drawer.style.display = 'flex'; renderDrawer(); }
    function close() { overlay.style.display = 'none'; drawer.style.display = 'none'; }
    overlay.addEventListener('click', close);

    function setQty(id, q) { var c = getCart(); if (q <= 0) delete c[id]; else c[id] = q; setCart(c); renderDrawer(); syncBadge(); }

    function renderDrawer() {
      var c = getCart(); var lines = CATALOGUE.filter(function (p) { return c[p.id]; });
      var head = '<div style="background:' + NAVY + ';color:#fff;padding:20px 22px;display:flex;align-items:center;justify-content:space-between"><span style="font-family:\'Schibsted Grotesk\',sans-serif;font-weight:800;font-size:18px">Your basket</span><button data-x style="background:none;border:none;color:#fff;font-size:26px;line-height:1;cursor:pointer;opacity:.8">×</button></div>';
      var body;
      if (!lines.length) {
        body = '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;color:#7C8493"><div style="font-size:15px">Your basket is empty.</div></div>';
      } else {
        var rows = lines.map(function (p) {
          return '<div style="display:flex;gap:12px;align-items:center;background:#fff;border:1px solid rgba(27,33,53,0.08);border-radius:14px;padding:12px">' +
            '<span style="width:46px;height:46px;border-radius:10px;flex:none;background:' + p.tile + '"></span>' +
            '<div style="flex:1;min-width:0"><div style="font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:14px;color:' + NAVY + ';line-height:1.2">' + p.name + '</div>' +
            '<div style="font-size:13px;color:' + INK + ';margin-top:2px">' + fmt(p.price) + '</div></div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
            '<button data-dec="' + p.id + '" style="width:26px;height:26px;border-radius:7px;border:1.5px solid rgba(27,33,53,0.16);background:#fff;cursor:pointer;font-weight:700">−</button>' +
            '<span style="min-width:16px;text-align:center;font-weight:700">' + c[p.id] + '</span>' +
            '<button data-inc="' + p.id + '" style="width:26px;height:26px;border-radius:7px;border:1.5px solid rgba(27,33,53,0.16);background:#fff;cursor:pointer;font-weight:700">+</button>' +
            '</div></div>';
        }).join('');
        body = '<div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">' + rows + '</div>' +
          '<div style="border-top:1px solid rgba(27,33,53,0.1);background:#fff;padding:18px 20px">' +
          '<div style="display:flex;justify-content:space-between;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:800;font-size:20px;color:' + NAVY + ';margin-bottom:4px"><span>Total</span><span>' + fmt(cartTotal(c)) + '</span></div>' +
          '<div style="font-size:13px;color:' + INK + ';margin-bottom:16px">or from ' + fmt(cartMonthly(c)) + '/mo on finance</div>' +
          '<a href="ev-checkout.html" style="display:block;text-align:center;background:' + RED + ';color:#fff;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:16px;padding:15px;border-radius:12px;text-decoration:none">Checkout</a></div>';
      }
      drawer.innerHTML = head + body;
      drawer.querySelector('[data-x]').addEventListener('click', close);
      drawer.querySelectorAll('[data-inc]').forEach(function (b) { b.addEventListener('click', function () { setQty(b.getAttribute('data-inc'), (getCart()[b.getAttribute('data-inc')] || 0) + 1); }); });
      drawer.querySelectorAll('[data-dec]').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-dec'); setQty(id, (getCart()[id] || 0) - 1); }); });
    }

    function syncBadge() {
      if (!openBtn) return;
      var n = cartCount();
      var badge = openBtn.querySelector('[data-badge]');
      if (n > 0) {
        if (!badge) {
          badge = document.createElement('span'); badge.setAttribute('data-badge', '');
          badge.style.cssText = 'position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#fff;color:' + RED + ';font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2)';
          openBtn.style.position = 'relative'; openBtn.appendChild(badge);
        }
        badge.textContent = n;
      } else if (badge) { badge.remove(); }
    }

    // buttons render from one sc-for template, so all share data-js; map by DOM order to catalogue
    Array.prototype.forEach.call(adds, function (btn, i) {
      var prod = CATALOGUE[i]; if (!prod) return;
      btn.setAttribute('data-ev', prod.id);
      btn.addEventListener('click', function () {
        var c = getCart(); c[prod.id] = (c[prod.id] || 0) + 1; setCart(c);
        syncBadge(); open();
      });
    });
    if (openBtn) openBtn.addEventListener('click', open);
    syncBadge();
  }

  /* =========================================================
     2) GET-A-QUOTE WIZARD  (get-a-quote.html)
     ========================================================= */
  function initQuoteWizard() {
    var mount = document.getElementById('quote-card');
    if (!mount) return;
    var st = { stage: 'form', step: 1, property: '', own: '', bill: 150, finance: '', first: '', last: '', email: '', phone: '', postcode: '', address: '', showSug: false, journey: '', slot: '', error: false };
    var PROP = [['detached', 'Detached'], ['semi', 'Semi-detached'], ['terraced', 'Terraced'], ['bungalow', 'Bungalow']];
    var OWN = [['own', 'I own my home'], ['rent', 'I rent']];
    var FIN = [['cash', 'Pay cash'], ['interestfree', 'Interest-free credit'], ['monthly', 'Pay monthly'], ['lease', 'Solar lease'], ['unsure', 'Not sure yet']];
    var TITLES = { 1: ['About your home', "First, a couple of quick details about your property."], 2: ['Your energy use', "This helps us size the right system for you."], 3: ['Where shall we send it?', "Pop in your details and we'll be in touch with your quote."] };
    var JOURNEY = [
      ['visit', 'Home visit', 'A surveyor visits to design your system and confirm your savings.'],
      ['online', 'Online consultation', "A video call to walk through your design — no need to be home."],
      ['quote', 'Quote by email', 'We email your personalised, EPVS-validated quote.']
    ];
    var SLOTS = { visit: ['Tue 24 Jun · AM', 'Thu 26 Jun · PM', 'Sat 28 Jun · AM'], online: ['Today · 6:00pm', 'Tomorrow · 1:00pm', 'Wed · 11:00am'] };
    var DONE = {
      visit: ['Your home visit is booked', 'A Spark surveyor will visit {slot} to design your system and confirm your savings. We have emailed the details.'],
      online: ['Your online consultation is booked', 'We will video-call you {slot} to walk through your design and savings on screen — no need to be home.'],
      quote: ['Your quote is on its way', 'We will email your personalised, EPVS-validated quote shortly and follow up — no pressure, no hard sell.']
    };
    var head = "font-family:'Schibsted Grotesk',sans-serif;font-weight:800;color:" + NAVY;

    function optBtn(sel, label, extra) {
      return 'text-align:left;background:' + (sel ? '#FFF4F2' : '#FBFAF8') + ';border:1.5px solid ' + (sel ? RED : 'rgba(27,33,53,0.12)') + ';border-radius:12px;padding:15px 16px;cursor:pointer;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:15px;color:' + NAVY + ';' + (extra || '');
    }
    function render() {
      var h = '';
      if (st.stage === 'form') {
        var dots = [1, 2, 3].map(function (n) { return '<div style="height:6px;flex:1;border-radius:3px;background:' + (n <= st.step ? RED : '#E6E6E2') + '"></div>'; }).join('');
        h += '<div style="display:flex;gap:8px;margin-bottom:22px">' + dots + '</div>';
        h += '<h1 style="' + head + ';font-size:clamp(24px,3vw,30px);margin:0 0 6px">' + TITLES[st.step][0] + '</h1>';
        h += '<p style="font-size:16px;color:' + INK + ';margin:0 0 24px">' + TITLES[st.step][1] + '</p>';
        if (st.step === 1) {
          h += '<div style="font-weight:700;color:' + NAVY + ';margin-bottom:10px">Your property type</div>';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px">' + PROP.map(function (p) { return '<button data-prop="' + p[0] + '" style="' + optBtn(st.property === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div>';
          h += '<div style="font-weight:700;color:' + NAVY + ';margin-bottom:10px">Do you own your home?</div>';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + OWN.map(function (o) { return '<button data-own="' + o[0] + '" style="' + optBtn(st.own === o[0], null, 'text-align:center') + '">' + o[1] + '</button>'; }).join('') + '</div>';
          if (st.own === 'rent') h += '<div style="margin-top:16px;background:#FFF4F2;border:1px solid rgba(246,15,0,0.3);border-radius:12px;padding:14px 16px;font-size:14px;color:' + NAVY + '">We can only install solar for homeowners at this time — but do ask your landlord about Spark!</div>';
        } else if (st.step === 2) {
          h += '<div style="background:#FBFAF8;border:1px solid rgba(27,33,53,0.1);border-radius:14px;padding:20px 22px;margin-bottom:22px">';
          h += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><span style="font-weight:600;color:' + INK + '">Your current monthly energy bill</span><span style="' + head + ';font-size:24px;color:' + RED + '">' + fmt(st.bill) + '</span></div>';
          h += '<input type="range" min="40" max="400" step="5" value="' + st.bill + '" data-bill style="width:100%;accent-color:' + RED + ';height:6px;cursor:pointer"></div>';
          h += '<div style="font-weight:700;color:' + NAVY + ';margin-bottom:10px">How would you like to pay?</div>';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + FIN.map(function (f) { return '<button data-fin="' + f[0] + '" style="' + optBtn(st.finance === f[0], null, 'text-align:center;font-size:14.5px') + '">' + f[1] + '</button>'; }).join('') + '</div>';
        } else if (st.step === 3) {
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px"><input data-f="first" placeholder="First name" value="' + esc(st.first) + '" style="' + inputStyle() + '"><input data-f="last" placeholder="Last name" value="' + esc(st.last) + '" style="' + inputStyle() + '"></div>';
          h += '<input data-f="email" type="email" placeholder="Email address" value="' + esc(st.email) + '" style="' + inputStyle() + ';margin-bottom:12px">';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><input data-f="phone" type="tel" placeholder="Phone number" value="' + esc(st.phone) + '" style="' + inputStyle() + '"><input data-f="postcode" placeholder="Postcode" value="' + esc(st.postcode) + '" style="' + inputStyle() + '"></div>';
          if (st.error) h += '<div style="margin-top:12px;color:' + RED + ';font-size:14px;font-weight:600">Please enter at least your first name and phone number.</div>';
        }
        // nav
        h += '<div style="display:flex;gap:12px;margin-top:26px">';
        if (st.step > 1) h += '<button data-back style="background:#fff;border:1.5px solid rgba(27,33,53,0.16);color:' + NAVY + ';font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:16px;padding:15px 24px;border-radius:11px;cursor:pointer">Back</button>';
        var blocked = st.step === 1 && st.own === 'rent';
        h += '<button data-next style="flex:1;' + primaryBtn(!blocked) + '">' + (st.step === 3 ? 'See my options →' : 'Continue →') + '</button></div>';
      } else if (st.stage === 'choose') {
        h += '<h1 style="' + head + ';font-size:clamp(24px,3vw,30px);margin:0 0 6px">How would you like your quote?</h1>';
        h += '<p style="font-size:16px;color:' + INK + ';margin:0 0 22px">Choose the option that suits you — all free and no-obligation.</p>';
        h += JOURNEY.map(function (j) {
          var sel = st.journey === j[0];
          return '<button data-journey="' + j[0] + '" style="display:block;width:100%;text-align:left;background:' + (sel ? '#FFF4F2' : '#FBFAF8') + ';border:1.5px solid ' + (sel ? RED : 'rgba(27,33,53,0.12)') + ';border-radius:14px;padding:18px;cursor:pointer;margin-bottom:12px"><div style="' + head + ';font-size:17px">' + j[1] + '</div><div style="font-size:14px;color:' + INK + ';margin-top:4px">' + j[2] + '</div></button>';
        }).join('');
        if (st.journey === 'visit' || st.journey === 'online') {
          h += '<div style="font-weight:700;color:' + NAVY + ';margin:18px 0 10px">' + (st.journey === 'online' ? 'Choose a call time' : 'Choose a visit slot') + '</div>';
          h += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' + SLOTS[st.journey].map(function (s) { return '<button data-slot="' + esc(s) + '" style="background:' + (st.slot === s ? '#FFF4F2' : '#FBFAF8') + ';border:1.5px solid ' + (st.slot === s ? RED : 'rgba(27,33,53,0.12)') + ';border-radius:11px;padding:13px 8px;cursor:pointer;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:13.5px;color:' + NAVY + '">' + s + '</button>'; }).join('') + '</div>';
        }
        var ready = st.journey === 'quote' || (!!st.journey && !!st.slot);
        h += '<button data-confirm style="margin-top:24px;' + primaryBtn(ready) + '">' + (st.journey === 'quote' ? 'Send me the quote' : 'Confirm booking') + '</button>';
      } else if (st.stage === 'done') {
        var d = DONE[st.journey] || DONE.quote;
        var body = d[1].replace('{slot}', st.slot ? ('on ' + st.slot) : 'soon');
        h += '<div style="text-align:center;padding:20px 6px">';
        h += '<div style="width:64px;height:64px;border-radius:50%;background:#E9F8EF;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1F9D57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>';
        h += '<h1 style="' + head + ';font-size:26px;margin:0 0 12px">' + d[0] + '</h1>';
        h += '<p style="font-size:16px;color:' + INK + ';line-height:1.6;margin:0 auto 24px;max-width:420px">' + body + '</p>';
        h += '<a href="index.html" style="display:inline-block;background:' + NAVY + ';color:#fff;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:15px;padding:14px 26px;border-radius:11px;text-decoration:none">Back to home</a></div>';
      }
      mount.innerHTML = h;
      wire();
    }
    function wire() {
      q('[data-prop]', function (b) { b.onclick = function () { st.property = b.getAttribute('data-prop'); render(); }; });
      q('[data-own]', function (b) { b.onclick = function () { st.own = b.getAttribute('data-own'); render(); }; });
      q('[data-fin]', function (b) { b.onclick = function () { st.finance = b.getAttribute('data-fin'); render(); }; });
      var bill = mount.querySelector('[data-bill]'); if (bill) bill.oninput = function () { st.bill = +bill.value; var lbl = mount.querySelector('span[style*="' + RED + '"]'); render(); };
      q('[data-f]', function (i) { i.oninput = function () { st[i.getAttribute('data-f')] = i.value; }; });
      var back = mount.querySelector('[data-back]'); if (back) back.onclick = function () { st.step = Math.max(1, st.step - 1); st.error = false; render(); };
      var next = mount.querySelector('[data-next]'); if (next) next.onclick = function () {
        if (st.step === 1 && st.own === 'rent') return;
        if (st.step < 3) { st.step++; render(); }
        else { if (!st.first.trim() || !st.phone.trim()) { st.error = true; render(); return; } st.stage = 'choose'; render(); }
      };
      q('[data-journey]', function (b) { b.onclick = function () { st.journey = b.getAttribute('data-journey'); st.slot = ''; render(); }; });
      q('[data-slot]', function (b) { b.onclick = function () { st.slot = b.getAttribute('data-slot'); render(); }; });
      var conf = mount.querySelector('[data-confirm]'); if (conf) conf.onclick = function () { var ready = st.journey === 'quote' || (!!st.journey && !!st.slot); if (ready) { st.stage = 'done'; render(); } };
    }
    function q(sel, fn) { Array.prototype.forEach.call(mount.querySelectorAll(sel), fn); }
    function esc(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
    render();
  }

  /* =========================================================
     3) EV CHECKOUT  (ev-checkout.html)
     ========================================================= */
  function initEvCheckout() {
    var mount = document.getElementById('checkout-app');
    if (!mount) return;
    var st = { step: 1, first: '', last: '', email: '', phone: '', postcode: '', slot: '', pay: '', err: false };
    var SLOTS = [['Tue 30 Jun', 'Morning · 8am–1pm'], ['Thu 2 Jul', 'Afternoon · 1pm–5pm'], ['Mon 6 Jul', 'Morning · 8am–1pm'], ['Sat 11 Jul', 'Morning · 8am–1pm']];
    var head = "font-family:'Schibsted Grotesk',sans-serif;font-weight:800;color:" + NAVY;
    function esc(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
    function q(sel, fn) { Array.prototype.forEach.call(mount.querySelectorAll(sel), fn); }

    function render() {
      mount.style.display = 'block';
      var c = getCart(), lines = CATALOGUE.filter(function (p) { return c[p.id]; });
      if (!lines.length && st.step < 4) {
        mount.innerHTML = '<div style="background:#fff;border:1px solid rgba(27,33,53,0.1);border-radius:18px;padding:48px 32px;text-align:center;max-width:560px"><h1 style="' + head + ';font-size:26px;margin:0 0 12px">Your basket is empty</h1><p style="font-size:16px;color:' + INK + ';margin:0 0 22px">Add a charger to get started.</p><a href="ev-chargers.html" style="display:inline-flex;background:' + RED + ';color:#fff;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:15px;padding:14px 26px;border-radius:11px;text-decoration:none">Browse chargers</a></div>';
        return;
      }
      var steps = ['Details', 'Install date', 'Payment'].map(function (t, i) {
        var n = i + 1, on = st.step >= n;
        return '<div style="display:flex;align-items:center;gap:8px"><span style="width:26px;height:26px;border-radius:50%;background:' + (on ? RED : '#E6E6E2') + ';color:' + (on ? '#fff' : '#7C8493') + ';display:flex;align-items:center;justify-content:center;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:800;font-size:13px">' + n + '</span><span style="font-size:13.5px;font-weight:700;color:' + (on ? NAVY : '#9AA0AC') + '">' + t + '</span></div>';
      }).join('<span style="flex:1;height:2px;background:#E6E6E2;margin:0 6px"></span>');

      var left = '';
      if (st.step === 1) {
        left += card('<h2 style="' + head + ';font-size:22px;margin:0 0 16px">Your details</h2>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px"><input data-f="first" placeholder="First name" value="' + esc(st.first) + '" style="' + inputStyle() + '"><input data-f="last" placeholder="Last name" value="' + esc(st.last) + '" style="' + inputStyle() + '"></div>' +
          '<input data-f="email" type="email" placeholder="Email address" value="' + esc(st.email) + '" style="' + inputStyle() + ';margin-bottom:12px">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><input data-f="phone" type="tel" placeholder="Phone number" value="' + esc(st.phone) + '" style="' + inputStyle() + '"><input data-f="postcode" placeholder="Postcode" value="' + esc(st.postcode) + '" style="' + inputStyle() + '"></div>' +
          (st.err ? '<div style="margin-top:12px;color:' + RED + ';font-size:14px;font-weight:600">Please enter your name, phone and postcode.</div>' : '') +
          '<button data-next style="margin-top:22px;' + primaryBtn(true) + '">Continue to install date →</button>');
      } else if (st.step === 2) {
        left += card('<h2 style="' + head + ';font-size:22px;margin:0 0 16px">Choose your install date</h2>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' + SLOTS.map(function (s) { var sel = st.slot === s[0]; return '<button data-slot="' + esc(s[0]) + '" style="text-align:left;background:' + (sel ? '#FFF4F2' : '#FBFAF8') + ';border:1.5px solid ' + (sel ? RED : 'rgba(27,33,53,0.12)') + ';border-radius:12px;padding:15px;cursor:pointer"><div style="' + head + ';font-size:15px">' + s[0] + '</div><div style="font-size:13px;color:' + INK + ';margin-top:3px">' + s[1] + '</div></button>'; }).join('') + '</div>' +
          '<div style="display:flex;gap:12px;margin-top:22px"><button data-back style="background:#fff;border:1.5px solid rgba(27,33,53,0.16);color:' + NAVY + ';font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:16px;padding:15px 24px;border-radius:11px;cursor:pointer">Back</button><button data-next style="flex:1;' + primaryBtn(!!st.slot) + '">Continue to payment →</button></div>');
      } else if (st.step === 3) {
        var total = cartTotal(c), monthly = cartMonthly(c);
        var PAY = [['full', 'Pay in full', 'Card payment today, nothing more to pay.', fmt(total)], ['interestfree', 'Interest-free credit', '0% APR spread over 24 months.', fmt(total / 24) + '/mo'], ['finance', 'Pay monthly', 'Lower payments over a longer term.', 'from ' + fmt(monthly) + '/mo']];
        left += card('<h2 style="' + head + ';font-size:22px;margin:0 0 16px">How would you like to pay?</h2>' +
          PAY.map(function (p) { var sel = st.pay === p[0]; return '<button data-pay="' + p[0] + '" style="display:flex;width:100%;justify-content:space-between;align-items:center;gap:12px;text-align:left;background:' + (sel ? '#FFF4F2' : '#FBFAF8') + ';border:1.5px solid ' + (sel ? RED : 'rgba(27,33,53,0.12)') + ';border-radius:12px;padding:16px;cursor:pointer;margin-bottom:12px"><span><span style="' + head + ';font-size:16px;display:block">' + p[1] + '</span><span style="font-size:13px;color:' + INK + '">' + p[2] + '</span></span><span style="' + head + ';font-size:16px;color:' + RED + ';white-space:nowrap">' + p[3] + '</span></button>'; }).join('') +
          '<div style="display:flex;gap:12px;margin-top:10px"><button data-back style="background:#fff;border:1.5px solid rgba(27,33,53,0.16);color:' + NAVY + ';font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:16px;padding:15px 24px;border-radius:11px;cursor:pointer">Back</button><button data-order style="flex:1;' + primaryBtn(!!st.pay) + '">Place order</button></div>');
      } else {
        left += card('<div style="text-align:center;padding:20px 6px"><div style="width:64px;height:64px;border-radius:50%;background:#E9F8EF;display:flex;align-items:center;justify-content:center;margin:0 auto 20px"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1F9D57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h1 style="' + head + ';font-size:26px;margin:0 0 12px">Order confirmed</h1><p style="font-size:16px;color:' + INK + ';line-height:1.6;margin:0 auto 24px;max-width:420px">Thank you' + (st.first ? ', ' + esc(st.first) : '') + '! Your charger order is confirmed' + (st.slot ? ' for ' + esc(st.slot) : '') + '. We\'ve emailed your confirmation and an engineer will be in touch.</p><a href="ev-chargers.html" style="display:inline-block;background:' + NAVY + ';color:#fff;font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:15px;padding:14px 26px;border-radius:11px;text-decoration:none">Back to chargers</a></div>');
      }

      var summary = st.step === 4 ? '' : summaryCard(lines, c);
      mount.innerHTML = '<div style="margin-bottom:24px;display:flex;align-items:center">' + steps + '</div><div style="display:grid;grid-template-columns:' + (st.step === 4 ? '1fr' : '1.4fr 0.85fr') + ';gap:28px;align-items:start"><div>' + left + '</div>' + summary + '</div>';
      wire();
    }
    function card(inner) { return '<div style="background:#fff;border:1px solid rgba(27,33,53,0.1);border-radius:18px;padding:28px">' + inner + '</div>'; }
    function summaryCard(lines, c) {
      var rows = lines.map(function (p) { return '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><span style="width:40px;height:40px;border-radius:9px;flex:none;background:' + p.tile + '"></span><div style="flex:1"><div style="font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:13.5px;color:' + NAVY + ';line-height:1.2">' + p.name + '</div><div style="font-size:12.5px;color:' + INK + '">Qty ' + c[p.id] + '</div></div><div style="font-family:\'Schibsted Grotesk\',sans-serif;font-weight:700;font-size:14px;color:' + NAVY + '">' + fmt(p.price * c[p.id]) + '</div></div>'; }).join('');
      return '<div style="background:#fff;border:1px solid rgba(27,33,53,0.1);border-radius:18px;padding:24px;position:sticky;top:96px"><div style="' + head + ';font-size:16px;margin-bottom:16px">Order summary</div>' + rows + '<div style="border-top:1px solid rgba(27,33,53,0.1);margin-top:6px;padding-top:14px;display:flex;justify-content:space-between;' + head + ';font-size:20px"><span>Total</span><span>' + fmt(cartTotal(c)) + '</span></div><div style="font-size:12.5px;color:' + INK + ';margin-top:4px">or from ' + fmt(cartMonthly(c)) + '/mo</div></div>';
    }
    function wire() {
      q('[data-f]', function (i) { i.oninput = function () { st[i.getAttribute('data-f')] = i.value; }; });
      q('[data-slot]', function (b) { b.onclick = function () { st.slot = b.getAttribute('data-slot'); render(); }; });
      q('[data-pay]', function (b) { b.onclick = function () { st.pay = b.getAttribute('data-pay'); render(); }; });
      var back = mount.querySelector('[data-back]'); if (back) back.onclick = function () { st.step--; render(); };
      var next = mount.querySelector('[data-next]'); if (next) next.onclick = function () {
        if (st.step === 1) { if (!st.first.trim() || !st.phone.trim() || !st.postcode.trim()) { st.err = true; render(); return; } st.err = false; st.step = 2; render(); }
        else if (st.step === 2) { if (st.slot) { st.step = 3; render(); } }
      };
      var order = mount.querySelector('[data-order]'); if (order) order.onclick = function () { if (st.pay) { setCart({}); st.step = 4; render(); } };
    }
    render();
  }

  function init() { initEvCart(); initQuoteWizard(); initEvCheckout(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
