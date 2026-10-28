// 课程示意图：全部用 HTML/CSS 绘制，随主题切换颜色，窄屏自动改为纵向排列。
// 内容只取自课程笔记，不加入课外观点。

const arrow = `<div class="flow-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></svg></div>`;

function fig(no, title, body, caption, extraClass = '') {
  return `<figure class="fig ${extraClass}">
<figcaption class="fig-head"><span class="fig-no">图 ${no}</span><span class="fig-title">${title}</span></figcaption>
${body}
${caption ? `<p class="fig-cap">${caption}</p>` : ''}
</figure>`;
}

function flow(nodes) {
  return `<div class="flow">${nodes
    .map((n) => `<div class="flow-node${n.cls ? ' ' + n.cls : ''}">${n.badge ? `<span class="flow-badge">${n.badge}</span>` : ''}<b>${n.t}</b>${n.s ? `<small>${n.s}</small>` : ''}</div>`)
    .join(arrow)}</div>`;
}

// link(n) 返回第 n 章的链接地址
export function journey(link, no = 1) {
  const stops = [
    { n: '预启动', tag: '看见 · 想到 · 闻到食物', d: '消化在食物入口之前就开始了；嗅觉会激活消化。', r: '深夜看吃播、嗅觉悄悄退化，都会打乱这一步。', ch: [6, 7] },
    { n: '口腔', tag: '咀嚼 · 唾液', d: '咀嚼形成食糜；唾液消化淀粉、杀菌，并经三叉神经和迷走神经唤醒下游消化。', r: '咀嚼不足 → 营养不良、杀菌不充分、菌群失调。', ch: [6] },
    { n: '胃', tag: '胃酸 · 第一关', d: '胃酸消化蛋白质、杀菌、向下游发信号、释放铁锌等矿物质。', r: '胃酸不足 → 反酸、缺铁缺锌、小肠细菌过度生长、新发食物过敏。', ch: [8, 9, 10], key: true },
    { n: '十二指肠', tag: '胰酶 · 胆汁', d: '流下来的胃酸是信号，通知胰腺释放胰酶、胆囊排出胆汁。', r: '信号不够 → 胰酶和胆汁不足、脂肪消化差、脂溶性维生素缺乏、便秘。', ch: [11] },
    { n: '肝', tag: '解毒', d: '把脂溶性毒素转成水溶性，再排出体外。', r: '解毒能力下降 → 皮肤发黄、发暗、长斑。', ch: [12, 13] },
    { n: '小肠', tag: '吸收', d: '面积最大的吸收场所，营养在这里真正进入身体。', r: '小肠细菌过度生长（SIBO）、肠漏、寄生虫。', ch: [15, 16, 17] },
    { n: '大肠', tag: '菌群', d: '菌群产生短链脂肪酸，经色氨酸影响五羟色胺和褪黑素。', r: '菌群失调 → 情绪、睡眠问题；"胃不和则卧不安"。', ch: [14] },
  ];
  const body = `<div class="metro-banner"><span class="metro-banner-ic" aria-hidden="true">⌁</span><span><b>迷走神经 · 脑干</b>统一调度整条消化道：胃肠不好，常常是脑干不好（第二天，<a href="${link(18)}">第 18 章</a>）</span></div>
<ol class="metro">${stops
    .map(
      (s, i) => `<li class="stop${s.key ? ' key' : ''}"><span class="stop-dot">${i + 1}</span><div class="stop-body"><div class="stop-name">${s.n}<span class="stop-tag">${s.tag}</span>${s.key ? '<span class="stop-key">先解决这里</span>' : ''}</div><p>${s.d}</p><p class="stop-risk">${s.r}</p><div class="stop-links">${s.ch
        .map((c) => `<a href="${link(c)}">第 ${c} 章</a>`)
        .join('')}</div></div></li>`
    )
    .join('')}</ol>`;
  return fig(no, '跟着食物走一遍消化系统：全课主线', body, '补剂"没效"多半卡在这条线上的某一站。老师的顺序是：先解决胃酸，再一级一级处理下游。', 'fig-journey');
}

export function picks(no = 2) {
  const items = [
    ['抗衰老、抗氧化', '白藜芦醇', '排第一，但最贵；要吃就吃够量'],
    ['广泛性消炎', '姜黄素', '"到哪里都能消炎"'],
    ['护脑，老少皆宜', '鱼油', '抗炎看 EPA，护脑看 DHA'],
    ['免疫调节', '维生素 D', '最重要的免疫调节剂'],
    ['最容易拖后腿', '铁', '缺铁就是缺氧'],
    ['到处都起作用', '镁', '什么活动都要用，消耗量大'],
  ];
  const body = `<div class="picks">${items
    .map(([g, n, s]) => `<div class="pick"><span class="pick-goal">${g}</span><span class="pick-name">${n}</span><span class="pick-note">${s}</span></div>`)
    .join('')}</div>`;
  return fig(no, '两天课程总结：各目标的"首选"', body, 'B 族维生素和维生素 C 容易获得，日常补够即可。前提永远是消化：消化不好，补什么都是浪费。〔D2-3 00:13〕', 'fig-picks');
}

