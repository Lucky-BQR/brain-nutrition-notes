import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as F from './figures.mjs';
import { sanitize, LEFTOVER_NAMES } from './sanitize.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s);

const PAGES = [
  {
    slug: 'notes', src: 'notes.md', title: '课程笔记', nav: '课程笔记',
    desc: '按主题整理的 32 章知识点：机制、判断方法、查体手法、补剂方案，关键处标了录音出处。',
    levels: [2, 3, 4], collapse: 1, printDepth: 2,
    pdf: 'notes.pdf', pdfName: '脑营养学-课程笔记.pdf',
  },
  {
    slug: 'advice', src: 'advice.md', title: '实用建议清单', nav: '实用建议',
    desc: '补剂速查表、按问题查、饮食与生活方式、自查与检测、注意事项与禁忌，以及需要对照课件核实的内容。',
    levels: [2, 3], collapse: -1, printDepth: 2,
    pdf: 'advice.pdf', pdfName: '脑营养学-实用建议清单.pdf',
  },
  {
    slug: 'summary', src: 'summary.md', title: '每段录音摘要', nav: '录音摘要',
    desc: '6 段录音各一张"时间—内容"表和几条要点，方便快速定位、回听。',
    levels: [2], collapse: -1, printDepth: 1,
    pdf: 'summary.pdf', pdfName: '脑营养学-每段录音摘要.pdf',
  },
  {
    slug: 'day1', src: 'day1.md', title: '可读版文字稿 · 第一天', nav: '文字稿 · 第一天',
    desc: '11 月 20 日全天三段录音的整理版全文：去掉口头禅、理顺句子，内容完整保留。',
    levels: [2, 3], collapse: 0, printDepth: 1,
    pdf: 'transcript-day1.pdf', pdfName: '脑营养学-文字稿-第一天.pdf',
  },
  {
    slug: 'day2', src: 'day2.md', title: '可读版文字稿 · 第二天', nav: '文字稿 · 第二天',
    desc: '11 月 21 日全天三段录音的整理版全文：去掉口头禅、理顺句子，内容完整保留。',
    levels: [2, 3], collapse: 0, printDepth: 1,
    pdf: 'transcript-day2.pdf', pdfName: '脑营养学-文字稿-第二天.pdf',
  },
];

