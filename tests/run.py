#!/usr/bin/env python3
"""Pruebas automáticas del Comparador.

Uso:  python3 tests/run.py            (todas)
      python3 tests/run.py ficha foto (solo esas)

Arranca un servidor local, carga la app en Chrome sin pantalla con datos de prueba
(tests/datos.json, nunca datos reales) y comprueba que cada parte sigue funcionando.
Las capturas quedan en tests/capturas/ (no se suben al repositorio).
"""
import asyncio, json, os, socket, subprocess, sys, time
from playwright.async_api import async_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPT = os.path.join(RAIZ, 'tests', 'capturas')
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
DATOS = json.load(open(os.path.join(RAIZ, 'tests', 'datos.json'), encoding='utf-8'))

EXTRA = [  # casos concretos que han dado guerra
    {"id": "x1", "product": "VFC Saab Carl Gustaf M3", "variant": "Versión Estándar", "brand": "VFC", "store": "iGUN Airsoft", "url": "https://igun.es/cg", "price": 407.18, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Lanzacohetes", "status": "pending", "createdAt": "2026-10-01T00:00:00Z", "images": []},
    {"id": "x2", "product": "Carl Gustaf M3 lanzagranadas de gas", "brand": "VFC", "store": "Quimera", "url": "https://quimera.es/cg", "price": 449, "shipping": 5, "discount": 0, "discountType": "eur", "category": "Réplicas", "status": "pending", "createdAt": "2026-11-16T00:00:00Z", "images": []},
    {"id": "f1", "product": "Acetech Quark R", "store": "Rangertienda", "url": "https://r.es/q", "price": 33, "shipping": 4.95, "discount": 0, "discountType": "eur", "category": "Pistolas", "status": "pending", "group": "Quark R Ranger", "images": [], "history": [{"at": "2026-10-01T10:00:00Z", "price": 35, "total": 39.95}], "checkedAt": "2026-10-01T10:00:00Z"},
    {"id": "f2", "product": "Acetech Quark R", "store": "Rangertienda", "url": "https://r.es/q2", "price": 34, "shipping": 4.95, "discount": 0, "discountType": "eur", "category": "Pistolas", "status": "pending", "group": "Quark R Ranger", "images": []},
    {"id": "rot", "product": "Foto rota de prueba", "store": "Tienda", "url": "https://t.es/r", "price": 10, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Lanzacohetes", "status": "pending", "images": ["http://127.0.0.1:1/no-existe.jpg"]},
    {"id": "blk", "product": "M3 Harris Bipode", "store": "VSGun", "url": "https://vsgun.es/b", "price": 30, "shipping": 5, "discount": 0, "discountType": "eur", "category": "Accesorios", "status": "pending", "images": [], "checkErr": "blocked"},
    {"id": "cd1", "product": "Speedloader Dan Wesson", "store": "Adeportes", "url": "https://a.es/s", "price": 12, "shipping": 4, "discount": 0, "discountType": "eur", "category": "Cargadores", "status": "pending", "group": "Speedloader Dan Wesson", "images": []},
    {"id": "cd2", "product": "Speedloader Dan Wesson 715", "store": "Tienda B", "url": "https://b.es/s", "price": 11, "shipping": 4, "discount": 0, "discountType": "eur", "category": "Accesorios", "status": "pending", "group": "Speedloader Dan Wesson", "images": []},
]


def libre():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p


class App:
    def __init__(self, pg, base):
        self.pg, self.base, self.errores = pg, base, []
        pg.on('pageerror', lambda e: self.errores.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))

    async def abrir(self, tema='dark', extra=()):
        pg = self.pg
        await pg.goto(self.base + '/index.html'); await pg.wait_for_timeout(600)
        await pg.evaluate("""async(items)=>{await new Promise(res=>{const r=indexedDB.open('comparador',1);r.onsuccess=()=>{const t=r.result.transaction('items','readwrite');t.objectStore('items').clear();items.forEach(i=>t.objectStore('items').put(i));t.oncomplete=res;};});}""", DATOS + list(extra))
        await pg.evaluate(f"localStorage.clear();localStorage.setItem('pref_theme','{tema}')")
        await pg.reload(); await pg.wait_for_timeout(1500)
        await pg.evaluate("for(const id of ['settings','authBar','status']){const e=document.getElementById(id);if(e)e.hidden=true;}")

    async def item(self, id):
        return await self.pg.evaluate("""id=>new Promise(res=>{const r=indexedDB.open('comparador',1);r.onsuccess=()=>{const q=r.result.transaction('items').objectStore('items').get(id);q.onsuccess=()=>res(q.result||null)}})""", id)

    async def n(self, sel):
        return await self.pg.evaluate("s=>document.querySelectorAll(s).length", sel)

    async def foto(self, nombre, completa=False):
        os.makedirs(CAPT, exist_ok=True)
        await self.pg.screenshot(path=os.path.join(CAPT, nombre + '.png'), full_page=completa)


def comprobar(cond, msg):
    if not cond:
        raise AssertionError(msg)


# ---------------- pruebas ----------------
async def p_inicio(a):
    for tema in ('dark', 'light'):
        await a.abrir(tema)
        comprobar(await a.n('.hbanner') == 1, 'falta el banner de Inicio')
        comprobar(await a.n('.kpi') == 4, 'faltan las cifras de Inicio')
        comprobar(await a.n('.hmod .cattile.sq') >= 5, 'faltan categorías en mosaico')
        await a.foto('inicio-' + tema, True)


async def p_categoria(a):
    await a.abrir()
    await a.pg.click('.hmod .cattile[data-cat=Munición]'); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('.catback.hero') == 1, 'falta la cabecera de categoría')
    comprobar(await a.n('[data-fac=Trazadora]') == 1, 'falta el filtro Trazadora')
    await a.pg.click('[data-fac=Trazadora]'); await a.pg.wait_for_timeout(200)
    comprobar(await a.n('[data-open]') == 3, 'el filtro Trazadora no filtra bien')
    ups = await a.pg.evaluate("[...document.querySelectorAll('.upr')].map(x=>x.textContent)")
    comprobar('5,00 €/1000' in ups, f'precio por unidad incorrecto: {ups}')
    await a.foto('categoria')
    await a.pg.click('[data-nav=home]'); await a.pg.wait_for_timeout(300); await a.pg.click('.hmod .cattile[data-cat=Golf]'); await a.pg.wait_for_timeout(300)
    await a.pg.click('[data-upsort]'); await a.pg.wait_for_timeout(200)
    ups = await a.pg.evaluate("[...document.querySelectorAll('.upr')].map(x=>x.textContent)")
    comprobar(ups[:2] == ['0,05 €/ud', '0,13 €/ud'], f'orden por €/ud incorrecto: {ups}')


