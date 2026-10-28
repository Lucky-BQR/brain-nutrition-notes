(function(){
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function txt(s,x,y,size=24,color='#183F4D',anchor='middle',weight=400){return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;}
function box(n,x,y,w=238,h=104,c='#19586B'){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="white" stroke="${c}" stroke-width="2"/>${txt(n[0],x+w/2,y+42,25,c,'middle',700)}${txt(n[1],x+w/2,y+77,18,'#506875')}`;}
function line(x,y,X,Y,c='#7CA3AD',arrow=false,dash=false){return `<path d="M${x},${y} L${X},${Y}" fill="none" stroke="${c}" stroke-width="3" ${dash?'stroke-dasharray="7 7"':''} ${arrow?'marker-end="url(#arrow)"':''}/>`;}
function diagram(t){let s='',n=t.nodes,c=t.color;const center={ '02':'神经活动','06':'气味体验','10':'肠道生态','13':'疼痛体验','22':'日常功能'};
if(t.id==='04'){
 const pos=[[25,170],[275,170],[275,18],[530,18],[530,170],[780,170]];s+=line(239,222,275,222,c,true)+line(489,222,530,222,c,true)+line(744,222,780,222,c,true)+line(382,122,625,170,c,true)+line(637,122,637,170,c,true);n.forEach((a,i)=>s+=box(a,pos[i][0],pos[i][1],i===5?205:214,104,c));s+=txt('食物主通道：口腔 / 食管 → 胃 → 小肠 → 大肠',500,365,27,c);s+=txt('肝胆与胰腺提供旁路分泌，不是食物经过的通道',500,415,23);s+=txt('示意位置，不按解剖比例',500,490,18,'#667E88');
}else if(t.kind==='radial'){
 let p=n.map((a,i)=>{let r=-Math.PI/2+i*2*Math.PI/n.length;return [500+325*Math.cos(r)-116,292+190*Math.sin(r)-47]});p.forEach(([x,y])=>s+=line(500,292,x+116,y+47,c,false,true));s+=`<ellipse cx="500" cy="292" rx="123" ry="68" fill="${c}"/>`+txt(center[t.id]||'相互联系',500,302,28,'white','middle',700);p.forEach(([x,y],i)=>s+=box(n[i],x,y,232,94,c));s+=txt('连线表示参与或关联，不表示单一因果',500,550,19,'#607880');
}else if(t.kind==='compare'){
 s+=`<rect x="485" y="35" width="2" height="465" fill="#C8DADD"/>`;
 n.forEach((a,i)=>{let col=Math.floor(i/3),row=i%3;s+=box(a,45+col*505,48+row*150,400,115,c)});s+=txt('分开概念，逐项理解；不把两列视作等式',500,550,20,'#607880');
}else if(t.kind==='matrix'){
 n.forEach((a,i)=>s+=box(a,45+(i%3)*320,80+Math.floor(i/3)*195,270,140,c));s+=txt('先核对所有来源，再讨论个体需要',500,515,24,c);
}else if(t.kind==='timeline'){
 s+=line(500,25,500,530,c,false);n.forEach((a,i)=>{let y=18+i*104,x=i%2?548:42;s+=line(i%2?500:450,y+40,i%2?548:500,y+40,c);s+=`<circle cx="500" cy="${y+40}" r="9" fill="${c}"/>`;s+=box(a,x,y,410,87,c)});
}else if(t.kind==='loop'){
 let p=[[375,25],[700,175],[590,375],[150,375],[55,175]];
 p.forEach(([x,y],i)=>{let [X,Y]=p[(i+1)%p.length];s+=line(x+115,y+55,X+115,Y+55,c,false,true)});s+=`<ellipse cx="500" cy="283" rx="140" ry="65" fill="#E1EFF1"/>`+txt(t.id==='12'?'双向调节':'观察与回顾',500,292,29,c,'middle',700);n.forEach((a,i)=>s+=box(a,p[i][0],p[i][1],240,110,c));s+=txt('环形表示相互联系 / 复盘循环',500,550,20,'#607880');
}else if(t.kind==='branch'){
 s+=box(n[0],340,25,320,102,c);let count=n.length-2;for(let i=0;i<count;i++){let w=900/count-18,x=50+i*900/count;s+=line(500,127,x+w/2,230,c,false,true);s+=box(n[i+1],x,230,w,110,c);s+=line(x+w/2,340,500,430,c,false,true)}s+=box(n[n.length-1],300,430,400,102,c);
}else{
 let p=[[45,65],[380,65],[715,65],[715,330],[380,330],[45,330]];n.forEach((a,i)=>{if(i<n.length-1){let [x,y]=p[i],[X,Y]=p[i+1];if(y===Y){s+=line(x+(X>x?245:0),y+56,X+(X>x?0:245),Y+56,c,true)}else s+=line(x+122,y+112,X+122,Y,c,true)}s+=box(a,p[i][0],p[i][1],245,112,c)});s+=txt(t.id==='01'?'知识组织路径，不是疾病诊断流程':'顺序表示过程或阅读步骤',500,540,20,'#607880');
}
return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="580" viewBox="0 0 1000 580" role="img" aria-label="${esc(t.title)}关系图"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="${c}"/></marker></defs><rect width="1000" height="580" rx="24" fill="#EDF5F6"/><g font-family="Microsoft YaHei,Arial,sans-serif">${s}</g></svg>`;
}
window.atlasDiagram=diagram;
window.atlasPoster=t=>`<div class="poster" style="--topic:${t.color}"><header><span>脑营养学 · 视觉学习图册</span><span>${window.ATLAS.groups[t.group][0]} / ${t.id}</span></header><h1>${esc(t.title)}</h1><p class="poster-subtitle">${esc(t.subtitle)}</p><div class="poster-diagram">${diagram(t)}</div><div class="poster-points">${t.points.map((p,i)=>`<p><b>${i+1}</b>${esc(p)}</p>`).join('')}</div><div class="poster-boundary"><b>理解边界</b><p>${esc(t.boundary)}</p></div><footer><span>课程定位：${esc(t.source)}</span><span>学习用概念图 · 2026.10</span></footer></div>`;
})();
