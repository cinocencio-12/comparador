// Comparador · 14-compatibles.js
// «Aplica a / Compatible con»: qué accesorios sirven para qué artículo, respetando modelo y calibre
// (unas vainas para Chiappa Rhino 6 mm no salen en un Rhino de 4,5 mm).

  // Normaliza calibres y medidas: «6 mm», «6mm» → 6mm · «4,5 mm», «4.5mm» → 4.5mm
  const calNorm=s=>norm(s).replace(/(\d)[,.](\d)/g,'$1.$2').replace(/(\d)\s+(mm|cal|g)\b/g,'$1$2');
  const COMPAT_STOP=new Set(['de','del','la','el','los','las','para','con','y','en','a','modelo','modelos','serie','compatible','compatibles','todos','todas','revolver','revólver','pistola','rifle','airsoft','replica','réplica','co2','gas','muelle']);
  const ctoks=s=>new Set(calNorm(s).replace(/[^a-z0-9.\s-]/g,' ').split(/[\s-]+/).filter(t=>t&&!COMPAT_STOP.has(t)));
  // Rasgos del artículo destino: nombre, variante, marca, plataforma y calibre de su ficha técnica
  const targetToks=it=>ctoks([it.brand,it.product,it.variant,it.platform,(it.specs||{}).caliber].join(' '));
  const isCal=t=>/^\d+(\.\d+)?mm$/.test(t);
  // ¿La entrada «Aplica a» describe este artículo? Todas sus palabras deben estar; si dice calibre, debe coincidir.
  function fits(entry,it){const E=ctoks(entry);if(E.size<1)return false;const T=targetToks(it);
    for(const t of E){if(!T.has(t)){if(isCal(t)&&![...T].some(isCal))continue; // el destino no dice calibre: no lo descartamos por eso
        return false;}}
    // si el destino dice calibre y la entrada dice otro calibre distinto, no vale
    const ce=[...E].filter(isCal),ct=[...T].filter(isCal);if(ce.length&&ct.length&&!ce.some(c=>ct.includes(c)))return false;
    return [...E].some(t=>!isCal(t));}
  const compatOf=it=>splitList(it.compat);
  // Para un accesorio: artículos tuyos (pendientes o comprados) a los que sirve
  function servesFor(acc){const es=compatOf(acc);if(!es.length)return [];const me=key(groupName(acc));const seen=new Set();
    return items.filter(i=>i.status!=='discarded'&&key(groupName(i))!==me&&es.some(e=>fits(e,i))).filter(i=>{const k=key(groupName(i));if(seen.has(k))return false;seen.add(k);return true;});}
  // Para un artículo: accesorios tuyos que dicen servirle
  function accessoriesFor(it){const me=key(groupName(it));const seen=new Set();
    return items.filter(a=>a.status!=='discarded'&&key(groupName(a))!==me&&compatOf(a).some(e=>fits(e,it))).filter(a=>{const k=key(groupName(a));if(seen.has(k))return false;seen.add(k);return true;});}
  function compatHtml(offers){const f=offers[0];const sv=servesFor(f),ac=accessoriesFor(f);if(!sv.length&&!ac.length)return '';
    const row=i=>`<button type="button" class="cpt" data-open="${esc(key(groupName(i)))}">${thumb(i)||`<span class="ph">${svgI(catIcon(catOf(i)))}</span>`}<span><b>${esc(groupName(i))}</b><small>${esc(catOf(i))}${i.status==='bought'?' · ya lo tienes':''}</small></span></button>`;
    return `${sv.length?`<h3 class="lh">Sirve para</h3><div class="cpts">${sv.map(row).join('')}</div>`:''}${ac.length?`<h3 class="lh">Accesorios compatibles que tienes en la lista</h3><div class="cpts">${ac.map(row).join('')}</div>`:''}`;}