async def p_ficha(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=explore]'); await a.pg.wait_for_timeout(200)
    await a.pg.click('.cattile[data-cat=Pistolas]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("[...document.querySelectorAll('[data-open]')].find(x=>x.querySelector('img')).click()"); await a.pg.wait_for_timeout(400)
    comprobar(await a.n('.ptabs [data-ptab]') == 4, 'faltan las pestañas de la ficha')
    await a.pg.click('[data-ptab=hist]'); await a.pg.wait_for_timeout(150)
    vis = await a.pg.evaluate("[...document.querySelectorAll('.ptab')].map(p=>!p.hidden)")
    comprobar(vis == [False, True, False, False], 'las pestañas no cambian')
    # foto principal desde el visor
    await a.pg.click('.pgal [data-lb]', button='right'); await a.pg.wait_for_timeout(300)
    comprobar(not await a.pg.evaluate("document.getElementById('lb').hidden"), 'mantener pulsada la foto no abre el visor')
    await a.pg.click('#lbClose')
    # atrás: editor -> ficha -> lista, sin salir de la app
    await a.pg.click('#view [data-act=edit]'); await a.pg.wait_for_timeout(400)
    comprobar(await a.pg.evaluate("!document.getElementById('form').hidden"), 'Editar no abre el editor')
    await a.pg.go_back(); await a.pg.wait_for_timeout(300)
    comprobar(await a.pg.evaluate("document.getElementById('form').hidden"), 'atrás no cierra el editor')
    comprobar(await a.n('#pfBack') == 1, 'atrás desde el editor no vuelve a la ficha')
    await a.pg.go_back(); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('#pfBack') == 0, 'atrás no cierra la ficha')
    comprobar(a.pg.url.startswith(a.base), 'atrás ha salido de la app')


async def p_fusion(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Pistolas]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("[...document.querySelectorAll('[data-open]')].find(x=>/Ranger/.test(x.textContent)).click()"); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('[data-fuse]') == 1, 'no avisa de dos ofertas de la misma tienda')
    await a.pg.click('[data-fuse]'); await a.pg.wait_for_timeout(600)
    f1, f2 = await a.item('f1'), await a.item('f2')
    queda, otra = (f1, f2) if f1['status'] == 'pending' else (f2, f1)
    comprobar(otra['status'] == 'discarded' and otra.get('mergedInto') == queda['id'], 'la fusión no deja la otra en Descartados')
    comprobar(len(queda.get('history') or []) >= 1, 'la fusión pierde el historial')


async def p_vincular(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Réplicas]'); await a.pg.wait_for_timeout(300)
    await a.pg.click('[data-open]'); await a.pg.wait_for_timeout(400)
    comprobar(await a.n('.sugbox') == 1, 'no sugiere vincular el Carl Gustaf')
    await a.pg.click('.sugbox [data-dupa]'); await a.pg.wait_for_timeout(300); await a.pg.click('#lkGo'); await a.pg.wait_for_timeout(500)
    x2 = await a.item('x2')
    comprobar(x2['category'] == 'Lanzacohetes', 'al vincular no toma la categoría del más antiguo')


async def p_foto(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Lanzacohetes]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("[...document.querySelectorAll('[data-open]')].find(x=>/rota/.test(x.textContent)).click()"); await a.pg.wait_for_timeout(1500)
    comprobar(await a.n('.badbox [data-rmbad]') == 1, 'no avisa de la foto rota')
    await a.pg.click('[data-rmbad]'); await a.pg.wait_for_timeout(400)
    comprobar((await a.item('rot'))['images'] == [], 'no quita la foto rota')


async def p_revision(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=review]'); await a.pg.wait_for_timeout(400)
    comprobar(await a.n('.rvcard') >= 5, 'faltan secciones en Revisión')
    comprobar(await a.pg.evaluate("document.getElementById('navRevN').hidden"), 'tras visitar Revisión el globo no se vacía')
    # algo nuevo: el globo cuenta solo eso
    await a.pg.evaluate("localStorage.setItem('revSeen',JSON.stringify([]))"); await a.pg.click('[data-nav=home]'); await a.pg.wait_for_timeout(300)
    n = await a.pg.inner_text('#navRevN')
    comprobar(n == '+🥚' or n.isdigit(), f'globo raro: {n}')
    await a.foto('revision')
    await a.pg.click('[data-nav=review]'); await a.pg.wait_for_timeout(300)
    await a.pg.click('[data-rv=catdiff]'); await a.pg.wait_for_timeout(300)
    cds = await a.pg.evaluate("[...document.querySelectorAll('.rvrow')].filter(r=>/Speedloader/.test(r.textContent)).map(r=>r.querySelectorAll('.cdiff .cd').length)")
    comprobar(cds == [2], f'Categorías distintas no enseña las dos categorías: {cds}')
    await a.pg.evaluate("[...document.querySelectorAll('.rvrow')].find(r=>/Speedloader/.test(r.textContent)).querySelector('[data-setcat]').click()"); await a.pg.wait_for_timeout(500)
    comprobar((await a.item('cd1'))['category'] == (await a.item('cd2'))['category'], 'no unifica la categoría desde Revisión')
    await a.pg.click('#rvBack'); await a.pg.wait_for_timeout(200); await a.pg.click('[data-rv=err]'); await a.pg.wait_for_timeout(300)
    await a.pg.click('[data-clrerr=blk]'); await a.pg.wait_for_timeout(400)
    blk = await a.item('blk')
    comprobar(not blk.get('checkErr') and blk.get('noAuto') == '1', '«Los datos están bien» no quita el aviso')


async def p_listas(a):
    await a.abrir()
    await a.pg.click('[data-nav=lists]'); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('.lcard') >= 3, 'faltan listas')
    await a.pg.click('[data-list=p] >> nth=0'); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('.prog') >= 1, 'falta la barra de progreso de regalos')


