// Comparador · 03-vistas.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- render ----------

  // ---------- espacios (mis compras / compartido) y categorías con icono ----------
  let space='mine';
  const ICONS={
    bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    tag:'<path d="M3 12V4h8l9.5 9.5-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
    box:'<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    pistol:'<path d="M2.5 7.5h16l1.5 1.5v2.5h-5.5l-1 2.5h-2.6l-1.2 5H5.4l1.4-7.5H2.5z"/><path d="M11.2 11.5v2"/>',
    rifle:'<path d="M2 10.5h12l1.5-1.5H22v3h-4.5l-1.5 1.5h-3l-1 3.5H9.5l.8-3.5H5L2 14z"/><path d="M8 10.5V8.5h3v2"/>',
    revolver:'<path d="M3 8h12l1-1h3v3h-3"/><circle cx="12" cy="11" r="2.4"/><path d="M9.6 11.5 8 19H4.6l1.6-7.5"/><path d="M3 8v3h3"/>',
    mag:'<path d="M8.5 3h7l-1.2 18H9.8z"/><path d="M9.5 8h5M9.6 12h4.8M9.8 16h4.4"/>',
    ammo:'<circle cx="7" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="11.5" cy="16" r="3"/>',
    power:'<rect x="5" y="6" width="14" height="14" rx="2"/><path d="M9 3h6v3H9zM12.5 10l-2.5 4h4l-2.5 4"/>',
    optic:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    tool:'<path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.9-5.9a4 4 0 0 0 5.3-5.3l-2.4 2.4-2.9-.7-.7-2.9z"/>',
    vest:'<path d="M8.5 3 4 6v15h6v-6h4v6h6V6l-4.5-3-1.8 4h-3.4z"/>',
    brick:'<rect x="3" y="9" width="18" height="11" rx="1.5"/><rect x="6" y="5.5" width="4" height="3.5" rx="1"/><rect x="14" y="5.5" width="4" height="3.5" rx="1"/>',
    tech:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18h2"/>',
    home:'<path d="M3 11 12 3.5 21 11v10h-6v-6H9v6H3z"/>',
    leaf:'<path d="M5 20c0-9.5 6-15 15-15 0 9.5-5.5 15-15 15z"/><path d="M5 20l8-8"/>',
    book:'<path d="M4 4.5h7a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2H4zM20 4.5h-5a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h5z"/>',
    gift:'<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5C10 4 6.5 5 7.5 7.5c.5 1 4.5 1 4.5 1s4-.1 4.5-1c1-2.5-2.5-3.5-4.5 1"/>',
    car:'<path d="M3 16v-4l2.5-5h13L21 12v4z"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/>',
    shirt:'<path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a3 3 0 0 1-8 0z"/>',
    bag:'<path d="M5 8h14l-1.2 13H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    all:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    none:'<path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/><circle cx="12" cy="12" r="9"/>',
    me:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    shoe:'<path d="M3 15.5V9.5h4l2 3 5 1.2c3 .7 5.5 1.7 6.5 3.3v1H3z"/><path d="M3 18h18"/><path d="M10.5 12.8l1-1.6M13 13.4l1-1.5"/>',
    handbag:'<path d="M4.5 9h15l-1.3 11.5H5.8z"/><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"/><path d="M9 13h6"/>',
    toy:'<circle cx="12" cy="13.5" r="6"/><circle cx="7" cy="6.5" r="2.2"/><circle cx="17" cy="6.5" r="2.2"/><circle cx="10" cy="12.5" r=".7" fill="currentColor"/><circle cx="14" cy="12.5" r=".7" fill="currentColor"/><path d="M10.5 16c.9.7 2.1.7 3 0"/>',
    beauty:'<rect x="8" y="10" width="8" height="11" rx="2"/><path d="M10 10V6.5h4V10M10.5 6.5 11 3h2l.5 3.5"/>',
    golf:'<path d="M8 21V3l9 4-9 4"/><ellipse cx="10" cy="20.5" rx="7" ry="1.6"/>',
    game:'<path d="M7 8h10a4.5 4.5 0 0 1 4.3 5.8l-1 3.3a2.3 2.3 0 0 1-3.9.8L14.5 16h-5l-1.9 1.9a2.3 2.3 0 0 1-3.9-.8l-1-3.3A4.5 4.5 0 0 1 7 8z"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="15.5" cy="11.5" r=".8" fill="currentColor"/><circle cx="17.5" cy="13.5" r=".8" fill="currentColor"/>',
    spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.7.8 2.9 2.5 3.5 5.2"/>'};
  const CAT_RULES=[[/revólver|revolver/i,'revolver'],[/pistol/i,'pistol'],[/rifle|fusil|escopet|subfusil|carabin|sniper|francotir|aeg\b|ametrall/i,'rifle'],[/cargador/i,'mag'],
    [/munici|\bbbs?\b|bolas|balines|perdigon/i,'ammo'],[/gas|bater|co2|cargador de bater|energ/i,'power'],[/golf/i,'golf'],[/videojueg|consola|nintendo|xbox|playstation|gaming/i,'game'],[/chorrad|gadget|frik|capricho/i,'spark'],[/óptic|optic|visor|mira|red dot|linterna/i,'optic'],
    [/interna|engranaj|gearbox|hop/i,'gear'],[/extern|accesori|herramient|repuesto|pieza/i,'tool'],[/equip|chaleco|táctic|tactic|funda|cartuchera|protecc/i,'vest'],
    [/calzado|zapat|bot[ií]n|playera|tac[oó]n|sandalia|chancla/i,'shoe'],[/complement|bolso|joya|bisuter|pendiente|colgante/i,'handbag'],[/belleza|perfum|maquill|cosm[eé]t/i,'beauty'],[/ropa|camis|pantal|vestid|falda|blusa|abrigo|chaquet/i,'shirt'],[/lego|construcc/i,'brick'],[/juguet|juego|puzzle|peluche|muñec/i,'toy'],[/electr|móvil|movil|ordenador|tablet|informát|tecnolog|audio/i,'tech'],
    [/hogar|casa|cocina|mueble|decor/i,'home'],[/jard|huerto|planta|semilla|riego|plantel/i,'leaf'],[/libro|cómic|comic/i,'book'],[/regalo/i,'gift'],[/coche|moto|auto/i,'car']];
  const HUES=[['#2B44D6','#E7EAFB'],['#0F7A5A','#DDF3EA'],['#B5401F','#FBE6DD'],['#7A3EC8','#EFE5FB'],['#9A6B00','#FBF0D2'],['#0B6E8F','#DCF0F7'],['#B32563','#FBE2EC']];
  const HUES_D=[['#9AA7FF','#252C52'],['#5ED3A6','#173329'],['#FF9A78','#3D2219'],['#C6A2FF','#2E2349'],['#F5C64F','#3A2F12'],['#6CCDEB','#13303A'],['#FF8DBA','#3B1A29']];
  function catIcon(c){if(c===NOCAT)return 'none';for(const [re,k] of CAT_RULES)if(re.test(c))return k;return 'bag';}
  function svgI(k){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]||ICONS.bag}</svg>`;}
  function hueOf(c){let h=0;for(const ch of String(c))h=(h*31+ch.charCodeAt(0))>>>0;const th=document.documentElement.dataset.theme;const dark=th?th==='dark':matchMedia('(prefers-color-scheme: dark)').matches;const [a,b]=(dark?HUES_D:HUES)[h%HUES.length];return `--h:${a};--h-soft:${b}`;}
  function owners(){try{return [...sharedOwners.entries()].filter(([,o])=>o.items.size);}catch(e){return [];}}
  function initials(n){return clean(n).split(/\s+|@/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'?';}
  function renderSpaces(){
    const os=owners();if(space!=='mine'&&!os.some(([k])=>k===space))space='mine';
    document.body.classList.toggle('shared-space',space!=='mine');
    const mine=items.filter(i=>(i.status||'pending')==='pending').length;
    $('#spaceBar').innerHTML=`<button type="button" data-space="mine" aria-pressed="${space==='mine'}"><span class="av">${svgI('me')}</span><span>Mis compras<small>${mine} pendientes</small></span></button>`+
      (os.length?os.map(([k,o])=>{const n=[...o.items.values()].filter(i=>i.status!=='discarded'&&i.status!=='alt').length;return `<button type="button" data-space="${esc(k)}" aria-pressed="${space===k}"><span class="av">${esc(initials(o.name))}</span><span>De ${esc(clean(o.name).split(/\s|@/)[0])}<small>${n} compartidos</small></span></button>`;}).join('')
      :`<button type="button" disabled><span class="av">${svgI('users')}</span><span>Compartido<small>nadie aún</small></span></button>`);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-space]');if(!b||b.disabled)return;space=b.dataset.space;navTab=space==='mine'?'home':'explore';flt.cat='';flt.q='';$('#q').value='';tab=space==='mine'?'compare':'shared';render();window.scrollTo({top:0,behavior:'smooth'});});
  // Rejilla de categorías: se muestra en «Comparar» (y en lo compartido) cuando no hay categoría ni búsqueda.
  const showGrid=()=>!selMode&&!flt.cat&&!flt.q&&!flt.plat&&!flt.shop&&!flt.tag&&!flt.state&&!flt.person;
  function catCoverOf(c,list){const pool=(list||items).filter(i=>catOf(i)===c&&i.status!=='discarded');
    const ch=pool.filter(i=>i.catCoverAt&&(i.images||[]).length).sort((a,b)=>String(b.catCoverAt).localeCompare(String(a.catCoverAt)))[0];
    if(ch){const v=ch.images[Math.min(+ch.catCoverI||0,ch.images.length-1)];if(v&&!isBad(v)&&src(v))return src(v);}
    const f=pool.find(i=>(i.images||[]).some(v=>!isBad(v)&&src(v)));return f?src(f.images.find(v=>!isBad(v)&&src(v))):'';}
  function catGrid(list,totalOf,sq){const Q=sq?' sq':'';
    const m=new Map();list.forEach(i=>{const c=catOf(i);if(!m.has(c))m.set(c,[]);m.get(c).push(i);});
    const cats=[...m.entries()].sort((a,b)=>a[0]===NOCAT?1:b[0]===NOCAT?-1:b[1].length-a[1].length||a[0].localeCompare(b[0],'es'));
    const tot=v=>v.reduce((s,i)=>s+totalOf(i),0);
    return `<div class="catgrid"><button type="button" class="cattile all${Q}" data-cat="*"><span class="ic">${svgI('all')}</span><span class="tx"><b>Todo</b><small>${list.length} ${list.length===1?'artículo':'artículos'}</small></span></button>`+
      cats.map(([c,v])=>{const u=catCoverOf(c);
        return u?`<button type="button" class="cattile photo${Q}" style="${hueOf(c)}" data-cat="${esc(c)}"><img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="ic">${svgI(catIcon(c))}</span><span class="tx"><b>${esc(c)}</b><small>${v.length} ${v.length===1?'artículo':'artículos'}</small></span></button>`:
        `<button type="button" class="cattile${Q}" style="${hueOf(c)}" data-cat="${esc(c)}"><span class="ic">${svgI(catIcon(c))}</span><span class="tx"><b>${esc(c)}</b><small>${v.length} ${v.length===1?'artículo':'artículos'}</small></span></button>`;}).join('')+`</div>`;
  }
  function catBack(n){if(!flt.cat)return '';const pu=catCoverOf(flt.cat);return `<div class="catback hero" style="${hueOf(flt.cat)}">${pu?`<img src="${esc(pu)}" alt="" referrerpolicy="no-referrer">`:''}<button class="iconbtn" type="button" data-cat="" aria-label="Volver a categorías"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><span class="ic">${svgI(catIcon(flt.cat))}</span><h2>${esc(flt.cat)}<small>${n} ${n===1?'producto':'productos'}</small></h2><button type="button" class="cccover" data-ccpick="${esc(flt.cat)}">Cambiar portada</button></div>`;}
  function openCatPick(c){const pool=items.filter(i=>catOf(i)===c&&i.status!=='discarded');const ph=[];pool.forEach(i=>(i.images||[]).forEach((v,k)=>{if(!isBad(v)&&src(v))ph.push([i,k,v]);}));
    let m=$('#ccPick');if(!m){m=document.createElement('div');m.id='ccPick';m.className='ccpick';document.body.appendChild(m);}
    const cur=catCoverOf(c);
    m.innerHTML=`<div class="in"><div class="hd"><b>Portada de «${esc(c)}»</b><button type="button" class="btn small" data-ccclose>Cerrar</button></div><p class="hint">Toca la foto que quieres de portada. Salen las fotos de todos los artículos de esta categoría.</p>${ph.length?`<div class="gr">${ph.map(([i,k,v])=>`<button type="button" data-ccid="${i.id}" data-cci="${k}" class="${src(v)===cur?'on':''}" title="${esc(fullName(i))}"><img src="${esc(src(v))}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join('')}</div>`:'<p class="hint">Ningún artículo de esta categoría tiene fotos todavía.</p>'}</div>`;
    m.hidden=false;}
  document.addEventListener('click',async e=>{const p=e.target.closest('[data-ccpick]');if(p){e.stopPropagation();openCatPick(p.dataset.ccpick);return;}
    if(e.target.closest('[data-ccclose]')||e.target.id==='ccPick'){$('#ccPick').hidden=true;return;}
    const b=e.target.closest('[data-ccid]');if(!b)return;const it=items.find(i=>i.id===b.dataset.ccid);if(!it)return;it.catCoverAt=new Date().toISOString();it.catCoverI=+b.dataset.cci;await put('items',it);$('#ccPick').hidden=true;render();setStatus(`Portada de «${catOf(it)}» cambiada.`);},true);
  document.addEventListener('contextmenu',e=>{const t=e.target.closest('.cattile[data-cat]');if(!t||t.dataset.cat==='*')return;e.preventDefault();openCatPick(t.dataset.cat);});
  let allMode=false;
  $('#view').addEventListener('click',e=>{const t=e.target.closest('[data-cat]');if(!t)return;const c=t.dataset.cat;if(navTab==='home'){navTab='explore';tab=space==='mine'?'compare':'shared';}
    flt.sub='';flt.fac='';if(c==='*'){allMode=true;flt.cat='';}else{allMode=false;flt.cat=c;}saveFlt();render();window.scrollTo({top:0,behavior:'smooth'});});

  // Muestra de color aproximada a partir del nombre.
  const COLORS={negro:'#1b1b1b',blanco:'#fafafa',crudo:'#efe8d8',beige:'#d9c7a7',camel:'#c19a6b',marron:'#7a4b2a',chocolate:'#5a3520',gris:'#8d9096',plata:'#c7cbd1',plateado:'#c7cbd1',dorado:'#d4af37',oro:'#d4af37',rojo:'#d0302a',granate:'#7d1d2b',burdeos:'#6d1a2a',rosa:'#f2a5bd',fucsia:'#d6247a',morado:'#6b3fa0',lila:'#b79ad8',malva:'#b784a7',azul:'#2f5bd3','azul marino':'#1d2a55',marino:'#1d2a55',celeste:'#8cc7f0',turquesa:'#2ab5b0',verde:'#2f8f4e',kaki:'#8a8455',caqui:'#8a8455',oliva:'#6b6b2f',mostaza:'#d4a017',amarillo:'#f4d03f',naranja:'#f08a24',coral:'#f47c6b',teja:'#b8543a',denim:'#4a6a95',vaquero:'#4a6a95'};
  function swatch(c){const n=norm(c);const k=Object.keys(COLORS).sort((a,b)=>b.length-a.length).find(x=>n.includes(norm(x)));return k?COLORS[k]:'transparent';}
  // ---------- historial de precios: línea de tiempo ----------
  const DAYMS=86400000;
  function histPts(it){return (it.history||[]).filter(x=>x.price>0).map(x=>({t:new Date(x.at).getTime(),p:num(x.price),tot:num(x.total),a:x.avail||''})).filter(x=>x.t).sort((a,b)=>a.t-b.t);}
  function minIn(h,days){const lim=Date.now()-days*DAYMS;const w=h.filter(x=>x.t>=lim);return w.length?w.reduce((a,b)=>b.p<a.p||(b.p===a.p&&b.t>a.t)?b:a):null;}
  const fd=(t,y)=>new Date(t).toLocaleDateString('es-ES',y?{day:'numeric',month:'short',year:'2-digit'}:{day:'numeric',month:'short'});
  function histChart(it,range){
    const all=histPts(it);if(!all.length)return `<p class="hint" style="margin:6px 0 0">Aún no hay historial. Pulsa «Comprobar precio» para empezar a guardarlo.</p>`;
    const days={'7':7,'30':30,'365':365}[range]||0;const lim=days?Date.now()-days*DAYMS:0;
    let h=all.filter(x=>x.t>=lim);const prev=all.filter(x=>x.t<lim).pop();if(prev)h=[{...prev,t:lim},...h];
    if(!h.length)h=[all[all.length-1]];
    const W=340,H=150,L=8,R=8,T=16,B=22;const t0=days?lim:h[0].t,t1=Math.max(Date.now(),h[h.length-1].t);
    const ps=h.map(x=>x.p);let lo=Math.min(...ps),hi=Math.max(...ps);if(hi-lo<0.01){hi+=1;lo=Math.max(0,lo-1);}const pad=(hi-lo)*.15;lo-=pad;hi+=pad;
    const X=t=>L+(t1===t0?0.5:(t-t0)/(t1-t0))*(W-L-R),Y=p=>T+(1-(p-lo)/(hi-lo))*(H-T-B);
    let d='';h.forEach((x,i)=>{d+=i?`H${X(x.t).toFixed(1)}V${Y(x.p).toFixed(1)}`:`M${X(x.t).toFixed(1)} ${Y(x.p).toFixed(1)}`;});d+=`H${X(t1).toFixed(1)}`;
    const area=d+`V${H-B}H${X(h[0].t).toFixed(1)}Z`;
    const mn=h.reduce((a,b)=>b.p<a.p?b:a);const last=h[h.length-1];
    const ticks=[t0,(t0+t1)/2,t1].map((t,i)=>`<text x="${X(t)}" y="${H-6}" text-anchor="${i===0?'start':i===2?'end':'middle'}">${fd(t,range==='all'||range==='365')}</text>`).join('');
    const lab=(x,txt,cls)=>{const cx=X(x.t),cy=Y(x.p);const anchor=cx<60?'start':cx>W-60?'end':'middle';return `<circle cx="${cx}" cy="${cy}" r="4.5" class="${cls}"/><text x="${cx}" y="${cy-9}" text-anchor="${anchor}" class="lbl">${txt}</text>`;};
    return `<svg class="hchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución del precio"><path d="${area}" class="ar"/><path d="${d}" class="ln"/>${lab(mn,eur(mn.p),'mn')}${mn!==last?`<circle cx="${X(last.t)}" cy="${Y(last.p)}" r="3.5" class="now"/>`:''}${ticks}</svg>`;
  }
  function histBox(it){
    const h=histPts(it);const rng=it._hr||(h.length&&h[h.length-1].t-h[0].t>40*DAYMS?'365':'all');
    const rows=[['Esta semana',minIn(h,7)],['Este mes',minIn(h,30)],['Este año',minIn(h,365)]];
    const now=num(it.price)>0?calc(it).after:0;
    const stat=rows.map(([l,x])=>`<div class="hs"><span>${l}</span>${x?`<b class="${now&&x.p>=now-0.005?'is-now':''}">${eur(x.p)}</b><small>${fd(x.t)}${now&&x.p>=now-0.005?' · como ahora':''}</small>`:'<b>—</b><small>sin datos</small>'}</div>`).join('');
    const btn=(k,t)=>`<button type="button" data-hr="${it.id}" data-r="${k}" aria-pressed="${rng===k}">${t}</button>`;
    return `<details class="histbox"${it._hopen?' open':''} data-hopen="${it.id}"><summary>Historial de precio${h.length?` · ${h.length} ${h.length===1?'registro':'registros'}`:''}${it.checkedAt?` · comprobado ${fd(new Date(it.checkedAt).getTime())}`:''}</summary>
      <div class="hstats">${stat}</div>
      <div class="hrange">${btn('7','7 días')}${btn('30','30 días')}${btn('365','1 año')}${btn('all','Todo')}</div>
      <div class="hwrap">${histChart(it,rng)}</div>
      ${h.length?`<details class="hlist"><summary>Ver registros</summary><table>${h.slice().reverse().map(x=>`<tr><td>${fd(x.t,true)}</td><td>${eur(x.p)}</td><td>${x.tot?eur(x.tot)+' con portes':''}</td><td>${esc(x.a)}</td></tr>`).join('')}</table></details>`:''}
    </details>`;
  }
  function findAny(id){let it=items.find(i=>i.id===id);if(it)return it;try{for(const o of sharedOwners.values())if(o.items.has(id))return o.items.get(id);}catch(e){}return null;}
  $('#view').addEventListener('click',e=>{const b=e.target.closest('[data-hr]');if(!b)return;const it=findAny(b.dataset.hr);if(!it)return;it._hr=b.dataset.r;
    const box=b.closest('.histbox');box.querySelectorAll('[data-hr]').forEach(x=>x.setAttribute('aria-pressed',x===b));box.querySelector('.hwrap').innerHTML=histChart(it,it._hr);});
  $('#view').addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('.histbox'))return;const it=findAny(d.dataset.hopen);if(it)it._hopen=d.open;},true);
  // Sub-categorías dentro de una categoría
  // Munición: atributos combinables (bio, trazadora, color, peso) en vez de más subcategorías
  const AMMO_CAT=/munici|bbs?\b|bolas|balines/i;
  const BBCOL={azul:'Azul',blue:'Azul',verde:'Verde',green:'Verde',amarill:'Amarilla',yellow:'Amarilla',roj:'Roja',red:'Roja',blanc:'Blanca',white:'Blanca',naranja:'Naranja',orange:'Naranja',negr:'Negra',black:'Negra'};
  function ammoAttrs(i){const sp=i.specs||{};const t=norm([i.product,i.variant,i.description&&'',i.tags,i.sub,i.color].join(' '));const out=[];
    const bio=sp.bbBio?/^s/i.test(sp.bbBio):/\bbio|biodegrad|organic|orgánic/.test(t);out.push(bio?'Bio':'No bio');
    const tr=sp.bbTracer?/^s/i.test(sp.bbTracer):/tracer|trazador/.test(t);if(tr)out.push('Trazadora');
    const cs=norm(i.color||'')+' '+t;for(const [k,v] of Object.entries(BBCOL))if(new RegExp('\\b'+k).test(cs)){out.push(v);break;}
    const g=(clean(sp.bbGrams)||(t.match(/\b0[.,]\d{2}\s?g/)||[''])[0]).replace('.',',').replace(/\s/g,'');if(g)out.push(g.replace(/g$/,' g'));
    return out;}
  const capW=w=>w?w.charAt(0).toUpperCase()+w.slice(1):'';
  function attrsOf(i){const c=catOf(i),sp=i.specs||{},t=norm([i.product,i.variant,i.sub,i.color].join(' '));const out=[];
    if(AMMO_CAT.test(c))out.push(...ammoAttrs(i));
    else{
      if(/golf/i.test(c)&&/\btees?\b/.test(t)||/^tees?$/i.test(clean(i.sub))){const mt=/bamb/.test(t)?'Bambú':/madera|wood/.test(t)?'Madera':/goma|rubber/.test(t)?'Goma':/pl[aá]stic|plastic/.test(t)?'Plástico':'';if(mt)out.push(mt);const h=t.match(/\b(\d{2,3})\s?mm\b/);if(h)out.push(h[1]+' mm');}
      if(/golf/i.test(c)&&/\b(bolas?|balls?)\b/.test(t)){const ly=t.match(/\b(\d)\s?(?:capas|piezas|piece|pieces|layers?)\b/);if(ly)out.push(ly[1]+' capas');out.push(/recuperad|lake|reacondic|usad|segunda mano|refurb/.test(t)?'Recuperadas':'Nuevas');}
      const col=clean(i.color).split(/[\s,/]+/)[0];if(col&&col.length<14)out.push(capW(norm(col)));
      const mat=clean(sp.material);if(mat&&mat.length<18)out.push(capW(norm(mat)));
      const sz=clean(i.size);if(sz&&sz.length<8)out.push('Talla '+sz);}
    splitList(i.compat).forEach(c=>{if(c.length<30)out.push('Para '+c);});
    tagList(i).forEach(g=>out.push('#'+g));
    return [...new Set(out)];}
  function facChips(list){if(!flt.cat)return '';const m=new Map();list.forEach(i=>attrsOf(i).forEach(a=>m.set(a,(m.get(a)||0)+1)));
    const on0=new Set(splitList(flt.fac||''));[...m.keys()].forEach(k=>{if(m.get(k)===list.length&&!on0.has(k)&&!k.startsWith('#'))m.delete(k);});if(m.size<1||(m.size<2&&!on0.size))return '';
    const on=new Set(splitList(flt.fac||''));const order=['Bio','No bio','Trazadora'];
    const ks=[...m.keys()].sort((a,b)=>{const ia=order.indexOf(a),ib=order.indexOf(b);if(ia>=0||ib>=0)return (ia<0?9:ia)-(ib<0?9:ib);const ga=/g$/.test(a),gb=/g$/.test(b);return ga!==gb?(ga?1:-1):a.localeCompare(b,'es');});
    return `<div class="subchips facs">${ks.map(k=>`<button type="button" data-fac="${esc(k)}" aria-pressed="${on.has(k)}">${esc(k)} <b>${m.get(k)}</b></button>`).join('')}${on.size?'<button type="button" data-fac="">Quitar filtros</button>':''}</div>`;}
  $('#view').addEventListener('click',e=>{const b=e.target.closest('[data-fac]');if(!b)return;const on=new Set(splitList(flt.fac||''));const k=b.dataset.fac;if(!k)on.clear();else if(on.has(k))on.delete(k);else{if(k==='Bio')on.delete('No bio');if(k==='No bio')on.delete('Bio');if(k==='Nuevas')on.delete('Recuperadas');if(k==='Recuperadas')on.delete('Nuevas');on.add(k);}flt.fac=[...on].join(', ');render();});
  function subChips(list){if(!flt.cat)return '';const fc=facChips(list);const m=new Map();list.forEach(i=>{const s=clean(i.sub);if(s)m.set(s,(m.get(s)||0)+1);});if(!m.size)return fc;
    return fc+`<div class="subchips"><button type="button" data-sub="" aria-pressed="${!flt.sub}">Todas</button>${[...m.entries()].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<button type="button" data-sub="${esc(k)}" aria-pressed="${norm(flt.sub)===norm(k)}">${esc(k)} <b>${n}</b></button>`).join('')}</div>`;}
  $('#view').addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(!b)return;flt.sub=b.dataset.sub;render();});

