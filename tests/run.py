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
