// 用本机 Chrome 把各页面打印成 PDF（带书签目录和页码）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DOCS = [
  { slug: 'notes', file: 'notes.pdf', title: '脑营养学 · 课程笔记' },
  { slug: 'advice', file: 'advice.pdf', title: '脑营养学 · 实用建议清单' },
  { slug: 'summary', file: 'summary.pdf', title: '脑营养学 · 每段录音摘要' },
  { slug: 'day1', file: 'transcript-day1.pdf', title: '脑营养学 · 可读版文字稿 · 第一天' },
  { slug: 'day2', file: 'transcript-day2.pdf', title: '脑营养学 · 可读版文字稿 · 第二天' },
];
const FONT = `font-family:'Microsoft YaHei','PingFang SC',sans-serif`;

fs.mkdirSync(path.join(ROOT, 'pdf'), { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--font-render-hinting=none'] });
try {
  for (const d of DOCS) {
    const t0 = Date.now();
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.goto(pathToFileURL(path.join(ROOT, `${d.slug}.html`)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const out = path.join(ROOT, 'pdf', d.file);
    await page.pdf({
      path: out,
      format: 'A4',
      printBackground: true,
      outline: true,
      tagged: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;padding:0 16mm;display:flex;justify-content:space-between;font-size:7.5px;color:#8a9097;${FONT}"><span>${d.title}</span><span>主讲 钱笛 · 2025.11.20–21</span></div>`,
      footerTemplate: `<div style="width:100%;text-align:center;font-size:8px;color:#8a9097;${FONT}"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
      margin: { top: '17mm', bottom: '15mm', left: '16mm', right: '16mm' },
    });
    await page.close();
    console.log(d.file.padEnd(22), (fs.statSync(out).size / 1048576).toFixed(1) + ' MB', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
} finally {
  await browser.close();
}
