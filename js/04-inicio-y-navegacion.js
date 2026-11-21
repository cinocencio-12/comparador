// Comparador · 04-inicio-y-navegacion.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- botón «atrás» del móvil: vuelve un paso dentro de la app en vez de salir ----------
  const vis=id=>{const e=document.getElementById(id);return e&&!e.hidden;};
  function navDeep(){return vis('linkSheet')||vis('shareSheet')||vis('form')||vis('settings')||vis('addSheet')||!!prodKey||revOpen||navTab!=='home'||selMode||cmpOpen||!!flt.sub||!!flt.cat||allMode||!!flt.q||!!flt.state||space!=='mine';}
  function navLevel(){return [vis('cpSheet'),vis('bkSheet'),vis('tdSheet'),vis('addSheet'),vis('linkSheet'),vis('shareSheet'),vis('form'),!!prodKey,revOpen,vis('settings'),selMode,cmpOpen,!!flt.sub,!!flt.fac,!!(flt.cat||allMode),!!(flt.q||flt.state),space!=='mine',navTab==='lists'&&!listHome,navTab==='explore'&&flt.person===ME,navTab!=='home'].filter(Boolean).length;}
  let hDepth=0;
  function navEnsure(){try{const d=navLevel()+1;while(hDepth<d){history.pushState({cmp:1,d:hDepth+1},'');hDepth++;}}catch(e){}}
  // Cada toque deja las entradas de «atrás» preparadas (con toque, Android no las salta)
  document.addEventListener('click',()=>setTimeout(navEnsure,0),true);
  document.addEventListener('change',()=>setTimeout(navEnsure,0),true);
  function navBack(){
    if(vis('cpSheet')){closeCopy();return true;}
    if(vis('bkSheet')){closeBulk();return true;}
    if(vis('tdSheet')){closeShop();return true;}
    if(vis('addSheet')){closeAdd();return true;}
    if(vis('linkSheet')){closeLink();return true;}
    if(vis('shareSheet')){closeShare();return true;}
    if(vis('form')){closeForm();return true;}
    if(prodKey){closeProd();return true;}
    if(revOpen){closeReview();return true;}
    if(vis('shareSheet')){closeShare();return true;}
    if(vis('form')){closeForm();return true;}
    if(vis('settings')){$('#settings').hidden=true;return true;}
    if(selMode){$('#selModeBtn').click();return true;}
    if(cmpOpen){cmpOpen=false;render();return true;}
    if(flt.fac){flt.fac='';render();return true;}
    if(flt.sub){flt.sub='';render();return true;}
    if(flt.cat||allMode){flt.cat='';flt.fac='';allMode=false;saveFlt();render();return true;}
    if(flt.q||flt.state){flt.q='';flt.state='';$('#q').value='';render();return true;}
    if(space!=='mine'){space='mine';tab='compare';render();return true;}
    if(navTab==='lists'&&!listHome){listHome=true;flt.person='';render();return true;}
    if(navTab==='explore'&&flt.person===ME){flt.person='';allMode=false;navTab='lists';listHome=true;render();return true;}
    if(navTab!=='home'){setNav('home');return true;}
    return false;}
  window.addEventListener('popstate',()=>{hDepth=Math.max(0,hDepth-1);if(navBack()){if(!vis('form'))window.scrollTo({top:0});}else if(hDepth>0)history.back();});

  // ---------- Comparador 2.0: preferencias, navegación por secciones e Inicio ----------
  let navTab='home';const openG=new Set();
  const PREF={theme:'auto',navpos:'bottom',view:'compact',text:'normal'};
  const pref=k=>{try{return localStorage.getItem('pref_'+k)||PREF[k];}catch(e){return PREF[k];}};
  const setPref=(k,v)=>{try{localStorage.setItem('pref_'+k,v);}catch(e){}applyPrefs();};
  function applyPrefs(){const r=document.documentElement;const t=pref('theme');if(t==='auto')delete r.dataset.theme;else r.dataset.theme=t;
    r.dataset.nav=pref('navpos');r.dataset.text=pref('text');
    const dark=t==='auto'?matchMedia('(prefers-color-scheme: dark)').matches:t==='dark';
    document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',dark?'#11151B':'#F5F6F3'));
    document.querySelectorAll('.seg[data-pref]').forEach(g=>g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===pref(g.dataset.pref)))));}
  applyPrefs();matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{applyPrefs();render();});
  document.querySelectorAll('.seg[data-pref]').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setPref(g.dataset.pref,b.dataset.v);render();}));
  // Módulos de Inicio: mostrar, ocultar y ordenar
  const MODS=[['hero','Banner de bienvenida'],['quick','Accesos rápidos'],['stats','Tu biblioteca de compras'],['track','Seguimiento de precios'],['basket','Cesta óptima (envío gratis)'],['cats','Categorías'],['review','Centro de revisión'],['spaces','Mis compras y compartido']];
  const MODS_DEF=['hero:1','quick:1','stats:1','track:1','basket:1','cats:1','review:1','spaces:1'];
  function mods(){let a;try{a=JSON.parse(localStorage.getItem('homeMods')||'null');}catch(e){}if(!Array.isArray(a))a=MODS_DEF;
    const ids=MODS.map(m=>m[0]);a=a.filter(x=>ids.includes(x.split(':')[0]));ids.forEach(id=>{if(!a.some(x=>x.startsWith(id+':'))){if(id==='hero'||id==='quick')a.unshift(id+':1');else if(id==='basket'){const t=a.findIndex(x=>x.startsWith('track:'));a.splice(t<0?a.length:t+1,0,'basket:1');}else a.push(id+':1');}});const h=a.findIndex(x=>x.startsWith('hero:'));if(h>0){const [x]=a.splice(h,1);a.unshift(x);}return a;}
  function saveMods(a){try{localStorage.setItem('homeMods',JSON.stringify(a));}catch(e){}drawMods();render();}
  function drawMods(){const a=mods();$('#modList').innerHTML=a.map((x,i)=>{const [id,on]=x.split(':');const nm=(MODS.find(m=>m[0]===id)||[])[1];
    return `<div class="m"><label><input type="checkbox" data-mod="${id}" ${on==='1'?'checked':''}> ${esc(nm)}</label><button type="button" data-mup="${i}" aria-label="Subir">↑</button><button type="button" data-mdn="${i}" aria-label="Bajar">↓</button></div>`;}).join('');}
  drawMods();
  $('#modList').addEventListener('change',e=>{const c=e.target.closest('[data-mod]');if(!c)return;saveMods(mods().map(x=>x.startsWith(c.dataset.mod+':')?c.dataset.mod+':'+(c.checked?1:0):x));});
  $('#modList').addEventListener('click',e=>{const u=e.target.closest('[data-mup]'),d=e.target.closest('[data-mdn]');if(!u&&!d)return;const a=mods();const i=+(u?u.dataset.mup:d.dataset.mdn),j=u?i-1:i+1;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];saveMods(a);});
  $('#modReset').addEventListener('click',()=>{['theme','navpos','view','text'].forEach(k=>{try{localStorage.removeItem('pref_'+k);}catch(e){}});applyPrefs();saveMods(MODS_DEF.slice());setStatus('Apariencia e Inicio restablecidos.');});
  // Secciones
  const NAVTABS={explore:['compare','shops'],lists:['gifts','buy','shared'],buys:['done','discarded']};
  function setNav(n){if(n==='add'){openAdd();return;}if(n==='review'){navTab='review';prodKey=null;openReview();return;}prodKey=null;revOpen=false;revKind=null;navTab=n;selMode=false;sel.clear();cmpOpen=false;
    if(n==='home'){flt.cat='';flt.sub='';flt.fac='';allMode=false;space='mine';}
    if(n==='explore'&&!NAVTABS.explore.includes(tab))tab=space==='mine'?'compare':'shared';
    if(n==='lists'){tab='gifts';listHome=true;flt.person='';}if(n==='buys')tab='done';
    render();window.scrollTo({top:0});}
  $('#bnav').addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b)setNav(b.dataset.nav);});
  function openAdd(){$('#addBg').hidden=$('#addSheet').hidden=false;setTimeout(navEnsure,0);}
  function closeAdd(){$('#addBg').hidden=$('#addSheet').hidden=true;}
  $('#addBg').addEventListener('click',closeAdd);$('#fShot').addEventListener('change',closeAdd);
  $('#addLink').addEventListener('click',()=>{closeAdd();$('#openForm').click();});
  // Buscar desde Inicio
  $('#hq').addEventListener('keydown',e=>{if(e.key!=='Enter')return;const v=$('#hq').value.trim();if(!v)return;flt.q=v;$('#q').value=v;$('#hq').value='';navTab='explore';tab='compare';render();setTimeout(()=>$('#q').focus(),50);});
  // Inicio
  function homeTrack(){const ups=[],dns=[];items.filter(i=>(i.status||'pending')==='pending').forEach(i=>{const h=histPts(i);if(h.length<2)return;const a=h[h.length-2].p,b=h[h.length-1].p;if(b<a-0.005)dns.push([i,a-b,b]);else if(b>a+0.005)ups.push([i,b-a,b]);});
    dns.sort((x,y)=>y[1]-x[1]);return{ups,dns};}
  function renderHome(){const pend=groups('pending');const allPend=items.filter(i=>(i.status||'pending')==='pending');
    const best=pend.reduce((s,g)=>{const v=g.offers.filter(o=>!isUnread(o));return s+(v.length?Math.min(...v.map(o=>calc(o).total)):0);},0);
    const M={
      hero:()=>`<section class="hmod"><div class="hbanner"><b>Las mejores ofertas, en un solo lugar</b><small>${pend.length?`${pend.length} productos vigilados. Comprueba solo los que quieras.`:'Guarda productos desde cualquier tienda con Compartir → Comparador.'}</small><button type="button" id="hExplore">Explorar ofertas</button><img src="icons/logo.png" alt="" onerror="this.remove()"></div></section>`,
      quick:()=>{const al=allPend.filter(hasAlert).length;const rv=revNew();const bt=items.filter(i=>i.status==='bought').length;
        const q=(id,ic,hue,tx,n)=>`<button type="button" class="qtile" id="${id}" style="${hueOf(hue)}"><span class="i">${svgI(ic)}</span>${tx}${n?`<em>${typeof n==='number'&&id==='qReview'?huevo(n):n}</em>`:''}</button>`;
        return `<section class="hmod"><div class="qtiles">${q('qAlerts','bell','alertas','Alertas',al)}${q('qReview','shield','revision','Revisión',rv)}${q('qLists','gift','listasx','Listas',0)}${q('qBuys','box','comprasz','Compras',bt)}</div></section>`;},
      stats:()=>{const nl=allPeople().length+1;const ns=owners().length;const k=(ic,hue,n,l,go)=>`<button type="button" class="kpi" data-go="${go}" style="${hueOf(hue)}"><span class="i">${svgI(ic)}</span><b>${n}</b><small>${l}</small></button>`;
        return `<section class="hmod"><div class="kpis">${k('box','productos',pend.length,'Productos','explore')}${k('tag','ofertasq',allPend.length,'Ofertas','explore')}${k('gift','listasx',nl,'Listas','lists')}${k('users','compart',ns,'Compartidas','lists')}</div><div class="bestline"><span>Si compras lo más barato de cada cosa<br><small>con portes e importación estimada</small></span><b>${eur(best)}</b></div></section>`;},
      track:()=>{const t=homeTrack();const hit=bestOfGroups(allPend.filter(i=>num(i.target)>0&&!isUnread(i)&&calc(i).total<=num(i.target)+0.005));const watch=new Set(allPend.filter(hasAlert).map(i=>key(groupName(i)))).size;return `<section class="hmod"><div class="track"><h2 style="margin:0;font:800 1.05rem var(--f-display)">Seguimiento de precios</h2>${hit.length?`<ul class="hits">${hit.map(x=>`<li data-open="${esc(key(groupName(x.i)))}"><span>🎯 ${esc(groupName(x.i))} · ${esc(shopOf(x.i))}</span><b class="dn">${eur(x.t)}</b></li>`).join('')}</ul>`:''}${watch?`<p class="hint" style="margin:6px 0 0">${watch} ${watch===1?'producto vigilado':'productos vigilados'} con aviso.</p>`:''}<div class="row"><span class="dn">↓ ${t.dns.length} ${t.dns.length===1?'bajada':'bajadas'}</span><span class="up">↑ ${t.ups.length} ${t.ups.length===1?'subida':'subidas'}</span></div>${t.dns.length?`<ul>${t.dns.slice(0,3).map(([i,d,b])=>`<li><span>${esc(fullName(i))} · ${esc(shopOf(i))}</span><b class="dn">−${eur(d)} → ${eur(b)}</b></li>`).join('')}</ul>`:`<p class="hint" style="margin:8px 0 0">Pulsa ⟳ arriba, marca los productos que quieras y compruébalos.</p>`}</div></section>`;},
      basket:()=>{const t=basketTips().filter(x=>x.best);return t.length?`<section class="hmod"><h2>Junta y ahorra portes</h2>${basketHtml(t,3)}</section>`:'';},
      cats:()=>`<section class="hmod"><h2>Mis categorías<button type="button" id="hCustom">Personalizar</button></h2>${pend.length?catGrid(pend.map(g=>g.offers[0]),()=>0,true):'<div class="empty">Nada guardado aún. Pulsa «Añadir» abajo o, en la tienda, Compartir → Comparador.</div>'}</section>`,
      review:()=>{const n=k=>+($('#qn-'+k).textContent||0);const a=n('missing'),b=n('nocat'),c=n('nophoto');if(!a&&!b&&!c)return `<section class="hmod"><button type="button" class="revline" id="hReview">Centro de revisión · todo en orden<span class="go">Abrir ›</span></button></section>`;
        return `<section class="hmod"><button type="button" class="revline" id="hReview">Centro de revisión${a?` · <b>${a}</b> sin datos`:''}${b?` · <b>${b}</b> sin clasificar`:''}${c?` · <b>${c}</b> sin fotos`:''}<span class="go">Revisar ›</span></button></section>`;},
      spaces:()=>owners().length?`<section class="hmod"><h2>Compartido contigo</h2><nav class="spacebar">${$('#spaceBar').innerHTML}</nav></section>`:''};
    return mods().filter(x=>x.endsWith(':1')).map(x=>(M[x.split(':')[0]]||(()=>''))()).join('');}
  document.addEventListener('click',e=>{if(e.target.closest('#hCustom')){$('#openSettings').click();setTimeout(()=>$('#modList').scrollIntoView({behavior:'smooth',block:'center'}),80);}
    if(e.target.closest('#hReview')||e.target.closest('#qReview')){openReview();}
    if(e.target.closest('#hExplore')){setNav('explore');}
    if(e.target.closest('#qLists')){setNav('lists');}
    if(e.target.closest('#qBuys')){setNav('buys');}
    if(e.target.closest('#qAlerts')){setNav('explore');flt.q='';const w=items.filter(i=>(i.status||'pending')==='pending'&&hasAlert(i));setStatus(w.length?`${w.length} ${w.length===1?'oferta tiene':'ofertas tienen'} aviso de precio o stock. Pon el aviso en la ficha de cada producto.`:'Aún no tienes avisos. Abre un producto y usa «Avísame».');}
    const kg=e.target.closest('.kpi[data-go]');if(kg)setNav(kg.dataset.go);});
  // Vista compacta de productos
  const viewSeg=()=>`<div class="vseg" role="group" aria-label="Vista de productos"><button type="button" data-vw="compact" aria-pressed="${pref('view')==='compact'}">Compacta</button><button type="button" data-vw="detail" aria-pressed="${pref('view')==='detail'}">Detallada</button></div>`;
  document.addEventListener('click',e=>{const b=e.target.closest('[data-vw]');if(b){openG.clear();setPref('view',b.dataset.vw);render();return;}
    const c=e.target.closest('[data-open]');if(c){openProd(c.dataset.open);return;}
    const k=e.target.closest('[data-collapse]');if(k){openG.delete(k.dataset.collapse);render();}});
  function compactCard(g){const valid=g.offers.filter(canBuy);const lt=valid.length?valid.reduce((a,b)=>calc(b).total<calc(a).total?b:a):g.offers[0];
    const img=(g.offers.slice().sort((a,b)=>String(b.coverAt||'').localeCompare(String(a.coverAt||''))).find(o=>(o.images||[])[0])||{}).images;const c=calc(lt);const shops=new Set(g.offers.map(shopOf)).size;
    const noShip=!(num(lt.shipping)>0)&&!(num(lt.freeFrom)>0)&&!/gratis|free/i.test(lt.notes||'');
    const up=unitPrice(lt);const lbl=(up?`<small class="upr">${upTxt(up)}</small>`:'')+(!valid.length?'<small class="est">sin precio</small>':noShip?'<small class="est">sin portes</small>':(inh(lt,'shipping')||inh(lt,'freeFrom'))?'<small class="est">portes supuestos</small>':outsideEU(lt)?'<small class="est">total estimado</small>':'<small>coste total</small>');
    const allOut=g.offers.every(o=>/agotad|sin stock|no disponible|out of stock/.test(norm(o.availability)));
    const sub=[lt.brand,lt.variant].map(clean).filter(Boolean).join(' · ');
    return `<button type="button" class="ccard" data-open="${esc(key(g.name))}"><span class="ph">${img&&img[0]?imgTag(img[0],''):svgI(catIcon(g.cat))}</span><span class="bd"><h3>${esc(g.name)}</h3>${sub?`<span class="sub">${esc(sub)}</span>`:''}<span class="sub">${shops} ${shops===1?'tienda':'tiendas'}${shops>1?' · comparación activa':''}</span><span class="chips">${momentChip(moment(g.offers))}${allOut?'<span class="chip err">Agotado</span>':''}${prioChip(lt)}</span><span class="pr"><b>${valid.length?eur(c.total):'—'}</b>${lbl}</span><span class="go">Ver ofertas y evolución ›</span></span></button>`;}




