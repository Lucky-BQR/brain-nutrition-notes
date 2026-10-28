// 发布前的处理：去掉同学姓名和只对本人可见的飞书链接。
// 用法：node scripts/sanitize.mjs  —— 直接改写 content/*.md；build.mjs 也会再过一遍。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME_RULES = [
  [/学员（兰老师）/g, '学员'],
  [/兰老师说的这个/g, '这位学员说的'],
  [/兰老师/g, '一位学员'],
  [/倩文也是/g, '还有一位同学也是'],
  [/孙静思(〔[^〕]*〕)?/g, '一位同学'],
  [/陈主任/g, '刚才那位学员'],
  [/杨旺(〔[^〕]*〕)?说的/g, '刚才有同学说的'],
  [/〔原文识别为.田老师.〕/g, ''],
  [/张老师〔存疑：可能是.钱老师.〕/g, '钱老师'],
  [/苗老师/g, '某位学员'],
  [/[，,]?\s*于敏昭〔[^〕]*〕/g, ''],
  [/安迪老师（人名转写〔存疑〕）/g, '一位老师'],
  [/安迪老师/g, '那位老师'],
];
export const LEFTOVER_NAMES = /兰老师|倩文|孙静思|陈主任|杨旺|田老师|张老师|苗老师|于敏昭|安迪/;

export function sanitize(md) {
  for (const [re, to] of NAME_RULES) md = md.replace(re, to);
  md = md.replace(/\s*·\s*\[飞书妙记\]\([^)]*\)/g, '');
  md = md
    .replace('| 录音 | 时长 | 主要内容 | 飞书妙记 |', '| 录音 | 时长 | 主要内容 |')
    .replace('| 录音 | 时长 | 主要内容 |\n|---|---|---|---|', '| 录音 | 时长 | 主要内容 |\n|---|---|---|')
    .replace(/ \[打开\]\(https?:\/\/[^)]*feishu\.cn[^)]*\) \|/g, '');
  md = md.replace(/\[([^\]]*)\]\(https?:\/\/[a-z0-9-]+\.feishu\.cn[^)]*\)/g, '$1');
  md = md.replace('同一文件夹里还有：每段录音摘要、实用建议清单、可读版文字稿（第一天、第二天）。', '本站还有：实用建议清单、每段录音摘要、可读版文字稿（第一天、第二天），见顶部导航。');
  return md;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const p = path.join(dir, f);
    const before = fs.readFileSync(p, 'utf8');
    const after = sanitize(before);
    if (after !== before) fs.writeFileSync(p, after);
    const left = after.match(LEFTOVER_NAMES) || after.match(/feishu\.cn/);
    console.log(f.padEnd(12), after === before ? '无改动' : '已处理', left ? `⚠ 仍有：${left[0]}` : '');
  }
}