async def p_paneles(a):
    await a.abrir(extra=EXTRA)
    import glob, re
    nombres = set()
    for f in glob.glob(os.path.join(RAIZ, 'js', '*.js')):
        for m in re.finditer(r'^  (?:const|let|var|async function|function)\s+([A-Za-z_$][\w$]*)', open(f, encoding='utf-8').read(), re.M):
            nombres.add(m.group(1))
    p2 = await a.pg.context.new_page(); await p2.goto('about:blank')
    choques = await p2.evaluate("ns=>ns.filter(n=>n in window)", sorted(nombres)); await p2.close()
    comprobar(not choques, 'nombres que pisan funciones del navegador: ' + ', '.join(choques))
    comprobar(await a.pg.evaluate("!document.getElementById('cloudTop').hidden"), 'falta la nube de sincronización')
    await a.pg.click('#cloudTop'); await a.pg.wait_for_timeout(200)
    comprobar(await a.pg.evaluate("!document.getElementById('settings').hidden"), 'la nube no abre Ajustes')
    await a.foto('nube-ajustes')
    await a.pg.click('#openSettings'); await a.pg.wait_for_timeout(100)
    await a.pg.click('[data-nav=add]'); await a.pg.wait_for_timeout(200)
    comprobar(await a.pg.evaluate("!document.getElementById('addSheet').hidden"), 'Añadir no se abre')
    await a.pg.click('#addLink'); await a.pg.wait_for_timeout(300)
    comprobar(await a.pg.evaluate("!document.getElementById('form').hidden"), 'el formulario nuevo no se abre')
    await a.pg.fill('#fProduct', 'Bolsa 4000 BBs'); await a.pg.fill('#fPrice', '20'); await a.pg.wait_for_timeout(100)
    comprobar('€/1000' in await a.pg.inner_text('#unitsHint'), 'el editor no calcula el precio por unidad')


async def p_html(a):
    from html.parser import HTMLParser
    class P(HTMLParser):
        def __init__(s): super().__init__(); s.st = []; s.mal = []
        def handle_starttag(s, t, at):
            if t in ('div', 'nav', 'details', 'form', 'section', 'header', 'main', 'label', 'select'): s.st.append((t, s.getpos()[0]))
        def handle_endtag(s, t):
            if t in ('div', 'nav', 'details', 'form', 'section', 'header', 'main', 'label', 'select'):
                if not s.st or s.st[-1][0] != t: s.mal.append(f'</{t}> en línea {s.getpos()[0]}')
                else: s.st.pop()
    pr = P(); pr.feed(open(os.path.join(RAIZ, 'index.html'), encoding='utf-8').read())
    comprobar(not pr.mal and not pr.st, 'index.html mal cerrado: ' + ', '.join(pr.mal[:3] + [f'<{t}> línea {l} sin cerrar' for t, l in pr.st[:3]]))


def _hist(precios, dias_atras):
    import datetime
    hoy = datetime.datetime(2026, 11, 16)
    return [{"at": (hoy - datetime.timedelta(days=d)).isoformat() + 'Z', "price": p, "total": p} for p, d in zip(precios, dias_atras)]


