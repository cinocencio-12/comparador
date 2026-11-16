#!/usr/bin/env python3
"""Sube la versión de la app en todos los sitios a la vez (APP_V, version.json y ?v= de css/js).
Uso: python3 tools/bump.py            -> versión nueva con la fecha de hoy + letra siguiente
     python3 tools/bump.py 2026-11-17x
"""
import datetime, json, os, re, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
old = json.load(open(os.path.join(R, 'version.json')))['v']
if len(sys.argv) > 1:
    new = sys.argv[1]
else:
    hoy = datetime.date.today().isoformat()
    if old.startswith(hoy) and len(old) > len(hoy):
        new = hoy + chr(ord(old[len(hoy)]) + 1)
    else:
        new = hoy + 'a'
cambiados = []
for raiz, _, fs in os.walk(R):
    if '.git' in raiz or 'tests' in raiz or 'docs' in raiz:
        continue
    for f in fs:
        if not f.endswith(('.html', '.js')):
            continue
        p = os.path.join(raiz, f); s = open(p, encoding='utf-8').read()
        t = re.sub(r"APP_V='[^']*'", f"APP_V='{new}'", s)
        t = re.sub(r'(\.(?:js|css))\?v=[\w-]+', rf'\1?v={new}', t)
        if t != s:
            open(p, 'w', encoding='utf-8').write(t); cambiados.append(os.path.relpath(p, R))
open(os.path.join(R, 'version.json'), 'w').write(json.dumps({'v': new}) + '\n')
print(f'{old} -> {new} ({", ".join(cambiados) or "sin otros cambios"})')