export function visceral(no) {
  const body =
    flow([
      { t: '内脏', s: '食物、菌群信号告诉大脑"我在这里"' },
      { t: '迷走神经', s: '内脏感觉的传入通路' },
      { t: '孤束核', s: '位于脑干' },
      { t: '边缘系统', s: '制造情绪、形成记忆', cls: 'em' },
    ]) +
    `<div class="flow-branch"><span class="flow-branch-line" aria-hidden="true"></span><div class="flow-node soft"><b>岛叶</b><small>另一路：接收意识之下的内脏觉和前庭觉；大脑知道内脏在哪里，才会给它供血</small></div></div>`;
  return fig(no, '内脏觉的通路', body, '所以饿了会心情差、发慌：这是进化来的生存机制，驱使下次及时找吃的。内脏觉缺失时，会出现内脏失控和焦虑等精神问题。〔D1-1 1:14:02〕');
}

export function neuron(no) {
  const body = `<div class="flow">
<div class="flow-group"><span class="flow-group-label">先保证</span><div class="flow-group-row"><div class="flow-node em"><b>氧气</b></div><div class="flow-node em"><b>养分</b></div></div></div>
${arrow}
<div class="flow-group"><span class="flow-group-label">再谈</span><div class="flow-group-row"><div class="flow-node"><b>适宜的刺激</b><small>训练、康复</small></div></div></div>
</div>`;
  return fig(no, '健康神经元的三要素', body, '"兵马未动，粮草先行"。一练就好睡一觉又差、怎么练都没反应、一练症状就加重的客户，要先给营养和氧气支持，再训练。〔D1-1 1:33:18〕');
}

export function noEffect(no) {
  const body = flow([
    { badge: '1', t: '消化不了', s: '没有消化能力，本人不知道' },
    { badge: '2', t: '吸收不了', s: '能消化，但吸收不进去，本人也不知道' },
    { badge: '3', t: '被过度消耗', s: '例：平时维生素 C 每天需要 500 mg，发炎时升到 1500 mg，还只吃 500 mg' },
  ]);
  return fig(no, '补剂为什么"没效"：三个原因', body, '客户说"天天吃没效"时，按这三点逐一排查。很可能根本没"吃进去"，只是在胃肠里转了一圈。〔D1-1 1:40:43〕');
}

export function reflux(no) {
  const body =
    flow([
      { t: '胃酸不足', s: '又被水和食物稀释', cls: 'em' },
      { t: '关闭信号不够', s: '胃酸浓度是让上口关闭的关键信号' },
      { t: '食道下括约肌关不紧', s: '像一根没扎紧的扎带' },
      { t: '反酸', s: '胃一蠕动，内容物就往上涌' },
    ]) +
    `<div class="fig-pair">
<div class="fig-note warn"><b>误区循环</b>吃抑酸剂、喝小苏打中和 → 胃酸更少 → 口照样关不上 → 照样反酸，越来越重</div>
<div class="fig-note good"><b>课上的方向</b>不要抑制或中和胃酸，而要增加胃酸（例如喝醋）；长期方案是漱口法刺激迷走神经</div>
</div>`;
  return fig(no, '反酸的真正机制：胃酸太少，而不是太多', body, '老师的经验："从没遇到过胃酸多的人，只遇到过胃酸少的。"〔D1-2 15:42〕〔D1-2 19:16〕');
}

export function acidHub(no) {
  const items = [
    ['反流', '食道下括约肌关不上'],
    ['蛋白质缺乏', '天天吃肉也消化吸收不了'],
    ['铁、锌等金属缺乏', '没有胃酸分离，矿物质直接过去'],
    ['小肠细菌过度生长', '细菌没被杀死，进入小肠增殖'],
    ['无法消化纤维', '一吃菜就拉肚子，常被误认为"胃寒"'],
    ['新发食物过敏', '大分子没拆散就入血，被免疫系统标记'],
  ];
  const body = `<div class="hub"><div class="hub-center"><b>胃酸不足</b><small>六大后果</small></div>${items
    .map(([t, s], i) => `<div class="hub-item hub-${i + 1}"><b>${t}</b><small>${s}</small></div>`)
    .join('')}</div>`;
  return fig(no, '胃酸不足的六大后果', body, '所以"任何营养问题，先解决胃酸"。〔D1-2 22:19〕');
}

export function leaky(no) {
  const body = `<div class="flow three">
<div class="flow-col"><span class="flow-col-label">诱因</span><ul class="tick-list"><li>喝酒</li><li>甲减</li><li>对特定食物有反应</li><li>长期压力、长期交感状态</li><li>头部受伤、脑部发炎、中风、感染</li><li>麸质</li><li>茄科植物（少数敏感者）</li></ul></div>
${arrow}
<div class="flow-col"><span class="flow-col-label">肠漏</span><div class="flow-node em"><b>细胞间隙变大</b><small>不是肠道穿孔，而是原本挤不过去的大分子直接进入血液</small></div></div>
${arrow}
<div class="flow-col"><span class="flow-col-label">三种后果</span><div class="stack"><div class="flow-node"><b>新发过敏</b></div><div class="flow-node"><b>分子模拟 → 自体免疫</b></div><div class="flow-node"><b>炎症连锁反应</b></div></div></div>
</div>`;
  return fig(no, '肠漏：从诱因到后果', body, '修补方案的四个核心：谷氨酰胺、EPA、姜黄素、维生素 D；锌、丁酸盐为辅助。〔D1-3 21:00〕〔D1-3 43:07〕');
}