CONSEJOS = [
    {"id": "h1", "product": "Pistola en mínimo", "store": "Tienda A", "url": "https://a.es/h1", "price": 80, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Pruebas", "status": "pending", "images": [], "history": _hist([100, 95, 90, 80], [60, 40, 20, 1])},
    {"id": "h2", "product": "Pistola cara ahora", "store": "Tienda A", "url": "https://a.es/h2", "price": 120, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Pruebas", "status": "pending", "images": [], "history": _hist([100, 95, 110, 120], [60, 40, 20, 1])},
    {"id": "k1", "product": "Gafas de tiro", "store": "Cestashop", "url": "https://c.es/1", "price": 20, "shipping": 5, "freeFrom": 30, "discount": 0, "discountType": "eur", "category": "Pruebas", "status": "pending", "images": []},
    {"id": "k2", "product": "Cinta de tela", "store": "Cestashop", "url": "https://c.es/2", "price": 15, "shipping": 5, "freeFrom": 30, "discount": 0, "discountType": "eur", "category": "Pruebas", "status": "pending", "group": "Cinta de tela", "images": []},
    {"id": "k3", "product": "Cinta de tela", "store": "Otra tienda", "url": "https://o.es/2", "price": 14, "shipping": 4, "discount": 0, "discountType": "eur", "category": "Pruebas", "status": "pending", "group": "Cinta de tela", "images": []},
    {"id": "v1", "product": "Vainas reductoras", "brand": "iGUN", "store": "iGUN", "url": "https://i.es/v", "price": 25, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Cargadores", "sub": "Vainas", "compat": "Chiappa Rhino 50DS 6 mm, Chiappa Rhino 60DS 6 mm", "status": "pending", "images": []},
    {"id": "r6", "product": "Chiappa Rhino 50DS 6mm CO2", "brand": "Chiappa", "store": "iGUN", "url": "https://i.es/r6", "price": 180, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Revólveres", "status": "pending", "images": []},
    {"id": "r4", "product": "Chiappa Rhino 50DS 4,5 mm balines", "brand": "Chiappa", "store": "iGUN", "url": "https://i.es/r4", "price": 170, "shipping": 0, "discount": 0, "discountType": "eur", "category": "Revólveres", "status": "pending", "images": []},
]


async def p_consejos(a):
    await a.abrir(extra=CONSEJOS)
    tips = await a.pg.inner_text('#view'); await a.foto('inicio-cesta', True)
    comprobar('Cestashop' in tips and '8,00 €' in tips, 'la cesta óptima no propone juntar en Cestashop (ahorro 8 €)')
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Pruebas]'); await a.pg.wait_for_timeout(300)
    txt = await a.pg.inner_text('#view')
    await a.foto('buen-momento', True)
    comprobar('Mínimo de 90 días' in txt, 'no marca el mínimo de 90 días')
    comprobar('Caro ahora' in txt, 'no avisa de que está caro ahora')


async def p_compatibles(a):
    await a.abrir(extra=CONSEJOS)
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Cargadores]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("[...document.querySelectorAll('[data-open]')].find(x=>/Vainas/.test(x.textContent)).click()"); await a.pg.wait_for_timeout(400)
    sirve = await a.pg.evaluate("[...document.querySelectorAll('.cpt b')].map(b=>b.textContent)")
    await a.foto('vainas', True)
    comprobar(sirve == ['Chiappa Rhino 50DS 6mm CO2'], f'«Sirve para» debe ser solo el Rhino de 6 mm: {sirve}')
    await a.pg.click('.cpt'); await a.pg.wait_for_timeout(400)
    acc = await a.pg.evaluate("[...document.querySelectorAll('.cpt b')].map(b=>b.textContent)")
    comprobar(acc == ['Vainas reductoras'], f'el Rhino de 6 mm no enseña sus vainas: {acc}')


async def p_compartir(a):
    await a.abrir(extra=EXTRA)
    await a.pg.evaluate("""()=>{const it={id:'nuevo',product:'Saab Carl Gustaf M3 VFC gas',brand:'VFC',store:'Gunfire',price:430,shipping:9,discount:0,discountType:'eur',category:'Lanzacohetes',status:'pending',images:[]};it.group=autoGroup(it);items.push(it);afterShare(it);}""")
    await a.pg.wait_for_timeout(400)
    comprobar(await a.n('#pfBack') == 1, 'tras compartir algo que ya tenías no abre su ficha')
    st = await a.pg.inner_text('#statusTxt')
    comprobar('Carl Gustaf' in st, f'no avisa de que ya lo tenías: {st}')


async def p_comprobar(a):
    await a.abrir(extra=EXTRA)
    # Claude simulado: tarda 2,5 s y devuelve un precio
    await a.pg.route('https://api.anthropic.com/**', lambda r: asyncio.ensure_future(asyncio.sleep(2.5)).add_done_callback(lambda _: asyncio.ensure_future(r.fulfill(status=200, content_type='application/json', body=json.dumps({"content": [{"type": "text", "text": json.dumps({"products": [{"product": "VFC Saab Carl Gustaf M3", "price": 399, "currency": "EUR", "availability": "En stock"}]})}], "usage": {"input_tokens": 1000, "output_tokens": 100}})))))
    await a.pg.evaluate("localStorage.setItem('apiKey','clave-de-prueba')")
    await a.pg.click('[data-nav=explore]'); await a.pg.click('.cattile[data-cat=Lanzacohetes]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("[...document.querySelectorAll('[data-open]')].find(x=>/Carl/.test(x.textContent)).click()"); await a.pg.wait_for_timeout(300)
    await a.pg.click('#pfCheck'); await a.pg.wait_for_timeout(1300)
    st = await a.pg.inner_text('#statusTxt'); vis = await a.pg.evaluate("!document.getElementById('status').hidden")
    comprobar(vis and 'iGUN' in st and ' s' in st, f'mientras comprueba no dice qué hace: {st}')
    await a.foto('comprobando')
    await a.pg.wait_for_timeout(2500)
    st = await a.pg.inner_text('#statusTxt')
    comprobar('399' in st, f'al acabar no dice el resultado: {st}')
    # Botón aparte de stock: solo toca la disponibilidad, no el precio ni el histórico
    comprobar(await a.n('#pfStockChk') == 1, 'falta el botón «Comprobar stock» en la ficha')
    antes = await a.pg.evaluate("(()=>{const it=items.find(i=>/Carl/.test(i.product)&&i.url);it.availability='Agotado';it.price=777;return (it.history||[]).length})()")
    await a.pg.click('#pfStockChk'); await a.pg.wait_for_timeout(150)
    comprobar('Ya se comprobó hace' in await a.pg.inner_text('#statusTxt'), 'no avisa de que se comprobó hace menos de 24 h')
    await a.pg.click('#pfStockChk'); await a.pg.wait_for_timeout(3200)
    st = await a.pg.inner_text('#statusTxt')
    r = await a.pg.evaluate("(()=>{const it=items.find(i=>/Carl/.test(i.product)&&i.url);return [it.price,(it.history||[]).length,it.availability]})()")
    comprobar(r[0] == 777 and r[1] == antes and r[2] == 'En stock', f'«Comprobar stock» ha tocado el precio o el histórico: {r}')
    comprobar('stock' in st.lower() and 'vuelve a haber' in st, f'«Comprobar stock» no dice el resultado: {st}')


async def p_iva_y_tienda(a):
    await a.abrir(extra=EXTRA)
    # IVA no incluido: tienda de la UE suma el 21 %; fuera de la UE no se duplica (ya va en importación)
    r = await a.pg.evaluate("""()=>[calc({price:100,shipping:10,vatExcl:true,country:'DE'}).total,calc({price:100,shipping:10,country:'DE'}).total,
        calc({price:100,shipping:10,vatExcl:true,country:'US'}).total===calc({price:100,shipping:10,country:'US'}).total]""")
    comprobar(abs(r[0]-133.1) < 0.01 and abs(r[1]-110) < 0.01 and r[2], f'IVA no incluido mal calculado: {r}')
    # Rellenar con lo de esta tienda: copia portes, envío gratis y cupón de otro artículo de la misma tienda
    await a.pg.evaluate("""()=>{items.push({id:'t1',product:'Bolas 0,25',store:'TiendaPrueba',price:10,shipping:4.95,freeFrom:60,code:'HOLA10',vatExcl:true,status:'pending',images:[],checkedAt:new Date().toISOString()});}""")
    await a.pg.click('[data-nav=add]'); await a.pg.wait_for_timeout(200); await a.pg.click('#addLink'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.getElementById('form').querySelectorAll('details').forEach(d=>d.open=true)")
    await a.pg.fill('#fStore', 'TiendaPrueba'); await a.pg.click('#shopCopy'); await a.pg.wait_for_timeout(200)
    v = await a.pg.evaluate("['fShip','fFree','fCode'].map(i=>document.getElementById(i).value).concat(document.getElementById('fVatExcl').checked)")
    comprobar(v[0] == '4,95' and v[1].startswith('60') and v[2] == 'HOLA10' and v[3] is True, f'«Rellenar con lo de esta tienda» no copia: {v}')
    await a.foto('rellenar-tienda')


async def p_ficha_tecnica(a):
    await a.abrir(extra=EXTRA)
    # Rangos de FPS / julios y listas de Claude (array) se guardan como texto
    r = await a.pg.evaluate("""()=>cleanSpecs({fps:'120 - 250',joules:'hasta 1,5 J',gas:['Green gas','CO₂ 12 g'],ms:'de 90 a 110 m/s'})""")
    comprobar(r.get('fps') == '120–250 fps' and r.get('ms') == '90–110 m/s' and r.get('gas') == 'Green gas, CO₂ 12 g', f'rangos o listas mal: {r}')
    # Editor: listas fijas, casillas múltiples y valores antiguos que no están en la lista se conservan
    await a.pg.click('[data-nav=add]'); await a.pg.wait_for_timeout(200); await a.pg.click('#addLink'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.getElementById('form').querySelectorAll('details').forEach(d=>d.open=true)")
    v = await a.pg.evaluate("""()=>{fillSpecs({system:'1x 12 g CO₂',gas:'Top gas / Red gas, Green gas',fireMode:'Semi, ráfaga y Full',battery:'LiPo',batC:'25C',stock:'Retráctil / telescópica',rails:'Sí',railType:'M-LOK',fps:'120-250'});
        const o=readSpecs();return [document.getElementById('sp_battery').tagName,o.system,o.gas,o.fireMode,o.batC,o.stock,o.railType,o.fps]}""")
    comprobar(v[0] == 'SELECT' and v[1] == '1x 12 g CO₂' and set(v[2].split(', ')) == {'Top gas / Red gas', 'Green gas'} and v[3] == 'Semi, ráfaga y Full' and v[4] == '25C' and v[5].startswith('Retráctil') and v[6] == 'M-LOK' and v[7] == '120–250 fps', f'ficha técnica del editor mal: {v}')
    await a.pg.evaluate("document.getElementById('specBox').scrollIntoView()")
    await a.foto('ficha-tecnica')


async def p_no_envia(a):
    await a.abrir(extra=EXTRA)
    # Una tienda que no envía no cuenta como mejor precio, aunque sea la más barata; vale también para artículos nuevos de esa tienda
    r = await a.pg.evaluate("""()=>{const A={id:'ne1',product:'Réplica X',group:'Réplica X',store:'Airsoft Galicia',price:100,shipping:0,status:'pending',images:[],noShip:true};
      const B={id:'ne2',product:'Réplica X',group:'Réplica X',store:'Otra Tienda',price:150,shipping:0,status:'pending',images:[]};
      const C={id:'ne3',product:'Réplica Y',group:'Réplica Y',store:'Airsoft Galicia',price:50,shipping:0,status:'pending',images:[]};
      items.push(A,B,C);return [canBuy(A),canBuy(B),canBuy(C),[A,B].sort(byBuyable)[0].id]}""")
    comprobar(r == [False, True, False, 'ne2'], f'«no envía» mal: {r}')
    html = await a.pg.evaluate("availChip(items.find(i=>i.id==='ne3'))")
    comprobar('No envía' in html, 'no se ve «No envía» en la oferta')


async def p_editar_a_la_vez(a):
    await a.abrir(extra=EXTRA)
    await a.pg.evaluate("""()=>{items.push({id:'bk1',product:'Bolas A',store:'T1',price:5,status:'pending',images:[],tags:'viejo'},{id:'bk2',product:'Bolas B',store:'T2',price:6,status:'pending',images:[]});}""")
    # En Revisión se puede seleccionar
    await a.pg.click('[data-nav=review]'); await a.pg.wait_for_timeout(300)
    await a.pg.click('#checkTop'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.querySelectorAll('[data-nav]')")
    await a.pg.evaluate("""()=>{['bk1','bk2'].forEach(id=>sel.add(id));render();}""")
    nsel = await a.pg.evaluate("""()=>{const b=document.querySelector('[data-rv]');if(b)b.click();return document.querySelectorAll('.rvrow [data-sel]').length}""")
    comprobar(nsel > 0, 'en Revisión no salen casillas para seleccionar')
    rv = await a.pg.evaluate("revOpen||navTab==='review'")
    comprobar(rv, 'al pulsar seleccionar en Revisión se sale de Revisión')
    await a.pg.click('#selBulk'); await a.pg.wait_for_timeout(200)
    await a.pg.fill('#bkCat', 'Munición'); await a.pg.fill('#bkTags', 'trazadora')
    await a.pg.select_option('#bkSpec1', 'bbTracer'); await a.pg.wait_for_timeout(100); await a.pg.select_option('#bkVal1', 'Sí')
    await a.foto('editar-a-la-vez')
    await a.pg.click('#bkApply'); await a.pg.wait_for_timeout(300)
    r = await a.pg.evaluate("['bk1','bk2'].map(id=>{const i=items.find(x=>x.id===id);return [i.category,i.tags,(i.specs||{}).bbTracer]})")
    comprobar(r == [['Munición', 'viejo, trazadora', 'Sí'], ['Munición', 'trazadora', 'Sí']], f'editar a la vez mal: {r}')


async def p_misma_tienda(a):
    await a.abrir(extra=EXTRA)
    r = await a.pg.evaluate("""()=>{const A={id:'mt1',product:'Luger',store:'iGUN Airsoft',price:200,shipping:6.9,freeFrom:150,status:'pending',images:[],checkedAt:new Date().toISOString()};
      const B={id:'mt2',product:'Vainas',store:'',url:'https://www.igunairsoft.com/x',price:20,status:'pending',images:[]};
      const C={id:'mt3',product:'Casquillos',store:'Igunairsoft',price:25,status:'pending',images:[]};items.push(A,B,C);
      return [shopKey(A),shopKey(B),shopKey(C)]}""")
    comprobar(len(set(r)) == 1, f'la misma tienda con nombres distintos no se reconoce: {r}')
    await a.pg.evaluate("()=>{selMode=true;['mt2','mt3'].forEach(id=>sel.add(id));render();}")
    await a.pg.click('#selBulk'); await a.pg.wait_for_timeout(200)
    await a.pg.fill('#bkStore', 'iGUN Airsoft'); await a.pg.check('#bkShip'); await a.pg.wait_for_timeout(100)
    await a.pg.select_option('#bkShipPick select', 'mt1')
    await a.pg.click('#bkApply'); await a.pg.wait_for_timeout(400)
    r = await a.pg.evaluate("['mt2','mt3'].map(id=>{const i=items.find(x=>x.id===id);return [i.store,i.shipping,i.freeFrom]})")
    comprobar(r == [['iGUN Airsoft', 6.9, 150], ['iGUN Airsoft', 6.9, 150]], f'no unifica tienda o no copia portes: {r}')
    # Portes escritos a mano para varios a la vez, y elegir de cuál copiar si hay varios distintos
    await a.pg.evaluate("""()=>{items.push({id:'mt4',product:'Otro',store:'iGUN Airsoft',price:9,shipping:4.5,status:'pending',images:[]},{id:'mt5',product:'Nuevo',store:'igunairsoft',price:9,status:'pending',images:[]},
      {id:'mt6',product:'X',store:'Nadie',price:3,status:'pending',images:[]},{id:'mt7',product:'Y',store:'Nadie',price:4,status:'pending',images:[]});selMode=true;sel.clear();sel.add('mt5');render();}""")
    await a.pg.click('#selBulk'); await a.pg.wait_for_timeout(200); await a.pg.check('#bkShip'); await a.pg.wait_for_timeout(100)
    n = await a.pg.evaluate("document.querySelectorAll('#bkShipPick select option[value]:not([value=\"\"])').length")
    comprobar(n >= 2, f'con dos portes distintos en la tienda no deja elegir: {n}')
    await a.pg.select_option('#bkShipPick select', 'mt4'); await a.pg.click('#bkApply'); await a.pg.wait_for_timeout(300)
    comprobar(await a.pg.evaluate("items.find(i=>i.id==='mt5').shipping") == 4.5, 'no copia los portes elegidos')
    await a.pg.evaluate("()=>{selMode=true;sel.clear();['mt6','mt7'].forEach(id=>sel.add(id));render();}")
    await a.pg.click('#selBulk'); await a.pg.wait_for_timeout(200); await a.pg.fill('#bkShipV', '5,95'); await a.pg.fill('#bkFreeV', '100')
    await a.foto('portes-a-la-vez')
    await a.pg.click('#bkApply'); await a.pg.wait_for_timeout(300)
    r = await a.pg.evaluate("['mt6','mt7'].map(id=>{const i=items.find(x=>x.id===id);return [i.shipping,i.freeFrom]})")
    comprobar(r == [[5.95, 100], [5.95, 100]], f'portes a mano para varios mal: {r}')


async def p_mantener_y_borrar(a):
    await a.abrir(extra=EXTRA)
    await a.pg.evaluate("""()=>{items.push({id:'lp1',product:'Sin leer · prueba 1',store:'Amzn',status:'pending',images:[]},{id:'lp2',product:'Sin leer · prueba 2',store:'Amazon',status:'pending',images:[]});}""")
    await a.pg.click('[data-nav=review]'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.querySelector('[data-rv]')&&document.querySelector('[data-rv]').click()"); await a.pg.wait_for_timeout(300)
    box = await a.pg.evaluate("(()=>{const r=document.querySelector('[data-lp=lp1]');if(!r)return null;r.scrollIntoView({block:'center'});const b=r.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]})()")
    comprobar(box is not None, 'la fila de Revisión no se puede mantener pulsada')
    await a.pg.mouse.move(box[0], box[1]); await a.pg.mouse.down(); await a.pg.wait_for_timeout(700); await a.pg.mouse.up(); await a.pg.wait_for_timeout(200)
    r = await a.pg.evaluate("[selMode,sel.has('lp1')]")
    comprobar(r == [True, True], f'mantener pulsado no empieza a seleccionar: {r}')
    # Sigue donde estaba: no vuelve arriba al empezar a seleccionar
    await a.pg.evaluate("()=>{for(let i=0;i<30;i++)items.push({id:'lpx'+i,product:'Sin leer · relleno '+i,store:'T',status:'pending',images:[]});selMode=false;sel.clear();render();}")
    await a.pg.wait_for_timeout(200)
    box = await a.pg.evaluate("(()=>{const r=document.querySelectorAll('[data-lp]');const el=r[r.length-3];el.scrollIntoView({block:'center'});const b=el.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2,window.scrollY]})()")
    await a.pg.mouse.move(box[0], box[1]); await a.pg.mouse.down(); await a.pg.wait_for_timeout(700); await a.pg.mouse.up(); await a.pg.wait_for_timeout(200)
    y = await a.pg.evaluate("window.scrollY")
    comprobar(box[2] > 300 and abs(y - box[2]) < 80, f'al marcar el primero vuelve arriba: antes {box[2]}, después {y}')
    await a.pg.evaluate("()=>{sel.clear();sel.add('lp1');}")
    await a.pg.evaluate("()=>{sel.add('lp2');render();}")
    await a.pg.click('#selDel'); await a.pg.wait_for_timeout(100)
    comprobar(await a.pg.evaluate("items.some(i=>i.id==='lp1')"), 'borra al primer toque')
    await a.pg.click('#selDel'); await a.pg.wait_for_timeout(400)
    comprobar(await a.pg.evaluate("!items.some(i=>i.id==='lp1'||i.id==='lp2')"), 'no borra los seleccionados')


async def p_seguridad_xss(a):
    # Datos maliciosos (de una web leída, de una lista compartida o de un enlace #import=) no pueden ejecutar código:
    # si lo hicieran podrían robar la clave de Anthropic del dispositivo.
    P = '<img src=x onerror="window.__xss=1">'
    mal = {'id': 'xss1', 'product': 'Malo ' + P, 'group': 'Malo ' + P, 'variant': P, 'brand': P, 'store': P, 'url': 'javascript:window.__xss=2',
           'price': 10, 'shipping': 1, 'code': P, 'category': P, 'sub': P, 'platform': P, 'tags': P, 'compat': P, 'description': P, 'notes': P,
           'availability': P, 'people': [P], 'status': 'pending', 'images': ['javascript:window.__xss=3', '" onerror="window.__xss=4'],
           'specs': {'system': P, 'gas': P, 'included': P}, 'history': [{'at': '2026-11-01T00:00:00Z', 'price': 12}]}
    mal2 = dict(mal, id='xss2', store='Otra', price=9)
    await a.abrir(extra=EXTRA + [mal, mal2])
    for nav in ['home', 'explore', 'lists', 'review', 'buys']:
        if await a.n(f'[data-nav={nav}]'):
            await a.pg.click(f'[data-nav={nav}]'); await a.pg.wait_for_timeout(250)
    await a.pg.evaluate("()=>{prodKey=key(groupName(items.find(i=>i.id==='xss1')));navTab='explore';render();}"); await a.pg.wait_for_timeout(300)
    for t in await a.pg.query_selector_all('[data-ptab]'):
        try: await t.click(); await a.pg.wait_for_timeout(150)
        except Exception: pass
    await a.pg.click('[data-act=edit]') if await a.n('[data-act=edit]') else None
    await a.pg.wait_for_timeout(300)
    r = await a.pg.evaluate("[window.__xss||0, [...document.querySelectorAll('a[href^=\"javascript\" i]')].length, [...document.querySelectorAll('img')].filter(i=>/__xss/.test(i.getAttribute('onerror')||'')).length]")
    comprobar(r == [0, 0, 0], f'se ha podido inyectar código: {r}')


async def p_tiendas(a):
    await a.abrir(extra=EXTRA)
    await a.pg.evaluate("""()=>{items.push({id:'td1',product:'Luger',store:'iGUN Airsoft',price:200,status:'pending',images:[],category:'Pistolas'},
      {id:'td2',product:'Vainas',store:'Igunairsoft',price:20,status:'pending',images:[],category:'Vainas'},
      {id:'td3',product:'Propio',store:'iGUN Airsoft',price:30,shipping:3,status:'pending',images:[],category:'Vainas'});render();}""")
    comprobar(await a.pg.evaluate("missingList(items.find(i=>i.id==='td2')).some(m=>m[0]==='envío')"), 'sin ficha debería faltar el envío')
    await a.pg.click('[data-nav=explore]'); await a.pg.wait_for_timeout(200); await a.pg.click('#tab-shops'); await a.pg.wait_for_timeout(300)
    await a.pg.click('[data-shopcard=igunairsoft]'); await a.pg.wait_for_timeout(200)
    await a.pg.fill('#td_shipping', '5,95'); await a.pg.fill('#td_freeFrom', '150'); await a.pg.fill('#td_phone', '600 000 000')
    await a.pg.select_option('#td_rating', '5'); await a.pg.fill('#td_people', 'Toni, el de las Luger')
    await a.foto('tienda-ficha')
    await a.pg.click('#tdSave'); await a.pg.wait_for_timeout(300)
    r = await a.pg.evaluate("['td1','td2','td3'].map(id=>calc(items.find(i=>i.id===id)).total)")
    comprobar(abs(r[0]-200) < 0.01 and abs(r[1]-25.95) < 0.01 and abs(r[2]-33) < 0.01, f'los portes de la tienda no se aplican bien (el del artículo manda; gratis desde 150): {r}')
    comprobar(await a.pg.evaluate("!missingList(items.find(i=>i.id==='td2')).some(m=>m[0]==='envío')"), 'con ficha de tienda sigue faltando el envío')
    comprobar(await a.pg.evaluate("JSON.parse(localStorage.getItem('shops')).igunairsoft.people") == 'Toni, el de las Luger', 'no se guarda la ficha')
    await a.foto('tiendas')
    # No envía, sin IVA y país de fuera de la UE desde la ficha
    await a.pg.evaluate("shopSave('igunairsoft',{ships:'no',vat:'no'})")
    r = await a.pg.evaluate("[canBuy(items.find(i=>i.id==='td2')), calc(items.find(i=>i.id==='td2')).vatAdd>0]")
    comprobar(r == [False, True], f'«no envía» o «sin IVA» de la tienda no se aplican: {r}')
    await a.pg.evaluate("shopSave('igunairsoft',{ships:'si',country:'TW'})")
    r = await a.pg.evaluate("[canBuy(items.find(i=>i.id==='td2')), outsideEU(items.find(i=>i.id==='td2'))]")
    comprobar(r == [True, True], f'país de la tienda o «sí envía» mal: {r}')
    # Nueva tienda sin artículos sale en «Otras tiendas guardadas»
    await a.pg.evaluate("()=>{shopSave('tiendanueva',{name:'Tienda Nueva',rating:'4'});render();}"); await a.pg.wait_for_timeout(200)
    comprobar(await a.n('[data-shopcard=tiendanueva]') == 1, 'una tienda sin artículos no aparece en Tiendas')


async def p_tiendas_sugerencias(a):
    await a.abrir(extra=EXTRA)
    await a.pg.evaluate("""()=>{const b={status:'pending',images:[],store:'Sug Shop',category:'Vainas'};
      items.push({...b,id:'sg1',product:'A',price:10,shipping:6.9},{...b,id:'sg2',product:'B',price:11,shipping:6.9,freeFrom:100},{...b,id:'sg3',product:'C',price:12,shipping:4.5},
                 {...b,id:'sg4',product:'D',price:13},{...b,id:'sg5',product:'E',price:14});render();}""")
    s = await a.pg.evaluate("shopSuggest('sugshop').map(x=>[x.f,x.val,x.n,x.missing,x.other])")
    comprobar(['shipping', '6.9', 2, 2, 1] in s, f'no propone el valor mayoritario de portes: {s}')
    await a.pg.click('[data-nav=explore]'); await a.pg.wait_for_timeout(200); await a.pg.click('#tab-shops'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.querySelector('[data-sugfill=\"sugshop|shipping\"]').scrollIntoView({block:'center'})")
    await a.foto('tiendas-sugerencias')
    await a.pg.click('[data-sugfill="sugshop|shipping"]'); await a.pg.wait_for_timeout(300)
    r = await a.pg.evaluate("['sg3','sg4'].map(id=>calc(items.find(i=>i.id===id)).ship)")
    comprobar(r == [4.5, 6.9], f'«aplicar a los sin dato» mal (el que tiene otro valor no se toca): {r}')
    comprobar(await a.n('[data-sugfill="sugshop|shipping"]') == 0, 'tras aplicar sigue proponiendo «aplicar a los sin dato»')
    # Listado de la tienda plegado; se despliega al tocar
    comprobar(await a.pg.evaluate("!document.querySelector('[data-shopdet=sugshop]').open"), 'el listado de la tienda no sale plegado')
    await a.pg.click('[data-shopdet=sugshop] > summary'); await a.pg.wait_for_timeout(100); await a.pg.evaluate("render()"); await a.pg.wait_for_timeout(100)
    comprobar(await a.pg.evaluate("document.querySelector('[data-shopdet=sugshop]').open"), 'el listado no se despliega o se vuelve a plegar al redibujar')
    await a.foto('tiendas-plegado')
    await a.pg.click('[data-sugall="sugshop|shipping"]'); await a.pg.wait_for_timeout(100); await a.pg.click('[data-sugall="sugshop|shipping"]'); await a.pg.wait_for_timeout(300)
    comprobar(await a.pg.evaluate("items.find(i=>i.id==='sg3').shipping") == 6.9, '«aplicar a todos» no cambia el que tenía otro valor')


async def p_comprobar_seleccion(a):
    await a.abrir(extra=EXTRA)
    # Sin nada marcado, el segundo toque avisa; con marcados, mensaje final aunque falle la lectura
    await a.pg.click('[data-nav=explore]'); await a.pg.wait_for_timeout(200)
    await a.pg.click('#checkTop'); await a.pg.wait_for_timeout(150); await a.pg.click('#checkTop'); await a.pg.wait_for_timeout(150)
    st = await a.pg.inner_text('#statusTxt')
    comprobar('No has marcado nada' in st, f'segundo toque sin selección no avisa: {st}')
    await a.pg.evaluate("""()=>{localStorage.setItem('apiKey','clave-de-prueba');window.__ck=checkItem;checkItem=async()=>{throw new Error('red caída')};
      items.push({id:'cs1',product:'Prueba',store:'T',url:'https://ejemplo.com/a',price:5,status:'pending',images:[]});sel.add('cs1');render();}""")
    await a.pg.click('#selCheck'); await a.pg.wait_for_timeout(400)
    st = await a.pg.inner_text('#statusTxt')
    comprobar('Terminado' in st and 'no se pudieron leer' in st, f'sin mensaje final al comprobar marcados: {st}')
    await a.pg.evaluate("()=>{checkItem=window.__ck;localStorage.removeItem('apiKey');}")


async def p_tendencias(a):
    await a.abrir(extra=EXTRA)
    d = lambda n: f"new Date(Date.now()-{n}*864e5).toISOString()"
    await a.pg.evaluate(f"""()=>{{const b={{status:'pending',images:[],store:'T'}};items.push(
      {{...b,id:'tn1',product:'Baja mes',price:80,history:[{{at:{d(40)},price:120}},{{at:{d(20)},price:100}},{{at:{d(0)},price:80}}]}},
      {{...b,id:'tn2',product:'Sube',price:60,history:[{{at:{d(10)},price:50}},{{at:{d(0)},price:60}}]}},
      {{...b,id:'tn3',product:'Engaño',price:90,history:[{{at:{d(25)},price:70}},{{at:{d(5)},price:110}},{{at:{d(0)},price:90}}]}});render();}}""")
    r = await a.pg.evaluate("[trendOf(items.find(i=>i.id==='tn1'),'30').pct, trendOf(items.find(i=>i.id==='tn1'),'all').pct, trendOf(items.find(i=>i.id==='tn1'),'7').pct, trendOf(items.find(i=>i.id==='tn1'),'all').atLow]")
    comprobar(abs(r[0]+33.33) < 0.1 and abs(r[1]+33.33) < 0.1 and abs(r[2]+20) < 0.01 and r[3] is True, f'variación por periodo mal: {r}')
    await a.pg.click('[data-nav=explore]'); await a.pg.wait_for_timeout(200); await a.pg.click('#tab-trends'); await a.pg.wait_for_timeout(300)
    comprobar(await a.n('.trrow') >= 2, 'la pestaña Tendencias no muestra las bajadas')
    await a.foto('tendencias')
    await a.pg.click('[data-trord=fake]'); await a.pg.wait_for_timeout(200)
    t = await a.pg.inner_text('#view')
    comprobar('Engaño' in t and 'Baja mes' not in t, 'el apartado «bajada engañosa» no filtra bien')
    await a.pg.click('[data-trper=all]'); await a.pg.click('[data-trord=up]'); await a.pg.wait_for_timeout(200)
    comprobar('Sube' in await a.pg.inner_text('#view'), 'subidas no aparecen')


async def p_comprobar_masiva(a):
    await a.abrir(extra=EXTRA)
    # La masiva salta lo comprobado hace <24 h y las tiendas que bloquean, y va de 3 en 3
    await a.pg.evaluate("""()=>{localStorage.setItem('apiKey','clave-de-prueba');window.__ck=checkItem;window.__vivos=0;window.__max=0;window.__hechos=[];
      checkItem=async it=>{__vivos++;__max=Math.max(__max,__vivos);await new Promise(r=>setTimeout(r,150));__vivos--;__hechos.push(it.id);it.checkedAt=new Date().toISOString();return{ok:true}};
      const b={status:'pending',images:[],store:'T',price:5};const h=new Date(Date.now()-2*36e5).toISOString(),v=new Date(Date.now()-48*36e5).toISOString();
      items.push({...b,id:'mz1',product:'Reciente',url:'https://e.com/1',checkedAt:h},{...b,id:'mz2',product:'Bloqueada',url:'https://e.com/2',checkErr:'blocked',checkedAt:v});
      for(let i=3;i<10;i++)items.push({...b,id:'mz'+i,product:'Viejo '+i,url:'https://e.com/'+i,checkedAt:v});
      selMode=true;sel.clear();for(let i=1;i<10;i++)sel.add('mz'+i);render();}""")
    await a.pg.click('#selCheck'); await a.pg.wait_for_timeout(1500)
    r = await a.pg.evaluate("[__hechos.slice().sort(),__max]")
    st = await a.pg.inner_text('#statusTxt')
    comprobar('mz1' not in r[0] and 'mz2' not in r[0] and len(r[0]) == 7, f'la masiva no salta recientes o bloqueadas: {r}')
    comprobar(r[1] == 3, f'no comprueba de 3 en 3: {r[1]}')
    comprobar('Saltados' in st and 'menos de 24 h' in st and 'bloquean' in st, f'el mensaje final no dice lo saltado: {st}')
    await a.pg.evaluate("()=>{checkItem=window.__ck;localStorage.removeItem('apiKey');}")
    # La comprobación usa la lectura rápida (página recortada, respuesta corta)
    body = await a.pg.evaluate("""async()=>{localStorage.setItem('apiKey','clave-de-prueba');let b=null;const f=window.fetch;window.fetch=async(u,o)=>{b=JSON.parse(o.body);throw new Error('x')};
      try{await askClaude({url:'https://e.com/z',quick:true});}catch(e){}window.fetch=f;localStorage.removeItem('apiKey');return b}""")
    comprobar(body and body['max_tokens'] == 1500 and body['tools'][0].get('max_content_tokens') == 30000 and body['tools'][0]['max_uses'] == 1, f'la comprobación no usa la lectura rápida: {body and body.get("tools")}')


async def p_importes(a):
    await a.abrir(extra=EXTRA)
    await a.pg.click('[data-nav=add]'); await a.pg.wait_for_timeout(200); await a.pg.click('#addLink'); await a.pg.wait_for_timeout(300)
    await a.pg.evaluate("document.getElementById('form').querySelectorAll('details').forEach(d=>d.open=true)")
    casos = {'fPrice': ('1299,5', '1.299,50'), 'fShip': ('6,250', '6,25'), 'fFree': ('1.000', '1.000'), 'fDisc': ('6.5', '6,50')}
    for id, (escrito, visto) in casos.items():
        await a.pg.evaluate("""([id,v])=>{const e=document.getElementById(id);e.scrollIntoView();e.focus();e.value=v;e.blur();}""", [id, escrito])
        r = await a.pg.input_value('#' + id)
        comprobar(r == visto, f'{id}: escrito «{escrito}» queda «{r}», debía ser «{visto}»')
    ancho = await a.pg.evaluate("document.getElementById('fShip').getBoundingClientRect().width")
    comprobar(ancho > 150, f'la casilla del envío es demasiado estrecha ({ancho:.0f}px)')
    await a.foto('importes')


async def p_costes(a):
    await a.abrir()
    await a.pg.evaluate("logUse('claude-haiku-4-5',{input_tokens:100000,output_tokens:20000,server_tool_use:{web_search_requests:2}})")
    await a.pg.click('#openSettings'); await a.pg.wait_for_timeout(300)
    t = await a.pg.inner_text('#costBox')
    comprobar('1 lectura' in t and '≈' in t, f'Ajustes no enseña el gasto de Claude: {t[:120]}')


PRUEBAS = {k[2:]: v for k, v in globals().items() if k.startswith('p_')}


async def main(sel):
    puerto = libre()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(puerto), '--bind', '127.0.0.1'], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    fallos = 0
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
            for nombre in (sel or PRUEBAS):
                ctx = await b.new_context(viewport={'width': 400, 'height': 860}, device_scale_factor=2)
                a = App(await ctx.new_page(), f'http://127.0.0.1:{puerto}')
                t = time.time()
                try:
                    await PRUEBAS[nombre](a)
                    comprobar(not a.errores, 'errores de JavaScript: ' + ' | '.join(a.errores[:3]))
                    print(f'  ✓ {nombre} ({time.time()-t:.1f}s)')
                except Exception as e:
                    fallos += 1
                    print(f'  ✗ {nombre}: {e}')
                    try: await a.foto('FALLO-' + nombre)
                    except Exception: pass
                await ctx.close()
            await b.close()
    finally:
        srv.terminate()
    print('Todo bien.' if not fallos else f'{fallos} prueba(s) fallan.')
    return fallos


if __name__ == '__main__':
    sys.exit(1 if asyncio.run(main(sys.argv[1:])) else 0)
