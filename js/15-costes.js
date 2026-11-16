// Comparador · 15-costes.js
// Gasto aproximado de Claude (con tu clave) y espacio de fotos en la nube, visibles en Ajustes.

  // Precios orientativos en $ por millón de tokens (entrada, salida). Revisar si Anthropic los cambia.
  const jget=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d;}catch(e){return d;}},jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}};
  const PRICES=[[/haiku/i,1,5],[/sonnet/i,3,15],[/opus/i,5,25],[/fable|mythos/i,15,75]];
  const SEARCH_USD=0.01; // por búsqueda web
  function logUse(model,u){if(!u)return;const p=PRICES.find(([re])=>re.test(model||''))||[0,3,15];
    const usd=(num(u.input_tokens)+num(u.cache_creation_input_tokens)*1.25+num(u.cache_read_input_tokens)*0.1)*p[1]/1e6+num(u.output_tokens)*p[2]/1e6+num((u.server_tool_use||{}).web_search_requests)*SEARCH_USD;
    const m=new Date().toISOString().slice(0,7);const all=jget('apiUse',{});const r=all[m]||{calls:0,usd:0,inTok:0,outTok:0};
    r.calls++;r.usd+=usd;r.inTok+=num(u.input_tokens);r.outTok+=num(u.output_tokens);all[m]=r;
    const ks=Object.keys(all).sort();while(ks.length>12)delete all[ks.shift()];jset('apiUse',all);}
  // Cada llamada a Claude se anota sola (sin tocar el resto del código)
  const _fetch=window.fetch.bind(window);
  window.fetch=async(u,o)=>{const r=await _fetch(u,o);
    if(String(u).startsWith('https://api.anthropic.com/')&&r.ok){let model='';try{model=JSON.parse(o&&o.body||'{}').model;}catch(e){}
      r.clone().json().then(j=>logUse(model,j.usage)).catch(()=>{});}
    return r;};
  const toEurUsd=usd=>usd/((typeof FX!=='undefined'&&FX.USD)||1.08);
  async function drawCosts(){let box=$('#costBox');if(!box){box=document.createElement('div');box.className='apar';box.id='costBox';const a=$('#authBar');(a?a.parentNode:$('#settings')).insertBefore(box,a?a.nextSibling:null);}
    const all=jget('apiUse',{});const ks=Object.keys(all).sort().reverse();const m=new Date().toISOString().slice(0,7);const cur=all[m]||{calls:0,usd:0};
    const blobs=items.flatMap(i=>(i.images||[]).filter(v=>typeof v!=='string'));const mb=blobs.reduce((s,b)=>s+(b.size||0),0)/1048576;
    const mes=k=>new Date(k+'-01').toLocaleDateString('es-ES',{month:'long',year:'numeric'});
    box.innerHTML=`<h3>Gastos</h3>
      <p class="kv"><span>Claude este mes (${mes(m)})</span><b>≈ ${eur(toEurUsd(cur.usd))}</b></p>
      <p class="hint" style="margin:-4px 0 8px">${cur.calls} ${cur.calls===1?'lectura':'lecturas'} con tu clave. Aproximado: lo exacto está en console.anthropic.com.</p>
      ${ks.filter(k=>k!==m).slice(0,3).map(k=>`<p class="kv"><span>${mes(k)}</span><span>≈ ${eur(toEurUsd(all[k].usd))} · ${all[k].calls} lecturas</span></p>`).join('')}
      <p class="kv"><span>Fotos guardadas en el móvil${me?' y en la nube':''}</span><b>${blobs.length} · ${mb<1?Math.max(0.1,mb).toFixed(1):mb.toFixed(0)} MB</b></p>
      <p class="hint" style="margin:-4px 0 0">${me?`Firebase gratis llega a 1.024 MB: vas por el ${Math.max(0.1,mb/10.24).toFixed(1)} %.`:'Sin cuenta: solo en este móvil.'}</p>`;}
  $('#openSettings').addEventListener('click',()=>{if(!$('#settings').hidden)drawCosts();});