export function limbPain(no) {
  const rows = [
    ['上肢痛', '大脑皮层', 'cortex', '手偏向自由、精细的动作，最受大脑干扰'],
    ['躯干中线痛', '小脑（+ 前庭）', 'cere', '躯干偏向稳定、规律的运动'],
    ['下肢痛（踝、膝、臀）', '小脑 + 前庭', 'cere', '本质是不稳定 → 下肢代偿 → 疼痛；膝关节常替臀和踝"背锅"'],
    ['蹲下后站起来那一下痛', '小脑', 'cere', '起立和下蹲都需要平衡'],
    ['下楼梯、下蹲过程中膝痛', '基底核', 'basal', '唯一特例：基底核负责离心控制；先排查踝关节'],
  ];
  const body = `<div class="map">${rows
    .map(([a, b, c, d]) => `<div class="map-row ${c}"><span class="map-where">${a}</span><span class="map-arrow" aria-hidden="true">→</span><span class="map-brain">${b}</span><span class="map-why">${d}</span></div>`)
    .join('')}</div>
<div class="map-legend"><span class="cortex">大脑皮层</span><span class="cere">小脑 / 前庭</span><span class="basal">基底核</span></div>`;
  return fig(no, '四肢痛的定位：上肢找大脑，下肢找小脑', body, '营养方案治的是对应的脑区，而不是疼痛本身。〔D2-1 01:31〕〔D2-1 01:33〕');
}

export function mcv(no) {
  const pos = (v) => (((v - 75) / 30) * 100).toFixed(2) + '%';
  const body = `<div class="scale">
<div class="scale-ref" style="left:${pos(80)};right:calc(100% - ${pos(100)})"><span>化验单参考范围 80～100（贫血的诊断标准）</span></div>
<div class="scale-bar"><span class="seg low" style="flex:10">低于 85</span><span class="seg ok" style="flex:7">85～92</span><span class="seg high" style="flex:13">高于 92</span></div>
<div class="scale-ticks">${[80, 85, 92, 100].map((v) => `<span style="left:${pos(v)}">${v}</span>`).join('')}</div>
</div>
<div class="scale-legend">
<div class="low"><b>小细胞：考虑缺铁</b>红细胞长不大。铁 + 维生素 B12 + 叶酸三样都补</div>
<div class="ok"><b>功能上的合适范围</b>比化验单更严格：血液按需调配，总量少一点就会缺氧</div>
<div class="high"><b>大细胞：考虑缺 B12 / 叶酸</b>红细胞不成熟。补 B12 和叶酸，去掉铁</div>
</div>`;
  return fig(no, '平均红细胞体积（MCV）的功能判读', body, '口诀"小细胞全上，大细胞去铁"。叶酸和 B12 必须同步补。〔D2-2 00:25〕〔D2-2 00:34〕', 'fig-scale');
}

export function fasting(no) {
  const marks = [
    [16, '16 小时', '常规代谢问题', '胰岛素抵抗、糖尿病、脂肪肝、减肥（16+8）'],
    [24, '24 小时', '较重的代谢问题', '如内脏脂肪太多；大部分人 16 小时就够'],
    [48, '≥ 48 小时', '免疫问题', '自体免疫等；过了 48 小时，免疫系统和内脏"重启"'],
    [72, '72 小时', '严重神经退化、更严重的炎症', '让大脑充分清除垃圾；老师说是极限'],
  ];
  const body = `<div class="timeline"><div class="timeline-bar"></div>${marks
    .map(([h, l], i) => `<span class="timeline-mark m${i + 1}" style="left:${((h / 72) * 100).toFixed(2)}%"><i></i><em>${l}</em></span>`)
    .join('')}<span class="timeline-zero">0</span></div>
<div class="timeline-cards">${marks
    .map(([, l, t, s], i) => `<div class="tl-card m${i + 1}"><span>${l}</span><b>${t}</b><small>${s}</small></div>`)
    .join('')}</div>
<div class="fig-note warn"><b>会打断自噬的</b>中途吃任何东西（一片西瓜、零食、奶茶、辟谷丸）；糖、蛋白质、脂肪都不能吃。水和黑咖啡可以。有胰岛素抵抗的人容易低血糖，要逐步拉长间隔。</div>`;
  return fig(no, '断食时长：按问题选', body, '课上的总结：免疫问题、严重炎症、严重退化、抗衰老，统一都是限制热量，只是时长不同。〔D2-2 02:01〕〔D2-2 02:43〕');
}