// ---------- 工具 ----------
const strip = (html) =>
  html
    .replace(/<figure[\s\S]*?<\/figure>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cjkCount = (s) => (s.match(/[一-鿿]/g) || []).length;
const wan = (n) => (n >= 10000 ? `约 ${(n / 10000).toFixed(1)} 万字` : `约 ${Math.round(n / 100) * 100} 字`);

// 正文里的标记：录音出处、存疑、⚠
const T = String.raw`\d{1,2}:\d{2}(?::\d{2})?`;
const CITE = new RegExp(String.raw`(?<!\w)D[12]-[1-3] ${T}(?:[–～-]${T})?(?:[、，,] ?${T}(?:[–～-]${T})?)*`, 'g');
function inline(html) {
  html = html.replace(CITE, (m) => `<span class="cite" title="录音出处：${m.startsWith('D1') ? '第一天' : '第二天'}第 ${m[3]} 段 ${m.slice(5)}">${m}</span>`);
  // 〔…〕里只有出处时去掉括号
  html = html.replace(/〔((?:\s*<span class="cite"[^>]*>[^<]*<\/span>\s*[、，；]?)+)〕/g, '$1');
  html = html.replace(/（((?:\s*<span class="cite"[^>]*>[^<]*<\/span>\s*[、，；;]?\s*)+)）/g, '<span class="cites">$1</span>');
  html = html.replace(/〔(存疑[^〕]*|[^〕]*存疑)〕/g, (m, inner) => `<span class="doubt" title="语音转写存疑，请对照课件或回听">${inner}</span>`);
  html = html.replace(/〔([^〕<]{1,80})〕/g, '<span class="aside">〔$1〕</span>');
  html = html.replace(/⚠/g, '<span class="warn-ic" aria-label="注意">⚠</span>');
  return html;
}

function blocks(html) {
  return html
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>')
    .replace(/<blockquote>/g, '<blockquote class="callout">')
    .replace(/<p><strong>(学员问|学员补充|学员)([^<]*)<\/strong>/g, '<p class="qa q"><strong>$1$2</strong>')
    .replace(/<p><strong>(钱老师)：<\/strong>/g, '<p class="qa a"><strong>$1：</strong>');
}

function tocLabel(text) {
  return esc(text).replace(/（(约 )?(\d{2}:\d{2}:\d{2})）\s*$/, (m, about, t) => `<span class="toc-time">${about ? '约' : ''}${t.replace(/^00:/, '').replace(/^0/, '')}</span>`);
}

// ---------- 渲染单页 ----------
let notesChapterIds = {};

function renderPage(page) {
  let md = read(`content/${page.src}`).replace(/\r\n/g, '\n');
  md = md.replace(/^# .*\n+/, '').replace(/^(主讲：.*|<sub>.*<\/sub>)\n+/, '');
  if (page.slug === 'notes') md = md.replace(/^## 目录\n[\s\S]*?(?=\n---\n)/m, '');
  md = sanitize(md);
  // CommonMark 的强调规则遇到中文标点会失效（如 **铁（叶酸）**属于…），先自己转成 <strong>
  md = md.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

  let html = marked.parse(md, { gfm: true });
  html = blocks(html);

  // 标题编号与目录
  const heads = [];
  const counters = [];
  html = html.replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (m, lv, inner) => {
    const depth = page.levels.indexOf(Number(lv));
    if (depth < 0) return m;
    counters[depth] = (counters[depth] || 0) + 1;
    counters.length = depth + 1;
    const id = 's' + counters.join('-');
    const text = strip(inner);
    heads.push({ id, depth, text, level: Number(lv) });
    let cls = `d${depth}`;
    let label = inner;
    const ch = page.slug === 'notes' && depth === 1 ? text.match(/^(\d+)\.\s*(.*)$/) : null;
    if (ch) {
      notesChapterIds[ch[1]] = id;
      cls += ' chapter';
      label = `<span class="ch-no">${ch[1]}</span><span class="vh">. </span><span class="ch-text">${esc(ch[2])}</span>`;
    }
    return `<h${lv} id="${id}" class="${cls}">${label}<a class="anchor" href="#${id}" aria-label="本节链接">#</a></h${lv}>`;
  });

  // 插图
  if (page.slug === 'notes') {
    const link = (n) => `#${notesChapterIds[n]}`;
    let no = 0;
    const after = {
      3: () => F.visceral(++no),
      4: () => F.neuron(++no),
      5: () => F.noEffect(++no) + F.journey(link, ++no),
      8: () => F.reflux(++no) + F.acidHub(++no),
      16: () => F.leaky(++no),
      21: () => F.limbPain(++no),
      24: () => F.mcv(++no),
      28: () => F.fasting(++no),
      32: () => F.picks(++no),
    };
    for (const [ch, make] of Object.entries(after)) {
      const id = notesChapterIds[ch];
      html = html.replace(new RegExp(`(<h3 id="${id}"[\\s\\S]*?</h3>)`), `$1\n${make()}`);
    }
  }

  html = inline(html);

  // 搜索索引：每个标题到下一个标题之间为一节
  const sections = [];
  const re = /<h([2-4]) id="(s[\d-]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const marks = [...html.matchAll(re)];
  const intro = strip(html.slice(0, marks[0]?.index ?? html.length));
  if (intro) sections.push({ p: page.slug, id: '', t: page.title, c: '', x: intro });
  const trail = [];
  marks.forEach((m, i) => {
    const h = heads.find((x) => x.id === m[2]);
    trail[h.depth] = h.text;
    trail.length = h.depth + 1;
    const end = i + 1 < marks.length ? marks[i + 1].index : html.length;
    const body = strip(html.slice(m.index + m[0].length, end));
    sections.push({ p: page.slug, id: h.id, t: h.text, c: trail.slice(0, -1).join(' › '), x: body });
  });

  // 侧边栏目录
  const tree = [];
  const stack = [];
  for (const h of heads) {
    const node = { ...h, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= h.depth) stack.pop();
    (stack.length ? stack[stack.length - 1].children : tree).push(node);
    stack.push(node);
  }
  const renderTree = (nodes) =>
    `<ul>${nodes
      .map((n) => {
        const kids = n.children.length ? renderTree(n.children) : '';
        const collapsible = kids && page.collapse >= 0 && n.depth >= page.collapse;
        return `<li class="toc-d${n.depth}${kids ? ' has-kids' : ''}${collapsible ? ' collapsible' : ''}" data-id="${n.id}"><div class="toc-row">${
          collapsible ? `<button class="toc-caret" type="button" aria-label="展开或收起"></button>` : ''
        }<a href="#${n.id}">${tocLabel(n.text)}</a></div>${kids}</li>`;
      })
      .join('')}</ul>`;
  const toc = renderTree(tree);

  const printToc = `<ol class="print-toc">${heads
    .filter((h) => h.depth < page.printDepth)
    .map((h) => `<li class="ptd${h.depth}">${esc(h.text)}</li>`)
    .join('')}</ol>`;

  const words = cjkCount(strip(html));
  return { html, toc, printToc, sections, words, heads };
}

// ---------- 页面模板 ----------
const NAV = [{ slug: 'index', nav: '首页' }, ...PAGES];
const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true" class="ic-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg viewBox="0 0 24 24" aria-hidden="true" class="ic-moon"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  toc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
  pdf: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg>',
  brand: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 5c-4.4 0-8 3-8 7.2 0 1.7.6 3.2 1.6 4.4-.4 1.2-.6 2.4-.6 3.6C9 24 12 27 16 27s7-3 7-6.8c0-1.2-.2-2.4-.6-3.6 1-1.2 1.6-2.7 1.6-4.4C24 8 20.4 5 16 5z"/><path d="M16 6v20M11.5 11.5c1.8 0 3 1 4.5 2.5M20.5 11.5c-1.8 0-3 1-4.5 2.5M11 19c1.8-.3 3.4.3 5 1.8M21 19c-1.8-.3-3.4.3-5 1.8"/></svg>',
};

function shell({ slug, title, body, desc }) {
  const nav = NAV.map((p) => `<a href="${p.slug === 'index' ? './' : p.slug + '.html'}"${p.slug === slug ? ' aria-current="page"' : ''}>${p.nav}</a>`).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0f766e"/><path d="M16 7c-3.9 0-7 2.6-7 6.3 0 1.5.5 2.8 1.4 3.8-.3 1-.5 2.1-.5 3.1C9.9 23.4 12.6 26 16 26s6.1-2.6 6.1-5.8c0-1-.2-2.1-.5-3.1.9-1 1.4-2.3 1.4-3.8C23 9.6 19.9 7 16 7z" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M16 8v17" stroke="#fff" stroke-width="1.8"/></svg>')}">
<link rel="stylesheet" href="assets/style.css">
<script>try{var t=localStorage.getItem('bn-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body class="page-${slug}">
<div class="progress" aria-hidden="true"><span></span></div>
<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="./">${ICON.brand}<span>脑营养学笔记</span></a>
    <nav class="mainnav" aria-label="主导航">${nav}</nav>
    <div class="tools">
      <button class="tool search-open" type="button" aria-label="搜索">${ICON.search}<span class="tool-label">搜索</span><kbd>Ctrl K</kbd></button>
      <button class="tool theme-toggle" type="button" aria-label="切换深色/浅色">${ICON.sun}</button>
    </div>
  </div>
</header>
${body}
<div class="search" hidden>
  <div class="search-backdrop"></div>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="全站搜索">
    <div class="search-box">${ICON.search}<input type="search" placeholder="搜索全部内容，例如：胃酸、镁、脱发、断食" autocomplete="off" spellcheck="false"><button class="search-close" type="button">Esc</button></div>
    <div class="search-meta"></div>
    <ol class="search-results"></ol>
  </div>
</div>
<button class="to-top" type="button" aria-label="回到顶部">${ICON.up}</button>
<script src="assets/app.js" defer></script>
</body>
</html>
`;
}

function docPage(page, r, idx) {
  const prev = idx > 0 ? PAGES[idx - 1] : null;
  const next = idx < PAGES.length - 1 ? PAGES[idx + 1] : null;
  const body = `<div class="layout">
  <aside class="sidebar" aria-label="本页目录">
    <div class="sidebar-head"><span>本页目录</span><button class="sidebar-close" type="button" aria-label="关闭目录">×</button></div>
    <nav class="toc">${r.toc}</nav>
  </aside>
  <div class="sidebar-scrim"></div>
  <main class="content" id="main">
    <section class="print-cover">
      <p class="pc-kicker">脑营养学 · 课程整理</p>
      <h1>${esc(page.title)}</h1>
      <p class="pc-desc">${esc(page.desc)}</p>
      <p class="pc-meta">主讲：钱笛　|　2025 年 11 月 20–21 日　|　${wan(r.words)}</p>
      <p class="pc-note">整理自课堂录音（飞书妙记转写），反映的是主讲人在课上的观点和经验，不是医疗建议。标"存疑"或 ⚠ 的内容来自语音识别，使用前请对照课件或回听。</p>
      <div class="pc-toc"><p class="pc-toc-title">目录</p>${r.printToc}</div>
    </section>
    <header class="doc-hero">
      <p class="kicker">脑营养学 · 钱笛 · 2025.11.20–21</p>
      <h1>${esc(page.title)}</h1>
      <p class="doc-desc">${esc(page.desc)}</p>
      <div class="doc-meta"><span>${wan(r.words)}</span><span>约 ${Math.max(1, Math.round(r.words / 450))} 分钟读完</span><a class="pdf-link" href="pdf/${page.pdf}" download="${page.pdfName}">${ICON.pdf}下载 PDF</a></div>
    </header>
    <article class="prose">
${r.html}
    </article>
    <nav class="pager" aria-label="翻页">
      ${prev ? `<a class="pager-prev" href="${prev.slug}.html"><small>上一篇</small><span>${prev.title}</span></a>` : '<a class="pager-prev" href="./"><small>返回</small><span>首页</span></a>'}
      ${next ? `<a class="pager-next" href="${next.slug}.html"><small>下一篇</small><span>${next.title}</span></a>` : '<span></span>'}
    </nav>
    <footer class="foot">整理自 2025 年 11 月 20–21 日「脑营养学」课堂录音，仅供个人学习复习，不构成医疗建议。涉及补剂、停药或治疗的决定，请先咨询医生或药师。</footer>
  </main>
</div>
<button class="toc-fab" type="button" aria-label="打开目录">${ICON.toc}<span>目录</span></button>`;
  return shell({ slug: page.slug, title: `${page.title} · 脑营养学笔记`, desc: page.desc, body });
}

function homePage(results) {
  const notes = results.notes;
  const link = (n) => `notes.html#${notesChapterIds[n]}`;
  const supplementCount = (read('content/advice.md').match(/^### (维生素|矿物质|脂肪酸与脂类|植物提取物与抗氧化|消化与肠道|其他)\n[\s\S]*?(?=\n### |\n## )/gm) || [])
    .map((sec) => (sec.match(/^\| (?!补剂 \||---)/gm) || []).length)
    .reduce((a, b) => a + b, 0);
  const cards = PAGES.map((p) => {
    const r = results[p.slug];
    return `<a class="card" href="${p.slug}.html"><span class="card-kicker">${p.nav}</span><span class="card-title">${p.title}</span><span class="card-desc">${p.desc}</span><span class="card-meta">${wan(r.words)}${p.slug === 'notes' ? ' · 32 章' : ''}${p.slug === 'advice' ? ` · ${supplementCount} 种补剂` : ''}</span></a>`;
  }).join('');
  const pdfs = PAGES.map((p) => `<li><a href="pdf/${p.pdf}" download="${p.pdfName}">${ICON.pdf}<span>${p.title}</span></a><small data-pdf="${p.pdf}"></small></li>`).join('');
  const ideas = [
    ['营养、免疫、代谢是影响全脑的"全局因素"', '全脑普遍偏差时，先找全局原因，给足营养支持再训练。', 1, 2],
    ['补剂"没效"，先查三件事', '消化不了、吸收不了、被过度消耗。', 5],
    ['任何营养问题，先解决胃酸', '反酸多半是胃酸太少；胃酸不足会连锁影响胰酶、胆汁、矿物质和菌群。', 8],
    ['胃肠不好，常常是脑干不好', '迷走神经核在脑干；可以看小舌、查咽反射，用漱口和呼吸训练激活。', 18],
    ['先给氧气和养分，再给刺激', '神经元三要素：氧气、养分、适宜的刺激。', 4],
    ['补剂要有取舍，不要"大包围"', '把钱花在关键的几样上，先在自己身上验证。', 32],
  ];
  const body = `<main class="home" id="main">
  <section class="hero">
    <p class="kicker">两天线下课程 · 2025 年 11 月 20–21 日 · 主讲 钱笛</p>
    <h1>脑营养学</h1>
    <p class="hero-lede">从"补剂为什么没效"出发，跟着食物走一遍消化系统，再到疼痛、脑雾、贫血、脱发、免疫、断食与抗衰。这里是全部录音的完整整理。</p>
    <div class="hero-actions"><a class="btn primary" href="notes.html">开始读课程笔记</a><a class="btn" href="advice.html">查补剂与建议</a><button class="btn ghost search-open" type="button">${ICON.search}搜索全部内容</button></div>
    <dl class="stats">
      <div><dt>录音</dt><dd>6 段</dd><small>12 小时 48 分</small></div>
      <div><dt>课程笔记</dt><dd>32 章</dd><small>${wan(notes.words)}</small></div>
      <div><dt>补剂速查</dt><dd>${supplementCount} 种</dd><small>剂量、用途、禁忌</small></div>
      <div><dt>文字稿</dt><dd>全文</dd><small>${wan(results.day1.words + results.day2.words)}</small></div>
    </dl>
  </section>
  <aside class="callout home-note"><p><strong>先读这里：</strong>内容整理自课堂录音，反映的是主讲人的观点和经验，不是医疗建议。标"存疑"或 <span class="warn-ic">⚠</span> 的剂量和名称来自语音识别，可能有误，使用前请对照课件或回听。有基础疾病、孕期哺乳期、正在服药或给儿童使用时，先咨询医生或药师。</p></aside>
  <section class="home-sec">
    <h2>从哪里开始读</h2>
    <div class="cards">${cards}</div>
  </section>
  <section class="home-sec">
    <h2>六个核心观点</h2>
    <ol class="ideas">${ideas.map(([t, s, ...chs]) => `<li><b>${t}</b><span>${s}</span><span class="idea-links">${chs.map((c) => `<a href="${link(c)}">第 ${c} 章</a>`).join('')}</span></li>`).join('')}</ol>
  </section>
  <section class="home-sec">${inline(F.journey(link, 1))}</section>
  <section class="home-sec">${inline(F.picks(2))}</section>
  <section class="home-sec" id="pdf">
    <h2>下载 PDF</h2>
    <p class="muted">每份 PDF 都带书签目录，适合打印或在平板上离线阅读。</p>
    <ul class="pdf-list">${pdfs}</ul>
  </section>
  <footer class="foot">整理自 2025 年 11 月 20–21 日「脑营养学」课堂录音，仅供个人学习复习，不构成医疗建议。</footer>
</main>`;
  return shell({ slug: 'index', title: '脑营养学笔记 · 钱笛 2025', desc: '脑营养学两天课程的完整整理：课程笔记、实用建议、录音摘要和可读版文字稿。', body });
}

// ---------- 构建 ----------
const results = {};
const index = [];
for (const page of PAGES) {
  results[page.slug] = renderPage(page);
  index.push(...results[page.slug].sections);
}
PAGES.forEach((page, i) => write(`${page.slug}.html`, docPage(page, results[page.slug], i)));
write('index.html', homePage(results));
write('search.json', JSON.stringify({ pages: Object.fromEntries(PAGES.map((p) => [p.slug, p.nav])), s: index }));

// 校验：不应残留同学姓名和飞书链接
const out = ['index.html', ...PAGES.map((p) => `${p.slug}.html`), 'search.json'].map((f) => [f, read(f)]);
for (const [f, s] of out) {
  if (LEFTOVER_NAMES.test(s)) console.warn('⚠ 残留姓名：', f, s.match(LEFTOVER_NAMES)[0]);
  if (/feishu\.cn/.test(s)) console.warn('⚠ 残留飞书链接：', f);
}
for (const p of PAGES) console.log(p.slug.padEnd(8), String(results[p.slug].heads.length).padStart(4), '个标题', wan(results[p.slug].words));
console.log('search sections', index.length, 'search.json', (fs.statSync(path.join(ROOT, 'search.json')).size / 1024).toFixed(0) + 'KB');
