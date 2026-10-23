(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Eye-chart hero: "Which is clearer, 1 or 2?" ---------- */
  var chart = document.getElementById('chart');
  if (chart) {
    var prompt = document.getElementById('lens-prompt');
    var lenses = chart.querySelectorAll('.lens');
    var setLens = function (n, flash) {
      chart.setAttribute('data-lens', String(n));
      lenses.forEach(function (b) {
        var on = b.getAttribute('data-lens') === String(n);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on && flash) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); }
      });
      if (n === 1) prompt.textContent = 'Lens 1. Better, but not quite.';
      if (n === 2) prompt.textContent = 'Lens 2. Clear. Which is clearer?';
    };
    lenses.forEach(function (b) {
      b.addEventListener('click', function () {
        userTouched = true;
        setLens(Number(b.getAttribute('data-lens')), true);
      });
    });
    var userTouched = false;
    if (reduce) {
      setLens(2, false);
      prompt.textContent = 'Which is clearer?';
    } else {
      setTimeout(function () { if (!userTouched) setLens(1, true); }, 900);
      setTimeout(function () { if (!userTouched) setLens(2, true); }, 2100);
      setTimeout(function () { if (!userTouched) prompt.textContent = 'Which is clearer? Tap 1 or 2.'; }, 3600);
    }
  }

  /* ---------- Self-check ---------- */
  var signs = document.querySelectorAll('.signs input');
  if (signs.length) {
    var fill = document.getElementById('verdict-fill');
    var text = document.getElementById('verdict-text');
    var cta = document.getElementById('verdict-cta');
    var box = document.querySelector('.verdict');
    var update = function () {
      var n = 0;
      signs.forEach(function (s) { if (s.checked) n++; });
      fill.style.width = (n === 0 ? 0 : Math.min(100, 25 + n * 15)) + '%';
      box.classList.toggle('warn', n >= 2);
      if (n === 0) { text.textContent = 'Nothing ticked yet. A yearly check is still a good habit.'; cta.textContent = 'Book an eye check'; }
      else if (n === 1) { text.textContent = 'One sign. Worth a quick check to rule things out.'; cta.textContent = 'Book an eye check'; }
      else if (n <= 3) { text.textContent = n + ' signs. Your eyes are asking for a check-up soon.'; cta.textContent = 'Book my eye check'; }
      else { text.textContent = n + ' signs. Please come in soon, your prescription has likely changed.'; cta.textContent = 'Book my eye check now'; }
    };
    signs.forEach(function (s) { s.addEventListener('change', update); });
  }

  /* ---------- Booking request ---------- */
  var form = document.getElementById('book-form');
  if (form) {
    var dateIn = document.getElementById('f-date');
    var today = new Date();
    var iso = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
    dateIn.min = iso(today);
    var tomorrow = new Date(today.getTime() + 86400000);
    dateIn.value = iso(tomorrow);

    var check = function (id, ok) {
      var f = document.getElementById(id).closest('.field');
      f.classList.toggle('bad', !ok);
      document.getElementById(id).setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('f-name').value.trim();
      var phone = document.getElementById('f-phone').value.replace(/[\s-]/g, '');
      var date = dateIn.value;
      var ok = [
        check('f-name', name.length > 1),
        check('f-phone', /^(09\d{9}|\+639\d{9})$/.test(phone)),
        check('f-date', !!date && date >= dateIn.min)
      ];
      if (ok.indexOf(false) !== -1) {
        var firstBad = form.querySelector('.field.bad input');
        if (firstBad) firstBad.focus();
        return;
      }
      var who = form.querySelector('input[name="who"]:checked').value.toLowerCase();
      var time = document.getElementById('f-time').value.toLowerCase();
      var d = new Date(date + 'T00:00:00');
      var day = d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
      document.getElementById('sent-text').textContent =
        'Thanks, ' + name.split(' ')[0] + '. We have your request for an ' + who + ' eye check on ' + day +
        (time === 'anytime' ? '' : ' in the ' + time) + '. We’ll text ' + phone + ' to confirm the time.';
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
    });
    form.querySelectorAll('input').forEach(function (i) {
      i.addEventListener('input', function () { var f = i.closest('.field'); if (f) f.classList.remove('bad'); });
    });
    document.getElementById('sent-again').addEventListener('click', function () {
      form.reset();
      dateIn.value = iso(tomorrow);
      document.getElementById('sent').hidden = true;
      document.getElementById('f-name').focus();
    });
  }

  /* ---------- Scripted chat (demo) ---------- */
  var openBtn = document.getElementById('chat-open');
  var chat = document.getElementById('chat');
  if (openBtn && chat) {
    var log = document.getElementById('chat-log');
    var input = document.getElementById('chat-in');
    var started = false;
    var add = function (who, html) {
      var m = document.createElement('div');
      m.className = 'msg ' + who;
      if (who === 'me') m.textContent = html; else m.innerHTML = html;
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    };
    var botSay = function (html) {
      var t = document.createElement('div');
      t.className = 'msg bot typing';
      t.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(t);
      log.scrollTop = log.scrollHeight;
      setTimeout(function () { t.remove(); add('bot', html); }, reduce ? 50 : 700 + Math.min(900, html.length * 6));
    };
    var answers = [
      [/where|address|location|located|saan|move|moved|novaliches|robinsons|direction/i,
        'We’re now at <b>19B Pontiac St., West Fairview, Quezon City</b>, near Panko Bakery and Cafe. <a href="#visit">See the map</a>.'],
      [/price|how much|magkano|cost|fee|rate/i,
        'Prices depend on the check and the lenses you choose. Send a <a href="#book">booking request</a> or call <a href="tel:+639338517187">0933 851 7187</a> and we’ll give you an exact quote.'],
      [/open|hours|today|bukas|time|close/i,
        'Our team confirms today’s hours by phone at <a href="tel:+639338517187">0933 851 7187</a>. You can also <a href="#book">send a request</a> now and we’ll text you a time.'],
      [/child|kid|anak|son|daughter|school/i,
        'Yes, we check kids’ eyes. <a href="#book">Book here</a> and choose “Child” so we can prepare.'],
      [/book|appoint|schedule|sched|reserve/i,
        'You can book in under a minute. <a href="#book">Open the booking form</a>. Walk-ins are welcome too.'],
      [/contact|lens|contacts/i,
        'Ask us about contact lenses during your eye check, and we’ll walk you through the options for your prescription.'],
      [/repair|broken|sira|hinge|nose ?pad|adjust/i,
        'Bring your glasses in. Most adjustments and nose pad replacements are done while you wait.'],
      [/sun|shade/i,
        'We carry sunglasses, plain or with your prescription.'],
      [/hi|hello|hey|good (morning|afternoon|evening)|kumusta/i,
        'Hi! Ask me about our new location, booking, prices, or kids’ eye checks.']
    ];
    var reply = function (q) {
      for (var i = 0; i < answers.length; i++) if (answers[i][0].test(q)) return answers[i][1];
      return 'Good question. I’ll pass it to our team. For a quick answer, call <a href="tel:+639338517187">0933 851 7187</a> or <a href="https://m.me/EDOClinic" rel="noopener">message us on Messenger</a>.';
    };
    var ask = function (q) {
      if (!q) return;
      add('me', q);
      botSay(reply(q));
    };
    var openChat = function () {
      chat.hidden = false;
      openBtn.hidden = true;
      openBtn.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; botSay('Hi! This is Eye Design Optical Clinic. We’ve moved to West Fairview. How can we help?'); }
      setTimeout(function () { input.focus(); }, 50);
    };
    var closeChat = function () {
      chat.hidden = true;
      openBtn.hidden = false;
      openBtn.setAttribute('aria-expanded', 'false');
      openBtn.focus();
    };
    openBtn.addEventListener('click', openChat);
    document.getElementById('chat-close').addEventListener('click', closeChat);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !chat.hidden) closeChat(); });
    document.getElementById('chat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      input.value = '';
      ask(q);
    });
    document.querySelectorAll('#chat-quick button').forEach(function (b) {
      b.addEventListener('click', function () { ask(b.textContent); });
    });
    log.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (a && window.innerWidth < 700) closeChat();
    });
  }
})();
