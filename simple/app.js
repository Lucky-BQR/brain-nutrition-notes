(() => {
  'use strict';
  const {pages, groups, images} = window.NOTES;
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rich = value => escape(value).replace(/&lt;b&gt;/g,'<b>').replace(/&lt;\/b&gt;/g,'</b>');
  const plain = value => String(value).replace(/<[^>]*>/g,'');
  const list = values => `<ul>${values.map(t=>`<li>${rich(t)}</li>`).join('')}</ul>`;
  const cards = (values, bottom=false) => `<div class="cards${bottom?' bottom-cards':''}">${values.map(c=>`<section class="card"><h3>${escape(c.title)}</h3><div class="card-content">${list(c.bullets)}</div></section>`).join('')}</div>`;
  const visibleKeys = ['title','subtitle','core','cards_heading','cards','table','bottom_heading','bottom','caution','sources'];
  const searchable = p => plain(visibleKeys.map(k=>JSON.stringify(p[k])).join(' ')).toLocaleLowerCase();
  const searchTexts = pages.map(searchable);
  const media = matchMedia('(max-width:760px)');
  let current = 0;
  let view = 'text';
  let drawerOpen = false;

  function setDrawer(open, returnFocus=false) {
    drawerOpen = open && media.matches;
    $('sidebar').classList.toggle('open',drawerOpen);
    $('sidebar').inert = media.matches && !drawerOpen;
    $('menu-backdrop').hidden=!drawerOpen;
    $('menu-toggle').setAttribute('aria-expanded',String(drawerOpen));
    document.body.classList.toggle('menu-open',drawerOpen);
    if(drawerOpen) $('search').focus();
    else if(returnFocus) $('menu-toggle').focus();
  }

  function buildDirectory() {
    const query=$('search').value.trim().toLocaleLowerCase();
    const words=query.split(/\s+/).filter(Boolean);
    let count=0;
    $('topic-list').innerHTML=groups.map((group,gi)=>{
      const entries=pages.map((p,index)=>({p,index})).filter(({p,index})=>p.group===gi && words.every(w=>searchTexts[index].includes(w)));
      count+=entries.length;
      if(!entries.length)return '';
      return `<section class="topic-group"><h3>${escape(group)}</h3>${entries.map(({p,index})=>{
        let snippet='';
        if(query && !p.title.toLocaleLowerCase().includes(query)) {
          const text=plain([...p.core,...p.cards.flatMap(c=>c.bullets),...p.bottom.flatMap(c=>c.bullets)].join(' '));
          const at=text.toLocaleLowerCase().indexOf(words[0]);
          if(at>=0)snippet=`<small>${at>12?'…':''}${escape(text.slice(Math.max(0,at-12),at+34))}…</small>`;
        }
        return `<a href="#${p.id}" ${index===current?'aria-current="page"':''}>${escape(p.title)}${snippet}</a>`;
      }).join('')}</section>`;
    }).join('');
    $('search-count').textContent=query?`找到 ${count} 个相关主题`:`${pages.length} 个主题`;
    $('search-clear').hidden=!query;
    $('search-empty').hidden=count!==0;
  }

  function setView(next) {
    view=next;
    const imageMode=view==='image';
    $('text-content').hidden=imageMode;
    $('image-content').hidden=!imageMode;
    $('text-view').setAttribute('aria-pressed',String(!imageMode));
    $('image-view').setAttribute('aria-pressed',String(imageMode));
    if(imageMode) {
      const p=pages[current];
      const src=`images/note-${String(p.number).padStart(2,'0')}.png`;
      $('note-image').src=src;
      $('note-image').alt=`${p.title}，PDF 第 ${p.number} 页的高清笔记`;
      $('image-full').href=src;
    }
  }

  function render(index, scroll=true) {
    current=index;
    const p=pages[current];
    document.title=`${p.title} · 脑营养学课堂笔记`;
    $('note-title').textContent=p.title;
    $('note-subtitle').textContent=p.subtitle;
    $('group-label').textContent=groups[p.group];
    $('pdf-page').textContent=`PDF 第 ${p.number} 页`;
    $('mobile-position').textContent=`${index+1} / ${pages.length}`;
    $('download-image').href=`images/note-${String(p.number).padStart(2,'0')}.png`;
    $('download-image').download=`${String(p.number).padStart(2,'0')}-${p.title}.png`;
    const references=p.references.length?`<details><summary>核查资料（${p.references.length} 项）</summary><ol class="reference-list">${p.references.map(r=>`<li><a href="${escape(r.url)}" target="_blank" rel="noopener">${escape(r.title)}</a><p>${escape(r.supports||'')}</p></li>`).join('')}</ol></details>`:'';
    $('text-content').innerHTML=`
      <section class="core" aria-labelledby="core-title"><h2 id="core-title">核心要点</h2>${list(p.core)}</section>
      <section class="note-section"><h2>${escape(p.cards_heading)}</h2>${cards(p.cards)}</section>
      <section class="note-section"><h2>${escape(p.table.title)}</h2><div class="table-wrap" role="region" aria-label="${escape(p.table.title)}，可横向滚动" tabindex="0"><table><thead><tr>${p.table.headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${p.table.rows.map(row=>`<tr>${row.map(cell=>`<td>${rich(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
      <section class="note-section"><h2>${escape(p.bottom_heading)}</h2>${cards(p.bottom,true)}</section>
      <p class="caution"><b>阅读提示：</b>${escape(p.caution)}</p>
      <section class="source-details" aria-label="原稿定位与核查资料"><p><b>原稿定位</b></p>${list(p.sources)}${references}</section>`;
    const previous=$('previous'),next=$('next');
    previous.disabled=index===0;next.disabled=index===pages.length-1;
    previous.querySelector('strong').textContent=index>0?pages[index-1].title:'';
    next.querySelector('strong').textContent=index<pages.length-1?pages[index+1].title:'';
    buildDirectory();setView('text');setDrawer(false);
    if(scroll){window.scrollTo({top:0,behavior:'instant'});$('note-title').focus({preventScroll:true});}
  }

  function readHash(scroll=true) {
    const id=location.hash.slice(1);
    const index=pages.findIndex(p=>p.id===id);
    if(index<0)history.replaceState(null,'',`${location.pathname}${location.search}#${pages[0].id}`);
    render(index<0?0:index,scroll);
  }

  $('search').addEventListener('input',buildDirectory);
  $('search-clear').addEventListener('click',()=>{$('search').value='';buildDirectory();$('search').focus();});
  $('menu-toggle').addEventListener('click',()=>setDrawer(!drawerOpen));
  $('menu-close').addEventListener('click',()=>setDrawer(false,true));
  $('menu-backdrop').addEventListener('click',()=>setDrawer(false,true));
  $('topic-list').addEventListener('click',e=>{const a=e.target.closest('a');if(a && a.hash===location.hash){setDrawer(false);$('note-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}});
  $('previous').addEventListener('click',()=>{if(current>0)location.hash=pages[current-1].id;});
  $('next').addEventListener('click',()=>{if(current<pages.length-1)location.hash=pages[current+1].id;});
  $('text-view').addEventListener('click',()=>setView('text'));
  $('image-view').addEventListener('click',()=>setView('image'));
  addEventListener('hashchange',()=>readHash());
  media.addEventListener('change',()=>setDrawer(false));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && drawerOpen){e.preventDefault();setDrawer(false,true);}
    if(e.key==='Tab' && drawerOpen){
      const focusable=[...$('sidebar').querySelectorAll('button:not([hidden]),input,a[href]')].filter(el=>!el.hidden);
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  $('gallery-list').innerHTML=images.map(i=>`<a href="images/note-${String(i.number).padStart(2,'0')}.png" target="_blank" rel="noopener"><span>${String(i.number).padStart(2,'0')}</span>${escape(i.title)}</a>`).join('');
  $('gallery-open').addEventListener('click',()=>$('gallery').showModal());
  $('gallery-close').addEventListener('click',()=>$('gallery').close());
  $('gallery').addEventListener('click',e=>{if(e.target===$('gallery')){const r=$('gallery').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('gallery').close();}});
  $('note-image').addEventListener('error',()=>{$('note-image').alt='图片暂时没有加载成功，请刷新重试，或下载完整包查看。';});
  readHash(false);
})();
