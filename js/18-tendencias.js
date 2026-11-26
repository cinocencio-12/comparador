// Comparador · 18-tendencias.js
// Pestaña «Tendencias» (Explorar): cuánto ha bajado o subido cada producto en un periodo (7 días, mes, año, desde el principio),
// con mínimos históricos y bajadas engañosas. Solo usa el historial guardado (desde que se añadió cada producto).
  let trPer='30',trOrd='down';
  const TR_PER=[['7','7 días'],['30','Este mes'],['365','Este año'],['all','Desde el principio']];
  // Variación de una oferta en el periodo: precio al inicio del periodo (el último registro anterior, o el primero dentro) frente al actual.
  function trendOf(it,per){
    const h=(it.history||[]).filter(x=>x.price>0).map(x=>({t:new Date(x.at).getTime(),p:x.price})).filter(x=>x.t).sort((a,b)=>a.t-b.t);
    const now=num(it.price);if(!(now>0)||!h.length)return null;
    const from=per==='all'?-Infinity:Date.now()-(+per)*864e5;
    const before=h.filter(x=>x.t<=from),inside=h.filter(x=>x.t>from);
    const start=before.length?before[before.length-1]:inside[0];if(!start)return null;
    const pts=before.length?[start,...inside]:inside;
    const lo=Math.min(...h.map(x=>x.p)),hi=Math.max(...h.map(x=>x.p));
    const pct=(now-start.p)/start.p*100,ti=trendInfo(it);
    return {it,start,now,diff:now-start.p,pct,lo,hi,pts,n:h.length,
      atLow:now<=lo*1.005&&h.length>1&&hi>lo,fake:ti.fake,rising:ti.rising,since:h[0].t};
  }
  function renderTrends(){
    const rows=items.filter(i=>(i.status||'pending')==='pending'&&matches(i)).map(i=>trendOf(i,trPer)).filter(Boolean);
    const moved=rows.filter(r=>Math.abs(r.pct)>=0.5);
    const down=moved.filter(r=>r.pct<0),up=moved.filter(r=>r.pct>0),lows=rows.filter(r=>r.atLow),fakes=rows.filter(r=>r.fake);
    const saved=down.reduce((s,r)=>s-r.diff,0);
    let list=trOrd==='down'?down.sort((a,b)=>a.pct-b.pct):trOrd==='up'?up.sort((a,b)=>b.pct-a.pct):trOrd==='low'?lows.sort((a,b)=>a.pct-b.pct):trOrd==='fake'?fakes:moved.sort((a,b)=>Math.abs(b.pct)-Math.abs(a.pct));
    const oldest=rows.length?Math.min(...rows.map(r=>r.since)):0;
    const d=t=>new Date(t).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'2-digit'});
    const chip=(k,l,n)=>`<button class="btn small${trOrd===k?' primary':''}" type="button" data-trord="${k}">${l} · ${n}</button>`;
    const head=`<div class="trhead">
      <div class="toolbar" role="group" aria-label="Periodo">${TR_PER.map(([k,l])=>`<button class="btn small${trPer===k?' primary':''}" type="button" data-trper="${k}">${l}</button>`).join('')}</div>
      <div class="trstats">
        <div class="trstat"><b>${down.length}</b><span>bajan</span></div><div class="trstat"><b>${up.length}</b><span>suben</span></div>
        <div class="trstat"><b>${saved>0.005?eur(saved):'—'}</b><span>bajada acumulada</span></div></div>
      <div class="toolbar">${chip('down','▼ Bajadas',down.length)}${chip('up','▲ Subidas',up.length)}${chip('low','★ Mínimo histórico',lows.length)}${chip('fake','⚠ Bajada engañosa',fakes.length)}${chip('all','Todos los cambios',moved.length)}</div>
      ${trPer!=='all'&&oldest&&Date.now()-oldest<(+trPer)*864e5?`<p class="hint">Solo hay precios guardados desde el ${d(oldest)}: este periodo cuenta desde ahí.</p>`:''}
      ${trOrd==='fake'?'<p class="hint">Han bajado respecto a la comprobación anterior, pero siguen por encima de su mínimo de los últimos 30 días: el «descuento» no es tan bueno.</p>':''}
    </div>`;
    if(!rows.length)return head+`<div class="empty">Aún no hay precios comprobados. Usa «Comprobar precio» (o espera a la comprobación automática) para empezar a ver tendencias.</div>`;
    if(!list.length)return head+`<div class="empty">Nada en este apartado para el periodo elegido.</div>`;
    return head+`<div class="list">${list.map(r=>{const i=r.it,cls=r.pct<-0.5?'down':r.pct>0.5?'up':'';
      return `<article class="product trrow" data-lp="${i.id}"><div class="row" style="display:flex;gap:12px;align-items:center;padding:12px 14px">
        ${thumb(i)}<div style="flex:1;min-width:0"><button type="button" class="tname" data-open="${esc(key(groupName(i)))}">${esc(fullName(i))}</button>
        <div class="meta">${esc(shopOf(i))} · ${eur(r.start.p)} (${d(r.start.t)}) → <b>${eur(r.now)}</b></div>
        <div class="meta">Mín. ${eur(r.lo)} · máx. ${eur(r.hi)} · ${r.n} ${r.n===1?'registro':'registros'}${r.atLow?' · <b style="color:var(--accent)">★ mínimo histórico</b>':''}${r.fake?' · <b style="color:var(--warn,#f59e0b)">⚠ bajada engañosa</b>':''}${r.rising?' · ▲ subiendo':''}</div></div>
        <div style="text-align:right"><div class="trend"><span class="${cls}">${r.pct<-0.5?'▼':r.pct>0.5?'▲':'='} ${fmtNum(Math.abs(r.pct),r.pct&&Math.abs(r.pct)<10?1:0)} %</span></div>
        <div class="meta">${r.diff<0?'−':'+'}${eur(Math.abs(r.diff))}</div>${spark(r.pts)}</div></div></article>`;}).join('')}</div>`;
  }
  document.addEventListener('click',e=>{const p=e.target.closest('[data-trper]'),o=e.target.closest('[data-trord]');if(!p&&!o)return;
    if(p)trPer=p.dataset.trper;if(o)trOrd=o.dataset.trord;render();});
