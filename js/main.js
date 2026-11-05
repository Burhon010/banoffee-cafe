(function () {
  "use strict";

  var menu = window.BANOFFEE_MENU || [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var body = document.body;
  var $ = function (s, c) { return (c || document).querySelector(s); };

  var flat = [];
  menu.forEach(function (cat) {
    cat.items.forEach(function (it) { flat.push({ name: it.name, desc: it.desc || "", price: it.price, img: it.img, cat: cat.title }); });
  });

  function leafPath(bx, by, ang, len, w) {
    var tx = bx + Math.cos(ang) * len, ty = by + Math.sin(ang) * len;
    var nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
    var mx = bx + Math.cos(ang) * len * 0.45, my = by + Math.sin(ang) * len * 0.45;
    return "M" + bx.toFixed(1) + " " + by.toFixed(1) +
      "Q" + (mx + nx).toFixed(1) + " " + (my + ny).toFixed(1) + " " + tx.toFixed(1) + " " + ty.toFixed(1) +
      "Q" + (mx - nx).toFixed(1) + " " + (my - ny).toFixed(1) + " " + bx.toFixed(1) + " " + by.toFixed(1) + "Z";
  }

  function frond(x, y, ang, len, n, bend) {
    var d = "", px = x, py = y, a = ang;
    var step = len / n;
    d += "M" + x + " " + y;
    var stem = "M" + x + " " + y;
    for (var i = 1; i <= n; i++) {
      a += bend;
      px += Math.cos(a) * step; py += Math.sin(a) * step;
      stem += "L" + px.toFixed(1) + " " + py.toFixed(1);
      var t = i / n;
      var L = len * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(t * 1.05, 1)), 0.7) + 20;
      var W = L * 0.16;
      d += leafPath(px, py, a - 0.95 + t * 0.35, L, W);
      d += leafPath(px, py, a + 0.95 - t * 0.35, L, W);
    }
    return { leaves: d.replace(/^M[^Q]*?(?=M)/, ""), stem: stem };
  }

  function buildLeaves(svg, set, color) {
    color = color || "#26150b";
    if (!svg) return;
    var html = "";
    set.forEach(function (f) {
      var r = frond(f[0], f[1], f[2], f[3], f[4], f[5]);
      html += '<path d="' + r.leaves + '" fill="' + color + '"/>';
      html += '<path d="' + r.stem + '" fill="none" stroke="' + color + '" stroke-width="7" stroke-linecap="round"/>';
    });
    svg.innerHTML = html;
  }

  buildLeaves($("#leaves"), [
    [-60, -40, 0.75, 620, 16, 0.025],
    [1080, -60, 2.2, 560, 15, -0.03],
    [1060, 640, 3.4, 480, 13, 0.035],
    [-80, 760, -0.35, 420, 12, -0.02]
  ]);
  buildLeaves($("#leaves2"), [
    [1080, -40, 2.3, 600, 16, -0.025],
    [-60, 820, -0.5, 460, 12, 0.03]
  ], "#f7f1e9");

  var marquee = $("#marquee");
  if (marquee) {
    var names = flat.map(function (d) { return d.name.replace(/^Салат\s/, ""); });
    var chunk = names.map(function (n) { return "<span>" + n + "</span>"; }).join("");
    marquee.innerHTML = chunk + chunk;
  }

  var grid = $("#menuGrid");
  var tabs = $("#tabs");
  var pill = $("#tabsPill");
  var zoomIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v5M8.5 11h5"/></svg>';
  var idx = 0;

  menu.forEach(function (cat) {
    var sec = document.createElement("section");
    sec.className = "cat";
    sec.id = "cat-" + cat.id;
    sec.setAttribute("aria-labelledby", "t-" + cat.id);
    var cards = cat.items.map(function (it, i) {
      var html =
        '<button class="card reveal" style="--d:' + ((i % 4) * 0.08).toFixed(2) + 's" data-index="' + idx + '" aria-label="' + it.name + ', ' + it.price + ' сомони">' +
          '<span class="card__media"><img src="assets/menu/' + it.img + '.webp" alt="' + it.name + '"' + (it.pos ? ' style="object-position:' + it.pos + '"' : '') + ' loading="lazy" decoding="async" width="820" height="1025"><span class="card__zoom">' + zoomIcon + "</span></span>" +
          '<span class="card__body"><span class="card__text"><span class="card__name">' + it.name + '</span>' + (it.desc ? '<span class="card__desc">' + it.desc + '</span>' : '') + '</span><span class="card__price">' + it.price + " <small>смн</small></span></span>" +
        "</button>";
      idx++;
      return html;
    }).join("");
    sec.innerHTML =
      '<div class="cat__head reveal"><h3 class="cat__title" id="t-' + cat.id + '">' + cat.title + '</h3><span class="cat__count">' + String(cat.items.length).padStart(2, "0") + "</span></div>" +
      (cat.note ? '<p class="cat__note reveal"><i></i>' + cat.note + '</p>' : '') +
      '<div class="cards">' + cards + "</div>";
    grid.appendChild(sec);

    var tab = document.createElement("button");
    tab.className = "tab";
    tab.type = "button";
    tab.setAttribute("role", "tab");
    tab.dataset.target = sec.id;
    tab.textContent = cat.title;
    tabs.appendChild(tab);
  });

  grid.querySelectorAll("img").forEach(function (img) {
    if (img.complete) img.classList.add("is-loaded");
    else img.addEventListener("load", function () { img.classList.add("is-loaded"); }, { once: true });
  });

  var tabEls = Array.prototype.slice.call(tabs.querySelectorAll(".tab"));
  var catEls = Array.prototype.slice.call(grid.querySelectorAll(".cat"));
  var activeTab = null;

  function setActive(i, force) {
    var t = tabEls[i];
    if (!t || (t === activeTab && !force)) return;
    tabEls.forEach(function (el) {
      var on = el === t;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
    });
    activeTab = t;
    pill.style.width = t.offsetWidth + "px";
    pill.style.transform = "translateX(" + t.offsetLeft + "px)";
    var target = t.offsetLeft - (tabs.clientWidth - t.offsetWidth) / 2;
    tabs.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? "auto" : "smooth" });
  }

  var scrollLock = false, lockTimer = 0, lockMax = 0;
  function releaseLock() {
    clearTimeout(lockTimer); clearTimeout(lockMax);
    if (!scrollLock) return;
    scrollLock = false;
    lastY = window.scrollY;
    requestTick();
  }
  function goToCategory(i) {
    var el = catEls[i];
    if (!el) return;
    scrollLock = true;
    header.classList.add("is-hidden");
    body.classList.remove("header-shown");
    setActive(i, true);
    var y = el.getBoundingClientRect().top + window.scrollY - tabsWrap.offsetHeight - 16;
    if (Math.abs(y - window.scrollY) < 2) { releaseLock(); return; }
    window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    clearTimeout(lockMax);
    lockMax = setTimeout(releaseLock, 2500);
  }
  window.addEventListener("scroll", function () {
    if (!scrollLock) return;
    clearTimeout(lockTimer);
    lockTimer = setTimeout(releaseLock, 160);
  }, { passive: true });

  tabEls.forEach(function (t, i) {
    t.addEventListener("click", function () { goToCategory(i); });
  });

  var tabsBox = $("#tabsBox");
  function updateHints() {
    var max = tabs.scrollWidth - tabs.clientWidth;
    tabsBox.classList.toggle("can-left", tabs.scrollLeft > 6);
    tabsBox.classList.toggle("can-right", max > 6 && tabs.scrollLeft < max - 6);
  }
  tabs.addEventListener("scroll", updateHints, { passive: true });
  window.addEventListener("resize", updateHints);
  $("#hintRight").addEventListener("click", function () { tabs.scrollBy({ left: tabs.clientWidth * 0.6, behavior: "smooth" }); });
  $("#hintLeft").addEventListener("click", function () { tabs.scrollBy({ left: -tabs.clientWidth * 0.6, behavior: "smooth" }); });
  updateHints();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateHints);
  tabs.addEventListener("keydown", function (e) {
    var i = tabEls.indexOf(activeTab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      var n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabEls.length) % tabEls.length;
      goToCategory(n);
      tabEls[n].focus({ preventScroll: true });
    }
  });

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        revealIO.unobserve(e.target);
        if (e.target.classList.contains("stat")) countUp(e.target.querySelector("[data-count]"));
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { revealIO.observe(el); });

  function countUp(el) {
    if (!el || reduceMotion) return;
    var end = +el.dataset.count, start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  var status = $("#status");
  function updateStatus() {
    var now = new Date();
    var h = (now.getUTCHours() + 5) % 24;
    var open = h >= 8;
    status.classList.toggle("is-closed", !open);
    status.querySelector("b").textContent = open ? "Открыто" : "Закрыто";
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  var header = $("#header");
  var tabsWrap = $("#tabsWrap");
  var fab = $(".call-fab");
  var hero = $("#hero");
  var heroVisual = $("#heroVisual");
  var depthEls = heroVisual ? Array.prototype.slice.call(heroVisual.querySelectorAll("[data-depth]")) : [];
  var aboutImg = $(".about__arch img");
  var lastY = window.scrollY;
  var mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var heroH = hero.offsetHeight;
    header.classList.toggle("is-solid", y > 30);
    if (!scrollLock) {
      var hide = y > heroH * 0.6 && y > lastY && !body.classList.contains("nav-open");
      if (Math.abs(y - lastY) > 4) {
        header.classList.toggle("is-hidden", hide);
        body.classList.toggle("header-shown", !hide);
      }
      lastY = y;
    }
    fab.classList.toggle("is-visible", y > heroH * 0.7);

    var stuckTop = body.classList.contains("header-shown") ? header.offsetHeight : 0;
    tabsWrap.classList.toggle("is-stuck", tabsWrap.getBoundingClientRect().top <= stuckTop + 1 && grid.getBoundingClientRect().bottom > 120);

    if (!scrollLock) {
      var line = tabsWrap.getBoundingClientRect().bottom + 40;
      var current = 0;
      for (var i = 0; i < catEls.length; i++) {
        if (catEls[i].getBoundingClientRect().top <= line) current = i;
      }
      setActive(current);
    }

    if (!reduceMotion) {
      if (y < heroH) {
        depthEls.forEach(function (el) {
          var d = parseFloat(el.dataset.depth);
          el.style.transform = "translate3d(" + (curX * d * 60).toFixed(1) + "px," + (y * d * -1.2 + curY * d * 60).toFixed(1) + "px,0)";
        });
      }
      if (aboutImg) {
        var r = aboutImg.parentNode.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) {
          var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          aboutImg.style.transform = "scale(1.12) translate3d(0," + (p * -40).toFixed(1) + "px,0)";
        }
      }
    }
    ticking = false;
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", function () { activeTab = null; requestTick(); });
  body.classList.add("header-shown");

  if (finePointer && !reduceMotion && heroVisual) {
    hero.addEventListener("mousemove", function (e) {
      mouseX = e.clientX / innerWidth - 0.5;
      mouseY = e.clientY / innerHeight - 0.5;
    });
    (function follow() {
      curX += (mouseX - curX) * 0.06;
      curY += (mouseY - curY) * 0.06;
      if (window.scrollY < hero.offsetHeight && (Math.abs(mouseX - curX) > 0.0005 || Math.abs(mouseY - curY) > 0.0005)) requestTick();
      requestAnimationFrame(follow);
    })();
  }

  var burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = body.classList.toggle("nav-open");
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    header.classList.remove("is-hidden");
  });
  document.querySelectorAll("#mobileNav a").forEach(function (a) {
    a.addEventListener("click", function () {
      body.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbName = $("#lbName"), lbPrice = $("#lbPrice"), lbCat = $("#lbCat");
  var lbIndex = 0, lastFocus = null;

  function showItem(i, animate) {
    lbIndex = (i + flat.length) % flat.length;
    var d = flat[lbIndex];
    lbImg.src = "assets/menu/" + d.img + ".webp";
    lbImg.alt = d.name;
    lbName.textContent = d.desc ? d.name + " · " + d.desc : d.name;
    lbPrice.textContent = d.price + " сомони";
    lbCat.textContent = d.cat;
    if (animate) { lbImg.classList.remove("is-swap"); void lbImg.offsetWidth; lbImg.classList.add("is-swap"); }
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showItem(i, false);
    lb.hidden = false;
    body.classList.add("lb-open");
    requestAnimationFrame(function () { lb.classList.add("is-open"); });
    $("#lbClose").focus();
  }
  function closeLb() {
    lb.classList.remove("is-open");
    body.classList.remove("lb-open");
    setTimeout(function () { lb.hidden = true; }, 400);
    if (lastFocus) lastFocus.focus();
  }
  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (card) openLb(+card.dataset.index);
  });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { showItem(lbIndex - 1, true); });
  $("#lbNext").addEventListener("click", function () { showItem(lbIndex + 1, true); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) {
      if (e.key === "Escape" && body.classList.contains("nav-open")) burger.click();
      return;
    }
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showItem(lbIndex - 1, true);
    if (e.key === "ArrowRight") showItem(lbIndex + 1, true);
  });
  var sx = 0, sy = 0;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showItem(lbIndex + (dx < 0 ? 1 : -1), true);
    else if (dy > 90) closeLb();
  }, { passive: true });

  $("#year").textContent = new Date().getFullYear();

  var pre = $("#preloader");
  var started = performance.now();
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    var wait = Math.max(0, (reduceMotion ? 0 : 1300) - (performance.now() - started));
    setTimeout(function () {
      pre.classList.add("is-done");
      body.classList.remove("is-loading");
      setTimeout(function () { body.classList.add("is-ready"); }, 250);
      setTimeout(function () { pre.remove(); }, 1400);
      onScroll();
    }, wait);
  }
  if (document.readyState === "complete") finish();
  else window.addEventListener("load", finish);
  setTimeout(finish, 3500);
})();
