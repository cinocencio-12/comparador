// Comparador · 08-claude-y-monedas.js
// Parte del código de la app, que se carga en orden desde index.html (ver js/LEEME.md).
  // ---------- Claude ----------
  const FIELDS=`Responde SOLO con un objeto JSON, sin texto alrededor, con esta forma: {"products":[ ...un objeto por producto... ]}
Cada objeto de producto lleva estas claves:
{"product": nombre del producto SIN la variante (marca + modelo),
 "variant": versión o variante concreta de ESTA oferta (p. ej. Full, Lite, Junior, Pro, talla, color, capacidad, nº de unidades). Fíjate bien en la seleccionada; "" si no hay,
 "brand": marca,
 "sku": referencia de la tienda (Referencia, SKU, Ref., código de artículo), "" si no hay,
 "mpn": referencia o modelo del fabricante si aparece aparte, "" si no,
 "ean": código EAN/GTIN/código de barras si aparece, "" si no,
 "category": tipo de producto en español, corto y genérico (ver lista de categorías abajo),
 "sub": subcategoría (ver lista de categorías abajo); "" si no encaja ninguna,
 "units": unidades que trae el pack o bolsa (4000 BBs → 4000, caja de 12 bolas → 12, bolsa de 50 tees → 50); "" si se vende suelto,
 "size": talla seleccionada o disponible en esta oferta (ropa y calzado: "M", "38", "S/M", "3-4 años"…); si hay varias y ninguna está elegida, lista corta de las disponibles; "" si no aplica,
 "color": color de esta oferta/variante (p. ej. "Negro", "Azul marino", "Estampado flores"); "" si no aplica,
 "platform": modelo o plataforma al que pertenece o para el que es el producto (p. ej. "Hi-Capa 5.1", "Glock 17", "CAM870", "M4", "AK"); "" si no aplica,
 "compatible": lista de modelos con los que la tienda dice que es compatible (sobre todo piezas y accesorios), con marca, modelo y calibre si importa (p. ej. "Chiappa Rhino 50DS 6 mm", no "revólveres"); [] si no lo dice,
 "tags": hasta 5 rasgos cortos útiles para filtrar que no estén ya en categoría, subcategoría o color: función, tipo o material (p. ej. ["reductoras de potencia","revólver","latón"]); [] si no hay,
 "store": nombre de la tienda,
 "url": URL de la página del producto,
 "shippingCurrency": moneda del coste de envío si es distinta de la del precio; si no, la misma que "currency",
 "country": código ISO de 2 letras del país desde el que vende/envía la tienda (ES, PT, DE, TW, JP, HK, CN, US, GB…); "" si no se sabe,
 "currency": código ISO 4217 de la moneda en que están los precios (EUR, USD, GBP, JPY, TWD, HKD, CNY, AUD, CAD…). Fíjate en el símbolo y en el país de la tienda: "NT$" = TWD, "¥" o "円" = JPY (CNY si la tienda es china), "£" = GBP, "HK$" = HKD, "$" en tienda de EE. UU. = USD. Si la tienda tiene selector de moneda, usa la que esté seleccionada en la página. Si dudas entre USD y HKD o entre JPY y CNY, decide por el país y el dominio de la tienda. NO conviertas: devuelve los importes tal como aparecen y su moneda,
 "price": precio actual de venta con IVA antes de cupones, número, en la moneda de "currency",
 "discount": SOLO un descuento extra que aún no está aplicado en "price" (un cupón o código, o un % extra que se aplica en la cesta). Si el precio ya aparece rebajado (precio tachado), eso NO es descuento: pon 0,
 "discountType": "pct" o "eur",
 "code": código de cupón si aparece, si no "",
 "vatExcl": true si la web muestra el precio SIN IVA ("sin IVA", "+ IVA", "IVA no incluido", "excl. VAT", "netto", "HT"); false si lo incluye o no lo dice,
 "shipping": coste de envío estándar en euros, 0 si es gratis, null si no aparece,
 "freeFrom": importe mínimo para envío gratis si aparece, si no 0,
 "description": descripción del producto en español, fiel a la tienda, con las características y especificaciones clave (máx. 900 caracteres, puedes usar saltos de línea),
 "images": lista de URLs absolutas de las fotos del producto (galería principal, en la mayor resolución disponible, máx. 8; nada de logos, iconos ni otros productos),
 "specs": SOLO si el producto es un arma o réplica (airsoft, aire comprimido, CO2, balines, etc.: pistolas, revólveres, rifles, escopetas, subfusiles, lanzagranadas…) o una batería, cargador o munición, un objeto con su ficha técnica tal como la da la tienda (especificaciones, características, tabla técnica o descripción), en español. Donde se indican opciones, usa EXACTAMENTE una de ellas (o varias separadas por coma si se marca «varias»): {"system": sistema (Eléctrica (AEG) | Eléctrica (AEP) | Gas con blowback (GBB) | Gas sin blowback (NBB) | CO₂ | HPA (aire a presión) | Muelle | Gas o CO₂ (dual)), "gas": gases que admite, varias (Green gas, Top gas / Red gas, Black gas, Propano (con adaptador), CO₂ 12 g, CO₂ 88/90 g, HPA), "shotsPerFill": disparos por cápsula o carga, "battery": tipo de batería (LiPo | Li-ion | LiFe | NiMH | Pilas), "batVolt": voltaje (7,4 V (LiPo 2S) | 11,1 V (LiPo 3S) | 6,6 V (LiFe 2S) | 9,9 V (LiFe 3S) | 8,4 V (NiMH 7 celdas) | 9,6 V (NiMH 8 celdas) | 1,5 V | 3,7 V), "batCap": capacidad ("1200 mAh"), "batC": descarga (15C | 20C | 25C | 30C | 35C | 40C | 50C | 60C; «x30» o «30C» = 30C; si da dos cifras como 25C/50C usa la continua, la primera), "batPlug": conector (Mini Tamiya | Deans (T-plug) | XT30 | XT60), "batForm": formato (Stick | Nunchuck (2 cuerpos) | Butterfly | Buffer tube | Brick / PEQ), "cellType": si usa pilas, tipo (AAA | AA | CR123A | CR2032 | 9 V | 18650), "cellCount": número de pilas, "batIncl": si la batería/pilas vienen incluidas (Sí | No | Opcional (pack)), "chargerIncl": cargador incluido (Sí | No), "fps": velocidad en FPS (si da un rango, «120-250»), "ms": velocidad en m/s (rango igual), "joules": potencia máxima en julios (rango igual), "stock": culata (Fija | Plegable / abatible | Retráctil / telescópica | Plegable y retráctil | Ajustable (carrillera / cantonera) | Bullpup | Sin culata), "rails": tiene raíles (Sí | No), "railType": tipo de raíl, varias (Picatinny / RIS 20 mm | Weaver | Cola de milano 11 mm | KeyMod | M-LOK | Raíl inferior (linterna)), "blowback": Sí | No, "caliber": calibre (6 mm BB | 8 mm BB | 4,5 mm (balín) | 4,5 mm acero (BB) | 5,5 mm | 40 mm (granada)), "hopup": Ajustable | Fijo | No, "fireMode": modos de disparo, varias (Semi | Semi y Full | Semi, ráfaga y Full | Cerrojo (bolt) | Tiro a tiro | Doble acción | Simple y doble acción), "material", "body": material del cuerpo/receiver, "length": longitud, "weight": peso, "barrel": longitud del cañón interior, "magCap": capacidad del cargador, "magType": Low-cap | Mid-cap | Hi-cap | Cápsula / cartuchos | Tambor (drum), "magMaterial": material del cargador, "bbWeight": peso de BB recomendado, "safety": seguro, "holster": tipo de funda, "color", "included": qué incluye la caja}. Omite las claves que no aparezcan (no las inventes ni las calcules). Para cualquier otro producto, {},
 "availability": disponibilidad tal como la indica la tienda, corta: "En stock", "Agotado", "Pocas unidades", "Bajo pedido", "Reserva"… "" si no aparece,
 "notes": una frase con otros datos útiles: precio anterior tachado, fin de la oferta, plazo de entrega. "" si nada,
 "shot": (solo con capturas) índice empezando en 0 de la captura donde aparece este producto,
 "box": (solo con capturas) recuadro ajustado SOLO a la foto de este producto (sin el texto ni el precio) dentro de esa captura, como fracciones del ancho y alto [x0,y0,x1,y1] entre 0 y 1; [] si no se ve foto}
Usa punto decimal. Si un dato no aparece, no lo inventes. Devuelve SIEMPRE el JSON con lo que hayas encontrado, aunque falten datos; nunca respondas con una disculpa.`;
  const MULTI=`Puede ser la ficha de UN producto o un LISTADO con varios productos. Devuelve un objeto por cada producto distinto que tenga precio (máximo 12), en el orden en que aparecen.
Si dos productos tienen el nombre igual o cortado ("…"), NO los juntes: son distintos. En "variant" pon lo que los diferencia (lo que diga el nombre o, si no, lo que se ve en SU PROPIA foto: p. ej. "cañón corto, madera" frente a "cañón largo, negro"). Antes de escribir cada producto, mira su foto, su nombre y su precio, que estén en la misma tarjeta o columna, y no mezcles datos de tarjetas distintas.\n`;
  const SHOT_PROMPT=`Estas imágenes son capturas de pantalla del móvil de una tienda online (normalmente España, euros). Extrae los datos de compra. En "images" pon [] (las capturas ya se guardan). `+MULTI+FIELDS;
  const URL_PROMPT=u=>`Abre con web_fetch esta página de una tienda y extrae los datos de compra: ${u}\nSi es la ficha de un producto con varias versiones, usa la que corresponde a esta URL. Si es un listado, pon en "url" el enlace propio de cada producto y en "images" su foto. `+MULTI+FIELDS;

  function toB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});}
  // Para guardar: limita el ANCHO (una captura larga sigue siendo legible).
  async function shrink(file){try{const bmp=await createImageBitmap(file);const s=Math.min(1,1080/bmp.width,12000/bmp.height);const cv=document.createElement('canvas');cv.width=Math.round(bmp.width*s);cv.height=Math.round(bmp.height*s);cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);const b=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.85));return b||file;}catch(e){return file;}}
  // Para enviar a Claude: corta las capturas muy alargadas en trozos legibles (alto ≈ 2 × ancho).
  async function slices(blob){
    try{
      const bmp=await createImageBitmap(blob);const W=bmp.width,H=bmp.height;
      if(H<=W*2.3)return [blob];
      const step=Math.round(W*2),ov=Math.round(W*0.15),out=[];
      for(let y=0;y<H&&out.length<8;y+=step-ov){
        const h=Math.min(step,H-y);if(h<W*0.3&&out.length)break;
        const cv=document.createElement('canvas');cv.width=W;cv.height=h;
        cv.getContext('2d').drawImage(bmp,0,y,W,h,0,0,W,h);
        out.push(await new Promise(r=>cv.toBlob(r,'image/jpeg',0.88)));
      }
      return out.filter(Boolean);
    }catch(e){return [blob];}
  }
  function parseJSON(t){try{return JSON.parse(t);}catch(e){}const m=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(m){try{return JSON.parse(m[1]);}catch(e){}}const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}return null;}

  function catHint(){
    const cats=allCats().map(c=>c[0]).filter(c=>c!==NOCAT);
    return `\nCategorías que ya uso: ${cats.length?cats.join(', '):'(ninguna aún)'}. En "category" usa una de ellas si encaja; si no, usa una de esta lista de categorías con sus subcategorías: ${Object.entries(TAXONOMY).map(([c,v])=>c+' ('+v.join(', ')+')').join('; ')}. Si nada encaja, crea una corta y genérica en plural. Nunca uses «Otros», «Varios» ni «General». En Munición, la subcategoría es solo el calibre (BBs 6 mm, Balines 4,5 mm); si son bio, trazadoras, su color o su peso van en specs (bbBio, bbTracer, bbGrams, bbCount) y en color. Los sets de LEGO van en "LEGO" (con su tema como subcategoría); el resto de juguetes, en "Juguetes". Todo lo de huerto y jardín (semillas, plantas, riego…) en "Huerto"; todo lo de golf en "Golf". Los videojuegos, consolas y sus accesorios van en "Videojuegos", con la plataforma como subcategoría (Nintendo Switch 2, Nintendo Switch, Xbox Series X|S, PlayStation 5…). Gadgets, frikadas, caprichos y regalos de broma van en "Chorradas". La ropa, el calzado y los complementos de moda van en Ropa, Calzado o Complementos (no en Equipamiento, salvo que sea táctico).\nEn "sub" pon la subcategoría de esa lista que mejor encaje ("" si ninguna).`;
  }
  const PAGE_PROMPT=p=>`Este es el contenido de una página de una tienda online que el usuario tiene abierta en su navegador y ha decidido guardar (URL: ${p.u}; título: ${p.t}). Extrae los datos de compra. `+MULTI+
    `Fotos que hay en la página (elige para "images" solo las del producto, en buena resolución):\n${(p.i||[]).join('\n')}\n\nTEXTO DE LA PÁGINA:\n${p.x}\n\n`+FIELDS;
  async function askClaude({images,url,page}){
    if(!cfg.key)throw new Error('falta la clave de API (ponla en Ajustes)');
    const content=[];
    for(const b of images||[])content.push({type:'image',source:{type:'base64',media_type:b.type||'image/jpeg',data:await toB64(b)}});
    const body={model:(images||[]).length?cfg.shotModel:cfg.model,max_tokens:8000,messages:[{role:'user',content}]};
    const headers={'content-type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'};
    if(page){content.push({type:'text',text:PAGE_PROMPT(page)});}
    else if(url&&!(images||[]).length){
      content.push({type:'text',text:URL_PROMPT(url)});
      body.tools=[{type:'web_fetch_20250910',name:'web_fetch',max_uses:2}];
      headers['anthropic-beta']='web-fetch-2025-09-10';
    } else content.push({type:'text',text:SHOT_PROMPT+(url?`\nLa URL de la página es: ${url}`:'')});
    content[content.length-1].text+=catHint();
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers,body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){const m=(j.error&&j.error.message)||('error '+r.status);throw new Error(r.status===401?'la clave de API no es válida':m);}
    const fetchErr=(j.content||[]).find(c=>c.type==='web_fetch_tool_result'&&c.content&&c.content.type==='web_fetch_tool_result_error');
    const txt=(j.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\n');
    const d=parseJSON(txt);
    let list=d&&Array.isArray(d.products)?d.products:Array.isArray(d)?d:(d&&typeof d==='object'?[d]:[]);
    list=list.filter(p=>p&&typeof p==='object'&&(p.product||p.price)).slice(0,12);
    if(!list.length||(!(images||[]).length&&list.every(p=>!(num(p.price)>0))&&/oh noes|botstopper|denegado|bloque|captcha/i.test(txt))){
      if(/oh noes|botstopper|denegado|bloque|captcha/i.test(txt))throw new Error('esta tienda bloquea la lectura automática de su web; comparte una captura');
      if(fetchErr||/oh noes|botstopper|captcha|access denied|cloudflare/i.test(txt))throw new Error('esta tienda bloquea la lectura automática de su web; comparte una captura');
      throw new Error('no se han encontrado datos del producto');
    }
    return list;
  }
  // Recorta la foto de un producto dentro de una captura (box en fracciones 0-1).
  async function cropBox(blob,box){
    try{
      if(!Array.isArray(box)||box.length!==4)return null;
      let [x0,y0,x1,y1]=box.map(Number);
      if(![x0,y0,x1,y1].every(v=>isFinite(v)))return null;
      if(x0>1||y0>1||x1>1||y1>1){return null;}
      x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(1,x1);y1=Math.min(1,y1);
      if(x1-x0<0.05||y1-y0<0.03)return null;
      const bmp=await createImageBitmap(blob);
      const pad=0.01,sx=Math.max(0,(x0-pad))*bmp.width,sy=Math.max(0,(y0-pad))*bmp.height;
      const sw=Math.min(bmp.width-sx,(x1-x0+2*pad)*bmp.width),sh=Math.min(bmp.height-sy,(y1-y0+2*pad)*bmp.height);
      const cv=document.createElement('canvas');cv.width=Math.round(sw);cv.height=Math.round(sh);
      cv.getContext('2d').drawImage(bmp,sx,sy,sw,sh,0,0,cv.width,cv.height);
      return await new Promise(r=>cv.toBlob(r,'image/jpeg',0.9));
    }catch(e){return null;}
  }

  const fixUrl=u=>{u=clean(u);if(!u)return '';if(/^https?:\/\//i.test(u))return u;return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(u)?'https://'+u:'';};
  // ---------- monedas ----------
  // Unidades de cada moneda por 1 €. Se actualiza a diario; si no hay conexión usa estos valores aproximados.
  const FX_FALLBACK={EUR:1,USD:1.08,GBP:0.85,JPY:165,TWD:34.5,HKD:8.4,CNY:7.8,AUD:1.65,CAD:1.48,CHF:0.95,SEK:11.4,NOK:11.6,DKK:7.46,PLN:4.3,CZK:25,KRW:1480,SGD:1.45,MXN:20};
  const CURS=['EUR','USD','GBP','JPY','TWD','HKD','CNY','AUD','CAD','CHF','SEK','NOK','DKK','PLN','CZK','KRW','SGD','MXN'];
  let FX={...FX_FALLBACK},fxDate='';
  async function loadFx(){
    try{const c=JSON.parse(localStorage.getItem('fx')||'null');if(c&&Date.now()-c.t<20*3600e3){FX={...FX_FALLBACK,...c.rates};fxDate=c.date;return;}}catch(e){}
    try{const r=await fetch('https://open.er-api.com/v6/latest/EUR');const j=await r.json();
      if(j&&j.rates&&j.rates.USD){FX={...FX_FALLBACK,...j.rates};fxDate=new Date().toLocaleDateString('es-ES');try{localStorage.setItem('fx',JSON.stringify({t:Date.now(),rates:j.rates,date:fxDate}));}catch(e){}}}catch(e){}
  }
  const r2=n=>Math.round(n*100)/100;
  const toEur=(n,cur)=>!cur||cur==='EUR'||!FX[cur]?num(n):r2(num(n)/FX[cur]);
  const NODEC=new Set(['JPY','KRW','TWD','CLP','HUF','ISK']);
  const fmtCur=(n,cur)=>{n=num(n);return fmtNum(n,NODEC.has(cur)||Number.isInteger(n)?0:2)+' '+cur;};
  const CUR_NAMES={EUR:'Euro €',USD:'Dólar EE. UU. $',GBP:'Libra £',JPY:'Yen japonés ¥',TWD:'Dólar Taiwán NT$',HKD:'Dólar Hong Kong HK$',CNY:'Yuan chino ¥',AUD:'Dólar australiano A$',CAD:'Dólar canadiense C$',CHF:'Franco suizo',SEK:'Corona sueca',NOK:'Corona noruega',DKK:'Corona danesa',PLN:'Zloty polaco',CZK:'Corona checa',KRW:'Won coreano ₩',SGD:'Dólar Singapur S$',MXN:'Peso mexicano'};
  const curOpts=sel=>CURS.map(c=>`<option value="${c}" ${c===sel?'selected':''} title="${CUR_NAMES[c]||c}">${c==='EUR'?'€':c}</option>`).join('');
  function normCur(c){c=clean(c).toUpperCase().replace(/[^A-Z$£¥€]/g,'');
    const m={'€':'EUR','$':'USD','US$':'USD','NT$':'TWD','NTD':'TWD','£':'GBP','¥':'JPY','YEN':'JPY','RMB':'CNY','HK$':'HKD','A$':'AUD','C$':'CAD'};
    return m[c]||(CURS.includes(c)||FX[c]?c:'EUR');}
  // Pasa a euros los importes de un producto leído en otra moneda y guarda los originales.
  // El envío puede ir en otra moneda (shipCur); si no se indica, la misma que el precio.
  function convertItem(d,cur,shipCur){
    cur=normCur(cur);shipCur=normCur(shipCur||cur);
    if(cur==='EUR'&&shipCur==='EUR'){d.orig=null;return d;}
    d.orig={currency:cur,shipCurrency:shipCur,price:num(d.price),shipping:num(d.shipping),freeFrom:num(d.freeFrom),discount:d.discountType==='eur'?num(d.discount):0,rate:FX[cur]||1,shipRate:FX[shipCur]||1,at:new Date().toISOString()};
    d.price=toEur(d.price,cur);d.shipping=toEur(d.shipping,shipCur);d.freeFrom=toEur(d.freeFrom,cur);if(d.discountType==='eur')d.discount=toEur(d.discount,cur);
    return d;
  }
  // ¿Algún importe en moneda distinta del euro?
  const foreignCur=it=>!!(it.orig&&((it.orig.currency&&it.orig.currency!=='EUR')||(it.orig.shipCurrency&&it.orig.shipCurrency!=='EUR')));
  // Detecta productos antiguos guardados en otra moneda como si fueran euros.
  function guessCur(it){
    if(it.orig||it.curChecked)return '';
    const t=[it.notes,it.description,it.store].join(' ');let h='';try{h=new URL(it.url).hostname;}catch(e){}
    const p=num(it.price); // por dominio solo si el importe es demasiado alto para ser euros
    if(/NT\$|TWD|d[oó]lares? (de )?taiw|nuevo d[oó]lar/i.test(t)||(/\.tw$/.test(h)&&p>=300))return 'TWD';
    if(/JPY|\byenes?\b|円/i.test(t)||(/\.jp$/.test(h)&&p>=500))return 'JPY';
    if(/HK\$|HKD|hong kong/i.test(t))return 'HKD';
    if(/GBP|£|libras?( esterlinas?)?\b/i.test(t)||/\.uk$/.test(h))return 'GBP';
    if(/CNY|RMB|yuan/i.test(t)||/\.cn$/.test(h))return 'CNY';
    if(/US\$|USD|d[oó]lares? (estadounidenses|americanos|USA)/i.test(t))return 'USD';
    return '';
  }

  function fromClaude(d,fallbackUrl){const o=fromClaude0(d,fallbackUrl);convertItem(o,o.currency,normCur(d.shippingCurrency||d.currency||'EUR'));delete o.currency;return o;}
  function fromClaude0(d,fallbackUrl){
    const url=safeUrl(fixUrl(d.url))||safeUrl(fallbackUrl||'');
    const miss=[];if(!(num(d.price)>0))miss.push('precio');if(d.shipping===null||d.shipping===undefined)miss.push('envío');
    return{product:clean(d.product)||'Producto sin nombre',variant:clean(d.variant),brand:clean(d.brand),sku:clean(d.sku),mpn:clean(d.mpn),ean:clean(d.ean).replace(/\s/g,''),
      store:clean(d.store)||hostOf(url),url,price:num(d.price),discount:num(d.discount),discountType:d.discountType==='pct'?'pct':'eur',code:clean(d.code),
      shipping:num(d.shipping),freeFrom:num(d.freeFrom),description:clean(d.description),
      notes:[clean(d.notes),miss.length?`No visto: ${miss.join(', ')}.`:''].filter(Boolean).join(' '),incomplete:miss.length>0,imageUrls:Array.isArray(d.images)?d.images:[],
      shot:Number.isInteger(d.shot)?d.shot:0,box:d.box,
      availability:clean(d.availability),vatExcl:d.vatExcl===true,currency:normCur(d.currency||'EUR'),country:clean(d.country).toUpperCase().slice(0,2),
      specs:cleanSpecs(d.specs),sub:clean(d.sub),size:clean(d.size),color:clean(d.color),units:num(d.units)>1?String(Math.round(num(d.units))):'',category:clean(d.category),platform:clean(d.platform),tags:(Array.isArray(d.tags)?d.tags:[]).map(clean).filter(Boolean).slice(0,5).join(', '),compat:(Array.isArray(d.compatible)?d.compatible:String(d.compatible||'').split(',')).map(clean).filter(Boolean).join(', ')};
  }

  // Une lo leído en la web con lo leído en la captura: precio y variante de la captura; el resto, lo más completo.
  function mergeWeb(d,w){
    ['brand','sku','mpn','ean','store','code'].forEach(k=>{if(!d[k]&&w[k])d[k]=w[k];});
    if((w.description||'').length>(d.description||'').length)d.description=w.description;
    if(!(d.price>0)&&w.price>0){d.price=w.price;}
    if(d.shipping===0&&w.shipping>0)d.shipping=w.shipping;
    if(!d.freeFrom&&w.freeFrom)d.freeFrom=w.freeFrom;
    if(!d.variant&&w.variant)d.variant=w.variant;
    d.specs=mergeSpecs(d.specs,w.specs);
    if(w.notes&&!d.notes.includes(w.notes))d.notes=[d.notes,w.notes].filter(Boolean).join(' ');
    d.imageUrls=[...w.imageUrls,...d.imageUrls];
    d.incomplete=!(d.price>0);
  }

  // Muestra los productos encontrados y deja elegir cuáles guardar. Resuelve con los elegidos ([] si cancela).
  function pickProducts(cands){
    return new Promise(resolve=>{
      const sel=new Set();
      const box=$('#pickList');
      const draw=()=>{
        box.innerHTML=cands.map((c,i)=>`<label class="pick ${sel.has(i)?'':'off'}"><input type="checkbox" data-i="${i}" ${sel.has(i)?'checked':''}>
          ${(c.images||[]).length?imgTag(c.images[0]):'<span></span>'}
          <span class="nm">${esc(c.product)}${c.variant?`<div class="vr">${esc(c.variant)}</div>`:''}${c.notes?`<div class="vr">${esc(c.notes)}</div>`:''}</span>
          <span class="pr">${eur(calc(c).total)}</span></label>`).join('');
        $('#pickSave').textContent=sel.size?`Guardar ${sel.size}`:'Guardar';$('#pickSave').disabled=!sel.size;
        $('#pickAll').textContent=sel.size===cands.length?'Desmarcar todos':'Marcar todos';
      };
      box.onchange=e=>{const i=+e.target.dataset.i;if(e.target.checked)sel.add(i);else sel.delete(i);draw();};
      $('#pickAll').onclick=()=>{if(sel.size===cands.length)sel.clear();else cands.forEach((c,i)=>sel.add(i));draw();};
      const done=v=>{$('#picker').hidden=true;box.onchange=null;resolve(v);};
      $('#pickSave').onclick=()=>done(cands.filter((c,i)=>sel.has(i)));
      $('#pickCancel').onclick=()=>done([]);
      $('#pickTitle').textContent=`He encontrado ${cands.length} productos. Marca los que quieras guardar:`;
      draw();$('#picker').hidden=false;$('#picker').scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  async function processShared(files,sharedUrl,page){
    const list=[...files].filter(f=>/^image\//.test(f.type)).slice(0,4);
    if(!list.length&&!sharedUrl)return;
    tab='compare';
    setStatus(page?'Leyendo la página que tenías abierta…':list.length?`Leyendo ${list.length===1?'la captura':list.length+' capturas'}…`:'Leyendo la web del producto y sus fotos…','busy');
    const shots=[];for(const f of list)shots.push(await shrink(f));
    const parts=[];for(const b of shots)parts.push(...await slices(b));
    let doc;
    try{
      const found=await askClaude({images:parts.slice(0,10),url:sharedUrl,page});
      const single=found.length===1;
      setStatus(single?'Guardando las fotos del producto…':`Guardando ${found.length} productos y sus fotos…`,'busy');
      const cands=[];
      for(const raw of found){
        const d=fromClaude(raw,single?sharedUrl:(clean(raw.url)?'':sharedUrl));
        if(page&&single&&!d.imageUrls.length)d.imageUrls=(page.i||[]).slice(0,6);
        // Con captura de una sola ficha: abre también su web para traer descripción completa, fotos y referencias.
        if(single&&shots.length&&d.url&&!/amazon\./i.test(d.url)){
          setStatus('Abriendo la web del producto para traer descripción y fotos…','busy');
          try{const w=fromClaude((await askClaude({url:d.url}))[0],d.url);mergeWeb(d,w);}catch(e){}
          setStatus('Guardando las fotos del producto…','busy');
        }
        const webImgs=await grabImages(d.imageUrls);
        const part=parts[Math.min(Math.max(d.shot,0),parts.length-1)];
        const crop=part&&shots.length?await cropBox(part,d.box):null;
        const imgs=single?[...(crop&&!webImgs.length?[crop]:[]),...webImgs,...shots]:[...(crop?[crop]:[]),...webImgs,...(shots.length?[shots[0]]:[])];
        delete d.imageUrls;delete d.shot;delete d.box;
        const now0=new Date().toISOString();
        cands.push({id:uid(),...d,images:imgs,status:'pending',createdAt:now0,checkedAt:now0,history:num(d.price)>0?[{at:now0,price:calc(d).after,total:calc(d).total,avail:d.availability||''}]:[]});
      }
      let chosen=cands;
      if(!single){setStatus('');chosen=await pickProducts(cands);if(!chosen.length){setStatus('No se ha guardado nada.');return;}}
      const saved=[];
      for(const it of chosen){it.group=autoGroup(it);if(me&&!it.shareWith)it.shareWith=[...(profile.defShare||[])];await put('items',it);items.push(it);saved.push(it);}
      render();
      if(single){const it=saved[0],c=calc(it),n=(it.images||[]).length;
        setStatus(`Guardado: ${fullName(it)} · ${eur(c.total)} · ${n} ${n===1?'foto':'fotos'}${it.incomplete?' (revisa: falta algún dato)':''}`);
        afterShare(it);}
      else setStatus(`Guardados ${saved.length} ${saved.length===1?'producto':'productos'}: `+saved.map(it=>`${fullName(it)} (${eur(calc(it).total)})`).join(' · '));
      return;
    }catch(err){
      doc={id:uid(),product:'Sin leer · '+new Date().toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),variant:'',store:hostOf(sharedUrl||''),url:safeUrl(sharedUrl||''),price:0,discount:0,discountType:'eur',code:'',shipping:0,freeFrom:0,description:'',notes:'No se pudo leer: '+(err.message||err),images:shots,incomplete:true,status:'pending',createdAt:new Date().toISOString()};
      await put('items',doc);items.push(doc);render();setStatus('Guardado sin datos: '+(err.message||err)+'. Puedes editarlo.','err');return;
    }
  }

  // Tras compartir: si ya tenías ese artículo, se dice y se abre su ficha para vincular o fusionar
  function afterShare(it){try{const k=key(groupName(it));const same=items.filter(i=>i!==it&&(i.status||'pending')==='pending'&&key(groupName(i))===k);
      if(same.length){openProd(k);setStatus(same.some(o=>norm(shopOf(o))===norm(shopOf(it)))?`Ya lo tenías de ${shopOf(it)}: arriba puedes fusionar las dos ofertas.`:`Añadido a «${groupName(it)}» como otra tienda: ya lo comparas con ${same.length} ${same.length===1?'oferta':'ofertas'}.`);return;}
      const m=items.find(i=>i!==it&&(i.status||'pending')==='pending'&&!isUnread(i)&&likely(it,i)&&!notSame().has(pairK(it,i)));
      if(m){openProd(k);setStatus(`Parece «${groupName(m)}» (${shopOf(m)}), que ya tenías. Al final de la ficha puedes vincularlo o decir que no es el mismo.`);}}catch(e){}}
  // ---------- recibir una página enviada con el marcador «Guardar en Comparador» ----------
  async function importFromHash(){
    const h=location.hash;if(!h.startsWith('#import='))return;
    history.replaceState(null,'',location.pathname);
    let page=null;try{page=JSON.parse(decodeURIComponent(h.slice(8)));}catch(e){}
    if(!page||!page.u){setStatus('No se ha podido recibir la página.','err');return;}
    page.x=String(page.x||'').slice(0,30000);page.i=(page.i||[]).filter(u=>/^https?:\/\//.test(u)&&!junkImg(u)).slice(0,40);
    await processShared([],safeUrl(page.u)||'',page);
  }
  window.addEventListener('hashchange',()=>importFromHash());
  const bookmarklet=()=>`javascript:(()=>{try{const s=new Set();const m=document.querySelector('meta[property="og:image"]');if(m&&m.content)s.add(m.content);for(const i of document.images){const u=i.currentSrc||i.src;if(/^https?:/.test(u)&&(i.naturalWidth||i.width)>=200)s.add(u)}const d={u:location.href,t:document.title,x:document.body.innerText.replace(/\\n{3,}/g,'\\n\\n').slice(0,30000),i:[...s].slice(0,40)};location.href='${location.origin+location.pathname}#import='+encodeURIComponent(JSON.stringify(d))}catch(e){alert('No se pudo enviar: '+e)}})()`;

  let draining=false;
  async function drainInbox(){
    if(draining)return;draining=true;
    try{
    const inbox=await getAll('inbox').catch(()=>[]);
    for(const e of inbox.sort((a,b)=>a.at.localeCompare(b.at))){
      const link=safeUrl(e.url)||safeUrl(((e.text||'').match(/https?:\/\/\S+/)||[''])[0])||'';
      await del('inbox',e.id).catch(()=>{});
      await processShared(e.files||[],link);
    }
    if(location.search.includes('shared'))history.replaceState(null,'','./');
    }finally{draining=false;}
  }
  $('#fShot').addEventListener('change',e=>{const fs=[...e.target.files];e.target.value='';processShared(fs,'');});

