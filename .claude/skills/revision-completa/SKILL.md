---
name: revision-completa
description: Mega sprint de calidad: aplica primero la skill revision-seguridad y después revision-velocidad (50 pautas en total) con un único plan, pruebas y un informe final. Úsala cuando pidan «revisarlo todo», «seguridad y velocidad a la vez», un mega sprint o una revisión antes de un lanzamiento o rediseño.
---

# Revisión completa (seguridad + velocidad)

Esta skill no repite las pautas: **lee y sigue** las skills `revision-seguridad` y `revision-velocidad`, que deben estar instaladas a su lado (`~/.claude/skills/` o `.claude/skills/` del proyecto). Si falta alguna, para y dilo.

## 0. Red de seguridad (antes de tocar nada)
- Comprueba que el árbol de Git está limpio y crea una rama `sprint-seguridad-velocidad`. Nunca trabajes en `main`.
- Si la app guarda datos de usuarios (base de datos, IndexedDB, archivos), confirma que hay una copia de seguridad reciente y **restaurable**. Si no la hay, prepárala o pídela antes de seguir.
- Lanza la batería de pruebas y anota el estado inicial. Si ya falla algo, dilo antes de empezar.

## 1. Auditoría conjunta (sin cambiar nada)
- Paso 1 de `revision-seguridad`: las 25 pautas, marcadas OK / FALLA / NO APLICA.
- Paso 1 de `revision-velocidad`: medición inicial y las 25 pautas, marcadas OK / MEJORABLE / NO APLICA.
- Junta todo en **un único plan** ordenado así:
  1. Seguridad grave.
  2. Seguridad media y baja.
  3. Velocidad de más impacto a menos.

  Si una mejora de velocidad choca con una de seguridad (caché, CDN, scripts de terceros, CSP), gana seguridad.
- Enseña el plan y espera el visto bueno antes de aplicarlo, salvo que el usuario haya pedido expresamente aplicarlo todo sin parar.

## 2. Aplicación por tandas
- Una tanda por bloque, con un commit por tanda y un mensaje claro.
- Después de cada tanda, la batería de pruebas en verde. Si algo se rompe, arréglalo o deshaz esa tanda antes de seguir.
- Reglas de las dos skills: no quitar ni simplificar funciones, no cambiar el diseño, nada de claves reales en el código y ningún cambio de modelo de datos sin migración sin pérdida.
- Respeta el CLAUDE.md del proyecto (normas de pruebas, versión y publicación).

## 3. Comprobación final
- Repite los ataques corregidos (paso 3 de seguridad).
- Repite la medición de velocidad en las mismas condiciones (paso 3 de velocidad).
- Batería completa en verde.

## 4. Informe único
1. Resumen en 5 líneas: qué estaba mal y qué ha mejorado.
2. Seguridad: lo arreglado (con su prueba), lo no arreglado (con su riesgo) y las tareas manuales.
3. Velocidad: tabla antes/después, lo mejorado y lo no hecho.
4. Tareas manuales del usuario, juntas y con los pasos exactos (revocar claves, hosting, CDN, consola de la base de datos…).
5. Cómo publicar: comandos del proyecto, o abrir un pull request desde la rama del sprint.
