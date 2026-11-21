// Comparador · 13-consejos.js
// Consejos de compra: ¿es buen momento? (historial de 90 días) y cesta óptima por tienda (envío gratis).

  // ---------- ¿Es buen momento para comprar? ----------
  // Junta el historial de todas las tiendas del artículo (precio con descuento, sin portes) y lo compara con el actual.
  function moment(offers){
    const valid=offers.filter(o=>canBuy(o)&&num(o.price)>0);if(!valid.length)return null;
    const now=Math.min(...valid.map(o=>calc(o).after));const lim=Date.now()-90*DAYMS;
    const pts=offers.flatMap(o=>histPts(o).filter(x=>x.t>=lim).map(x=>({...x,o})));
    if(pts.length<3)return null;
    const lo=pts.reduce((a,b)=>b.p<a.p?b:a);const avg=pts.reduce((s,x)=>s+x.p,0)/pts.length;
    if(now<=lo.p*1.005)return {k:'min',txt:'Mínimo de 90 días',now,lo,avg};
    if(now<=avg*0.97)return {k:'low',txt:'Por debajo de la media',now,lo,avg};
    if(now>=lo.p*1.10)return {k:'high',txt:`Caro ahora: estuvo a ${eur(lo.p)} el ${new Date(lo.t).toLocaleDateString('es-ES',{day:'numeric',month:'numeric'})}`,now,lo,avg};
    return {k:'mid',txt:'Precio normal',now,lo,avg};}
  const momentChip=m=>m&&m.k!=='mid'?`<span class="chip mom-${m.k}" title="Media 90 días: ${eur(m.avg)} · mínimo: ${eur(m.lo.p)}">${m.k==='min'?'★ ':m.k==='high'?'▲ ':'▼ '}${esc(m.txt)}</span>`:'';

  // ---------- Cesta óptima: juntar compras en una tienda para llegar al envío gratis ----------
  // Para cada tienda con «envío gratis desde», mira qué comprarías allí (lo que es más barato en esa tienda)
  // y si añadiendo otro artículo de tus listas que también vende llegas al mínimo y ahorras.
  function basketTips(){
    const P=items.filter(i=>(i.status||'pending')==='pending'&&!isUnread(i)&&num(i.price)>0);
    const G=new Map();P.forEach(i=>{const k=key(groupName(i));if(!G.has(k))G.set(k,[]);G.get(k).push(i);});
    const best=new Map();G.forEach((v,k)=>best.set(k,v.reduce((a,b)=>calc(b).total<calc(a).total?b:a)));
    const shops=new Map();P.forEach(i=>{const s=shopKey(i);if(!shops.has(s))shops.set(s,[]);shops.get(s).push(i);});
    const tips=[];
    shops.forEach(list=>{
      const F=Math.max(...list.map(freeOf));const C=Math.max(...list.map(shipOf));if(!(F>0&&C>0))return;
      const basket=list.filter(i=>best.get(key(groupName(i)))===i);if(!basket.length)return;
      const sum=basket.reduce((s,i)=>s+calc(i).after,0);if(sum>=F)return;
      const falta=F-sum;
      // candidatos: otros artículos tuyos que esta tienda también vende
      const cands=list.filter(i=>!basket.includes(i)).map(i=>{const b=best.get(key(groupName(i)));
        const ahorro=C+calc(b).total-calc(i).after; // portes que te ahorras + lo que pagarías por él en su mejor tienda − lo que cuesta aquí
        return {i,ahorro,llega:calc(i).after>=falta};}).filter(x=>x.llega&&x.ahorro>0.5).sort((a,b)=>b.ahorro-a.ahorro);
      tips.push({shop:shopOf(basket[0]),F,C,sum,falta,basket,best:cands[0]||null});});
    return tips.sort((a,b)=>(b.best?b.best.ahorro:0)-(a.best?a.best.ahorro:0)||a.falta-b.falta);}
  function basketHtml(tips,max){if(!tips.length)return '';
    return tips.slice(0,max||3).map(t=>`<div class="tip"><b>${esc(t.shop)}: te faltan ${eur(t.falta)} para el envío gratis</b><small>Comprarías allí ${t.basket.length} ${t.basket.length===1?'cosa':'cosas'} (${eur(t.sum)}); el envío gratis empieza en ${eur(t.F)} y los portes son ${eur(t.C)}.</small>${t.best?`<span class="tipgo">Si añades <a href="#" data-open="${esc(key(groupName(t.best.i)))}">${esc(fullName(t.best.i))}</a> (${eur(calc(t.best.i).after)} aquí) llegas y ahorras <b>${eur(t.best.ahorro)}</b>.</span>`:''}</div>`).join('');}
