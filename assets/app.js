(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const body = document.body;

  // ---------- 深浅色 ----------
  $('.theme-toggle')?.addEventListener('click', () => {
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('bn-theme', next); } catch (e) {}
  });

  // ---------- 阅读进度、回到顶部、目录跟随 ----------
  const bar = $('.progress span');
  const toTop = $('.to-top');
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const heads = $$('.prose h2[id], .prose h3[id], .prose h4[id]');
  const tocItems = new Map($$('.toc li[data-id]').map((li) => [li.dataset.id, li]));
  const sidebar = $('.sidebar');
  let tops = [];
  const measure = () => { tops = heads.map((h) => h.getBoundingClientRect().top + scrollY); };
  let current = null;

  function setActive(id) {
    if (id === current) return;
    current = id;
    $$('.toc li.active, .toc li.on-path').forEach((li) => li.classList.remove('active', 'on-path'));
    const li = id && tocItems.get(id);
    if (!li) return;
    li.classList.add('active');
    for (let p = li; p; p = p.parentElement.closest('li')) p.classList.add('on-path');
    $$('.toc li.collapsible').forEach((c) => {
      if (!c.classList.contains('pinned')) c.classList.toggle('open', c.classList.contains('on-path'));
    });
    const a = li.querySelector(':scope > .toc-row a');
    if (sidebar && a && getComputedStyle(sidebar).position === 'sticky') {
      const r = a.getBoundingClientRect(), sr = sidebar.getBoundingClientRect();
      if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) sidebar.scrollTop += r.top - sr.top - sr.height / 3;
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const h = root;
      const max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
      toTop?.classList.toggle('show', h.scrollTop > 900);
      if (!heads.length) return;
      const y = scrollY + Math.min(innerHeight * 0.3, 260);
      let lo = 0, hi = tops.length - 1, idx = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; if (tops[mid] <= y) { idx = mid; lo = mid + 1; } else hi = mid - 1; }
      setActive(idx >= 0 ? heads[idx].id : heads[0].id);
    });
  }
  measure();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); onScroll(); });
  onScroll();

  $$('.toc-caret').forEach((b) => b.addEventListener('click', () => {
    const li = b.closest('li');
    li.classList.toggle('open');
    li.classList.add('pinned');
  }));

  // ---------- 窄屏目录抽屉 ----------
  const closeToc = () => body.classList.remove('toc-open');
  $('.toc-fab')?.addEventListener('click', () => {
    body.classList.add('toc-open');
    const a = $('.toc li.active > .toc-row a');
    if (a) a.scrollIntoView({ block: 'center' });
  });
  $('.sidebar-close')?.addEventListener('click', closeToc);
  $('.sidebar-scrim')?.addEventListener('click', closeToc);
  $$('.toc a').forEach((a) => a.addEventListener('click', closeToc));

  // ---------- 搜索 ----------
  const modal = $('.search');
  const input = $('.search input');
  const list = $('.search-results');
  const meta = $('.search-meta');
  let data = null, loading = null, sel = -1, results = [];
  const load = () => (loading ||= fetch('search.json').then((r) => r.json()).then((d) => (data = d)).catch(() => {
    meta.textContent = '搜索索引加载失败，请刷新页面重试。';
  }));
  const escH = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function openSearch() {
    modal.hidden = false;
    body.style.overflow = 'hidden';
    input.focus();
    input.select();
    load().then(() => input.value && run());
  }
  function closeSearch() {
    modal.hidden = true;
    body.style.overflow = '';
  }
  $$('.search-open').forEach((b) => b.addEventListener('click', openSearch));
  $('.search-close')?.addEventListener('click', closeSearch);
  $('.search-backdrop')?.addEventListener('click', closeSearch);
  addEventListener('keydown', (e) => {
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
    else if (e.key === '/' && modal.hidden && !/input|textarea/i.test(document.activeElement?.tagName)) { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape' && !modal.hidden) closeSearch();
  });

  const weight = { notes: 3, advice: 3, summary: 2, day1: 1, day2: 1 };
  function run() {
    if (!data) return;
    const q = input.value.trim();
    sel = -1;
    if (!q) { list.innerHTML = ''; meta.textContent = ''; return; }
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    results = [];
    for (const s of data.s) {
      const t = s.t.toLowerCase(), x = s.x.toLowerCase();
      let score = 0, ok = true;
      for (const term of terms) {
        const inT = t.includes(term), inX = x.includes(term);
        if (!inT && !inX) { ok = false; break; }
        if (inT) score += 12;
        if (inX) score += Math.min(6, x.split(term).length - 1);
      }
      if (ok) results.push({ s, score: score * (weight[s.p] || 1) });
    }
    results.sort((a, b) => b.score - a.score);
    const total = results.length;
    results = results.slice(0, 60);
    meta.textContent = total ? `找到 ${total} 处${total > 60 ? '，显示前 60 处' : ''}　·　↑↓ 选择，Enter 打开` : '';
    if (!total) { list.innerHTML = `<li class="search-empty">没有找到"${escH(q)}"。换个说法试试，比如"胃酸"而不是"胃酸不足怎么办"。</li>`; return; }
    const re = new RegExp(`(${terms.map(reEsc).join('|')})`, 'gi');
    const hl = (s) => escH(s).replace(re, '<mark>$1</mark>');
    list.innerHTML = results.map(({ s }) => {
      const x = s.x, i = Math.max(0, x.toLowerCase().indexOf(terms[0]));
      const start = Math.max(0, i - 36);
      const snip = (start > 0 ? '…' : '') + x.slice(start, i + 90) + (i + 90 < x.length ? '…' : '');
      const href = `${s.p}.html?q=${encodeURIComponent(q)}${s.id ? '#' + s.id : ''}`;
      return `<li><a href="${href}"><span class="sr-top"><span class="sr-page">${escH(data.pages[s.p])}</span><span class="sr-title">${hl(s.t)}</span></span>${s.c ? `<span class="sr-path">${escH(s.c)}</span>` : ''}<span class="sr-snip">${hl(snip)}</span></a></li>`;
    }).join('');
  }
  let timer;
  input?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  input?.addEventListener('keydown', (e) => {
    const items = $$('li', list).filter((li) => li.querySelector('a'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('sel', i === sel));
      items[sel].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const a = (items[sel] || items[0])?.querySelector('a');
      if (a) location.href = a.href;
    }
  });

  // ---------- 从搜索跳转过来：高亮本节里的关键词 ----------
  function highlightFromQuery() {
    const q = new URLSearchParams(location.search).get('q');
    if (!q || !location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    const level = Number(target.tagName[1]) || 6;
    const nodes = [target];
    for (let el = target.nextElementSibling; el; el = el.nextElementSibling) {
      if (/^H[2-4]$/.test(el.tagName) && Number(el.tagName[1]) <= level) break;
      nodes.push(el);
    }
    const terms = q.split(/\s+/).filter(Boolean);
    const re = new RegExp(`(${terms.map(reEsc).join('|')})`, 'gi');
    const has = new RegExp(terms.map(reEsc).join('|'), 'i');
    let first = null;
    for (const n of nodes) {
      const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) if (has.test(walker.currentNode.data)) texts.push(walker.currentNode);
      for (const t of texts) {
        const span = document.createElement('span');
        span.innerHTML = escH(t.data).replace(re, '<mark class="hit">$1</mark>');
        t.replaceWith(...span.childNodes);
      }
      first ||= n.querySelector?.('.hit');
    }
    if (first) setTimeout(() => first.scrollIntoView({ block: 'center' }), 60);
  }
  highlightFromQuery();

  // ---------- 首页：显示 PDF 大小 ----------
  $$('[data-pdf]').forEach((el) => {
    fetch('pdf/' + el.dataset.pdf, { method: 'HEAD' }).then((r) => {
      const n = Number(r.headers.get('content-length'));
      if (n) el.textContent = (n / 1048576).toFixed(1) + ' MB';
    }).catch(() => {});
  });
})();
