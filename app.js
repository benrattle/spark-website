/* Spark — shared vanilla interactions (no DC runtime).
   Widgets are wired via data-js hooks injected at build time. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return '£' + Math.round(n).toLocaleString('en-GB'); };
  var setOut = function (key, val) { $$('[data-js-out="' + key + '"]').forEach(function (e) { e.textContent = val; }); };

  /* ---------- FAQ accordions (both template styles) ---------- */
  function initFaq() {
    var btns = $$('[data-js="faq-toggle"]');
    btns.forEach(function (btn, i) {
      var panel = btn.nextElementSibling;
      if (!panel) return;
      // sign span = last span in the button (text +/– OR rotate icon)
      var sign = btn.querySelector('span:last-child');
      var open = false;
      function set(o) {
        open = o;
        panel.style.maxHeight = o ? (panel.scrollHeight + 40) + 'px' : '0px';
        if (sign) {
          if (sign.textContent.trim() === '+' || sign.textContent.trim() === '–' || sign.textContent.trim() === '-') {
            sign.textContent = o ? '–' : '+';
          } else {
            sign.style.transform = o ? 'rotate(45deg)' : 'rotate(0deg)';
          }
        }
      }
      // group = siblings sharing the same parent list; open first by default
      set(i === 0 && sameGroupFirst(btn));
      btn.addEventListener('click', function () {
        var wasOpen = open;
        // close others in same group
        btns.forEach(function (b2) {
          if (b2 !== btn && b2._faqSet && b2._faqGroup === btn._faqGroup) b2._faqSet(false);
        });
        set(!wasOpen);
      });
      btn._faqSet = set; btn._faqGroup = btn.closest('section, [id]') || document.body;
    });
    function sameGroupFirst(btn) {
      // only auto-open the very first FAQ button on the page
      return btns.indexOf(btn) === 0;
    }
  }

  /* ---------- Live chat (homepage) ---------- */
  function initChat() {
    var panel = $('[data-js="chat-panel"]');
    var msgs = $('[data-js="chat-messages"]');
    var input = $('[data-js="chat-input"]');
    if (!panel) return;
    var open = false;
    panel.style.display = 'none';
    function toggle() { open = !open; panel.style.display = open ? 'flex' : 'none'; if (open && input) input.focus(); }
    $$('[data-js="chat-toggle"]').forEach(function (b) { b.addEventListener('click', toggle); });

    function bubble(text, who) {
      var d = document.createElement('div');
      var agent = who === 'agent';
      d.style.cssText = 'align-self:' + (agent ? 'flex-start' : 'flex-end') +
        ';max-width:82%;background:' + (agent ? '#ffffff' : '#F60F00') + ';color:' + (agent ? '#1B2135' : '#fff') +
        ';padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;box-shadow:0 1px 2px rgba(27,33,53,0.06)';
      d.textContent = text; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    }
    function reply(t) {
      var s = (t || '').toLowerCase();
      if (/cost|price|how much|quote|afford|finance|pay/.test(s)) return "Great question — every quote is tailored to your roof and energy use, and includes an EPVS-validated savings figure. Pop your postcode and number in the form and an expert will call with exact numbers, no obligation.";
      if (/guarantee|warranty|cover/.test(s)) return "We back every install with our Triple Guarantee: lifetime workmanship, a price match, and an independently-validated savings guarantee. Anything specific you'd like to know?";
      if (/battery|ecoflow|storage|power/.test(s)) return "Our systems use the EcoFlow PowerOcean battery — a 15-year warranty and 5 to 20kWh of storage. Want an expert to size one for your home?";
      if (/cloud|weather|sun|winter|work/.test(s)) return "Modern panels capture daylight, not just direct sun, so they generate well even on cloudy UK days. Happy to talk through what your roof could produce!";
      return "Thanks for your message! One of our UK-based solar experts will be right with you. If you'd prefer a callback, just drop your number and a good time to call.";
    }
    function send() {
      var t = (input.value || '').trim(); if (!t) return;
      bubble(t, 'user'); input.value = '';
      setTimeout(function () { bubble(reply(t), 'agent'); }, 800);
    }
    $$('[data-js="chat-send"]').forEach(function (b) { b.addEventListener('click', send); });
    if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
  }

  /* ---------- Homepage rising-bills chart: animate on scroll ---------- */
  function initChart() {
    var bars = $$('[data-js="bar"]');
    if (!bars.length) return;
    bars.forEach(function (b) { b.dataset.target = b.style.height; b.style.height = '2px'; });
    var card = bars[0].closest('[data-r="chart-card"]') || bars[0].closest('section');
    var run = function () { bars.forEach(function (b) { b.style.height = b.dataset.target; }); };
    if ('IntersectionObserver' in window && card) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { run(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(card);
    } else { run(); }
  }

  /* ---------- Calculators ---------- */
  var CALC = {
    idx: function (bill) {
      var annual = bill * 12, g = 1.07, b = annual, total = 0, i;
      for (i = 0; i < 30; i++) { total += b; b *= g; }
      var r = function (n) { return Math.round(n / 100) * 100; };
      setOut('idx-bill', '£' + bill);
      setOut('idx-doNothing', fmt(r(total)));
      setOut('idx-withSpark', fmt(r(total * 0.1)));
      setOut('idx-save', fmt(r(total * 0.9)));
    },
    fin: function (bill) {
      var annualBill = bill * 12;
      var annualSave = annualBill * 0.70 + 130;
      var lifetime = annualSave * 30;
      setOut('fin-bill', fmt(bill));
      setOut('fin-annual', fmt(annualSave));
      setOut('fin-monthly', fmt(annualSave / 12));
      setOut('fin-lifetime', fmt(Math.round(lifetime / 100) * 100));
    },
    hp: function (spend) {
      var heatKwh = (spend / 0.07) * 0.9, hpElec = heatKwh / 3.2;
      var gasCost = spend, hpCost = hpElec * 0.245, hpSolarCost = hpCost * 0.62;
      var maxBar = Math.max(gasCost, hpCost, hpSolarCost, 1);
      var co2Gas = (spend / 0.07) * 0.183, co2Hp = hpElec * 0.07;
      var co2SavedT = Math.max(0, (co2Gas - co2Hp) / 1000);
      setOut('hp-spend', fmt(spend));
      setOut('hp-gas', fmt(gasCost)); setOut('hp-hp', fmt(hpCost)); setOut('hp-hpsolar', fmt(hpSolarCost));
      setOut('hp-co2', co2SavedT.toFixed(1));
      setBar('hp-gas', gasCost / maxBar); setBar('hp-hp', hpCost / maxBar); setBar('hp-hpsolar', hpSolarCost / maxBar);
    },
    ev: function (miles) {
      var kwh = miles / 3.5, homeCost = kwh * 0.085, publicCost = kwh * 0.55, petrolCost = miles * 0.147, solarCost = homeCost * 0.45;
      var maxBar = Math.max(petrolCost, publicCost, homeCost, 1);
      setOut('ev-miles', miles.toLocaleString('en-GB'));
      setOut('ev-petrol', fmt(petrolCost)); setOut('ev-public', fmt(publicCost));
      setOut('ev-home', fmt(homeCost)); setOut('ev-solar', fmt(solarCost));
      setOut('ev-save', fmt(petrolCost - homeCost));
      setBar('ev-petrol', petrolCost / maxBar); setBar('ev-public', publicCost / maxBar); setBar('ev-home', homeCost / maxBar);
    }
  };
  function setBar(key, frac) {
    $$('[data-js-bar="' + key + '"]').forEach(function (e) { e.style.width = Math.round(frac * 100) + '%'; });
  }
  function initCalc() {
    $$('[data-js="calc"]').forEach(function (input) {
      var kind = input.getAttribute('data-calc');
      var fn = CALC[kind]; if (!fn) return;
      var run = function () { fn(parseInt(input.value, 10)); };
      input.addEventListener('input', run);
      run();
    });
  }

  /* ---------- Savings home selector ---------- */
  var HOMES = [
    { kw: '3.6 kW', cost: 6900 },
    { kw: '5.3 kW', cost: 9400 },
    { kw: '7.5 kW', cost: 12900 }
  ];
  function initHomeSelector() {
    var tiles = $$('[data-js="home-opt"]');
    if (!tiles.length) return;
    function select(idx) {
      tiles.forEach(function (t, i) {
        var sel = i === idx;
        t.style.background = sel ? '#FFF4F2' : '#FBFAF8';
        t.style.borderColor = sel ? '#F60F00' : 'rgba(27,33,53,0.12)';
        var kw = t.querySelector('[data-js="home-kw"]');
        if (kw) kw.style.color = sel ? '#F60F00' : '#7C8493';
      });
      setOut('fin-kw', HOMES[idx].kw);
      setOut('fin-fromMonthly', fmt(HOMES[idx].cost / 300));
    }
    tiles.forEach(function (t, i) { t.addEventListener('click', function () { select(i); }); });
    select(1); // default medium
  }

  /* ---------- Forms: front-end success state ---------- */
  function initForms() {
    $$('form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.checkValidity && !form.checkValidity()) { form.reportValidity(); return; }
        var note = form.querySelector('[data-js="form-success"]');
        if (!note) {
          note = document.createElement('div');
          note.setAttribute('data-js', 'form-success');
          note.style.cssText = 'margin-top:12px;font-size:14px;font-weight:600;color:#157A3E';
          form.appendChild(note);
        }
        note.textContent = '✓ Thanks — a Spark expert will be in touch shortly.';
        $$('input, textarea', form).forEach(function (i) { if (i.type !== 'hidden') i.value = ''; });
      });
    });
  }

  function init() {
    initFaq(); initChat(); initChart(); initCalc(); initHomeSelector(); initForms();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
