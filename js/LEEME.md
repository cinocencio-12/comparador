# Código de la app, por partes

`index.html` solo tiene la estructura (pantallas, formularios) y carga, en este orden:

| Archivo | Qué hay |
|---|---|
| `css/01-base.css` … `css/04-identidad.css` | Estilos por capas: base, interfaz, Comparador 2.0 e identidad visual (violeta/naranja, claro y oscuro). La última manda. |
| `01-base.js` | Formato de números y euros, IndexedDB, fotos (copia en el móvil, fotos rotas). |
| `02-datos.js` | Cálculo del coste total (portes, importación), agrupación, búsqueda, filtros, precio por unidad, parecidos. |
| `03-vistas.js` | Pintar listas, espacios, categorías, historial de precios. |
| `04-inicio-y-navegacion.js` | Botón atrás de Android, preferencias, Inicio, secciones. |
| `05-avisos-listas-revision.js` | Avisos de precio/stock, listas y regalos, compras, Centro de revisión. |
| `06-ficha.js` | Ficha de producto (pestañas, fusionar, vincular, categorías distintas), tendencias, regalos. |
| `07-ajustes-categorias.js` | Ajustes, categorías y subcategorías, ficha técnica. |
| `08-claude-y-monedas.js` | Lectura con Claude, monedas y cambio, guardar desde el marcador. |
| `09-editor.js` | Formulario de crear/editar, copiar datos, modos del editor. |
| `10-fotos-y-acciones.js` | Buscar fotos, acciones de cada oferta, visor de fotos, copia de seguridad, etiquetas. |
| `11-comprobar-y-comprar.js` | Comprobar precios, comprar, releer, clasificar, completar fotos. |
| `12-nube.js` | Firebase: cuenta, sincronización, compartir, reservas. |
| `13-arranque.js` | Arranque de la app. |

Los archivos comparten variables globales (no son módulos ES): el orden importa. Un nombre nuevo no debe coincidir con
uno del navegador (`tests/run.py paneles` lo comprueba).

## Antes de publicar
1. `python3 tests/run.py` → todo en verde.
2. `python3 tools/bump.py` → sube la versión en `APP_V`, `version.json` y los `?v=` de css/js.
