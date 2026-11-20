# Guía para Claude Code: seguridad y velocidad

Dos reels de Instagram del mismo autor, con el mismo formato: una lista de 25 pautas para pedirle a Claude.
- **Parte I – Seguridad:** «Claude, no quiero que me hackeen la app» (secciones 1-5).
- **Parte II – Velocidad:** «Claude, no quiero que mi app vaya lenta» (secciones 6-9).

# PARTE I · SEGURIDAD

Fuente: reel de Instagram (65 s). Transcripción sacada de los subtítulos incrustados en el vídeo, revisada fotograma a fotograma. Se ha quitado la publicidad del final («la tienes en nuestra bóveda de herramientas, comenta CODIGO»).

---

## 1. Transcripción literal

> Claude, no quiero que me hackeen la app que he montado con vibe coding. Así que, por favor:
>
> Configura bien la autenticación. Saca las claves de API del navegador. Protege mi base de datos. Fuerza HTTPS. Guarda las contraseñas con hash.
>
> Valida los formularios en el servidor. Protégeme del XSS. Registra y vigila la actividad sospechosa. Blinda las rutas de administración. Usa consultas parametrizadas.
>
> Revisa mis variables de entorno, pon límite de peticiones. Restringe el CORS. Añade cabeceras de seguridad. Asegura las cookies de sesión.
>
> Añade protección CSRF y que los enlaces de recuperación caduquen. También limita el tipo y tamaño de los archivos que se suben. Verifica precios y pagos en servidor. Apaga el modo de depuración en producción.
>
> Actualiza las dependencias vulnerables. Quita los paquetes que no uso. Busca archivos expuestos. Busca secretos filtrados en el historial de Git. Revoca y cambia las claves comprometidas.
>
> Haz una revisión de seguridad a fondo. Al final, prueba las protecciones y dame un informe de lo que has encontrado y lo que has arreglado.

---

## 2. Las 25 pautas, en 5 bloques de 5 (como aparecen en pantalla)

### Bloque A: lo básico
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 1 | Autenticación sólida | Inicio de sesión con un proveedor fiable (Firebase Auth, Supabase, Auth0…). Sesiones que caducan. Nada de «usuario/contraseña» en el código. |
| 2 | Claves de API fuera del navegador | Las claves secretas (pagos, IA, correo) van solo en el servidor o en funciones *serverless*. En el navegador solo pueden ir claves públicas por diseño (p. ej. la `apiKey` de Firebase). |
| 3 | Base de datos protegida | Reglas de acceso por usuario: cada uno lee y escribe solo lo suyo (reglas de Firestore, RLS en Supabase). Nunca reglas abiertas (`allow read, write: if true`). |
| 4 | HTTPS forzado | Todo por `https://`, con redirección de http a https y HSTS si el hosting lo permite. |
| 5 | Contraseñas con hash | Si guardas contraseñas propias: bcrypt o argon2, nunca en texto ni con MD5/SHA1. Mejor aún: que lo haga el proveedor de autenticación. |

### Bloque B: entradas y accesos
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 6 | Validar en servidor | Lo que valida el formulario del navegador se puede saltar. Hay que volver a comprobar tipos, longitudes y permisos en el servidor (o en las reglas de la base de datos). |
| 7 | Protección XSS | Todo texto que venga de usuarios o de webs externas se escapa antes de pintarlo. Nada de `innerHTML` con datos sin escapar. Los enlaces, solo `http(s)`. |
| 8 | Vigilar actividad rara | Registro de inicios de sesión fallidos, borrados masivos, picos de peticiones… y algún aviso. |
| 9 | Blindar rutas de administración | Las páginas y acciones de administración comprueban el rol **en el servidor**, no solo ocultando el botón. |
| 10 | Consultas parametrizadas | Nunca construir SQL/NoSQL pegando texto del usuario. Usar parámetros o el ORM. |

### Bloque C: configuración
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 11 | Variables de entorno | Los secretos en `.env` (fuera de Git) o en el gestor del hosting. Ojo con los prefijos `PUBLIC_` / `NEXT_PUBLIC_` / `VITE_`: lo que los lleva **acaba en el navegador** (el vídeo muestra `PUBLIC_PAY_SECRET` como error). |
| 12 | Límite de peticiones | *Rate limiting* en el inicio de sesión, los formularios y la API, para frenar ataques de fuerza bruta y abusos que disparan la factura. |
| 13 | CORS restringido | La API solo acepta peticiones de tus dominios, no `*`. |
| 14 | Cabeceras de seguridad | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `frame-ancestors` / `X-Frame-Options`. |
| 15 | Cookies seguras | Cookies de sesión con `HttpOnly`, `Secure` y `SameSite=Lax` o `Strict`. |

### Bloque D: flujos sensibles
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 16 | Protección CSRF | Token CSRF o `SameSite` en formularios que cambian datos cuando la sesión va por cookie. |
| 17 | Enlaces que caducan | Los enlaces de recuperar contraseña o de invitación son de un solo uso y caducan (p. ej. en 1 h). |
| 18 | Límite de archivos | Al subir archivos: lista de tipos permitidos, comprobar el contenido real (no solo la extensión) y un tamaño máximo (el vídeo muestra «imágenes, máx. 10 MB»). |
| 19 | Precios en servidor | El precio y el total se calculan en el servidor. Nunca fiarse del precio que manda el navegador. Los pagos se confirman con el *webhook* de la pasarela. |
| 20 | Sin modo depuración | En producción: sin `debug`, sin trazas de error visibles para el usuario y sin mapas de código ni paneles de pruebas publicados. |

### Bloque E: limpieza
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 21 | Dependencias al día | `npm audit` / `pip-audit` y actualizar lo vulnerable. |
| 22 | Fuera paquetes inútiles | Quitar dependencias que no se usan: menos superficie de ataque. |
| 23 | Archivos expuestos | Que no se publiquen `.env`, `.git/`, copias de seguridad, volcados de base de datos, `*.map` ni carpetas de pruebas. |
| 24 | Secretos en Git | Buscar claves en **todo el historial**, no solo en la versión actual (borrar un archivo no lo borra del historial). |
| 25 | Revocar claves | Toda clave que haya estado expuesta se da por robada: se revoca en el proveedor y se crea una nueva. Esto lo tiene que hacer una persona en el panel de cada servicio. |

### Cierre
**Revisión a fondo → probar las protecciones → informe de lo encontrado y lo arreglado.**

---

## 3. Cómo usarlo en cualquier proyecto de Claude Code (escritorio)

### Opción rápida: pegar el prompt
Abre el proyecto en Claude Code y pega el bloque de la sección 4. Funciona tal cual.

### Opción recomendada: convertirlo en una *skill* reutilizable
1. En tu ordenador, crea la carpeta `~/.claude/skills/revision-seguridad/` (en Windows: `C:\Users\<tu usuario>\.claude\skills\revision-seguridad\`).
2. Copia dentro el archivo `SKILL.md` que acompaña a esta guía.
3. En cualquier proyecto, escribe `/revision-seguridad` (o pide «haz una revisión de seguridad») y Claude seguirá la lista.

Al estar en `~/.claude/skills/` vale para **todos** tus proyectos. Si quieres que sea solo de un proyecto, ponla en `<proyecto>/.claude/skills/revision-seguridad/`.

### Tres reglas para que salga bien
1. **Primero el informe y después los cambios.** Pide que diga qué aplica y qué no antes de tocar nada. No todas las pautas aplican a todas las apps: una web estática sin servidor no tiene CORS ni cookies de sesión propias.
2. **No romper funciones.** Cada arreglo, con su prueba, y la batería de pruebas en verde antes de publicar.
3. **Lo que no puede hacer Claude, en una lista aparte.** Revocar claves en los paneles de Anthropic, Stripe o Google, activar HSTS en el hosting, publicar reglas de Firestore… Claude te deja los pasos y lo haces tú.

---

## 4. Prompt listo para pegar

```text
Haz una revisión de seguridad a fondo de este proyecto. No quiero que me hackeen la app.

Paso 1. Antes de cambiar nada, lee el proyecto (y su CLAUDE.md si existe) y dime qué tipo de app es
(estática, con servidor, serverless, con qué base de datos y autenticación). Después repasa esta lista
y marca cada punto como: OK / FALLA (con archivo:línea) / NO APLICA (por qué):

A. Autenticación sólida · claves de API fuera del navegador · base de datos protegida (reglas por usuario)
   · HTTPS forzado · contraseñas con hash
B. Validar en servidor · protección XSS (escapar texto, enlaces solo http/https) · registro de actividad
   sospechosa · rutas de administración blindadas en servidor · consultas parametrizadas
C. Variables de entorno (ningún secreto con prefijo PUBLIC_/NEXT_PUBLIC_/VITE_) · límite de peticiones
   · CORS restringido · cabeceras de seguridad (CSP, nosniff, Referrer-Policy, frame-ancestors)
   · cookies HttpOnly/Secure/SameSite
D. CSRF · enlaces de recuperación de un solo uso y que caducan · tipo y tamaño de archivos subidos
   · precios y pagos verificados en servidor · modo depuración apagado en producción
E. Dependencias vulnerables (audit) · paquetes que no se usan · archivos expuestos (.env, .git, .map,
   copias de seguridad) · secretos en TODO el historial de Git · claves que hay que revocar

Paso 2. Arregla los FALLA que puedas arreglar en el código, de más grave a menos grave. Reglas:
- No quites ni simplifiques ninguna función de la app.
- Cada arreglo con su prueba automática; la batería de pruebas tiene que acabar en verde.
- Nunca escribas claves reales en el código, en la documentación ni en los mensajes de commit.

Paso 3. Prueba las protecciones (intenta el ataque y demuestra que ya no funciona).

Paso 4. Dame un informe con tres listas:
1) Encontrado y arreglado (con la prueba que lo demuestra).
2) Encontrado y NO arreglado (por qué, y riesgo real: alto/medio/bajo).
3) Lo que tengo que hacer yo a mano (revocar claves, ajustes del hosting o de la consola de Firebase/Supabase...),
   con los pasos exactos.
```

---

## 5. Aviso para el Comparador

La pauta 2 («saca las claves de API del navegador») choca con el diseño actual del Comparador: la clave de Anthropic se guarda en `localStorage` del móvil y se envía directamente a api.anthropic.com. Ya está apuntado como pendiente en su CLAUDE.md. Hoy se mitiga con la prueba `seguridad_xss`, pero la solución de fondo que propone el vídeo sería una función de servidor intermedia, y el plan Spark de Firebase no incluye Cloud Functions. Conviene decidirlo antes de ampliar el uso compartido.

---

# PARTE II · VELOCIDAD

Fuente: segundo reel (61 s), mismo autor y mismo formato. Transcripción sacada de los subtítulos incrustados, sin la publicidad final.

## 6. Transcripción literal

> Claude, no quiero que mi app vaya lenta y pierda usuarios. Así que, por favor:
>
> Añade esqueletos de carga. Sirve las imágenes en WebP o AVIF. Evita llamadas duplicadas a la API. Pon un retardo a la búsqueda con autocompletado. Pagina los resultados de la API.
>
> Sirve los archivos estáticos desde una CDN. Manda las tareas lentas a una cola de trabajos. Arregla las consultas N+1. Activa la compresión Brotli. Lanza en paralelo las peticiones que no dependen unas de otras.
>
> Crea índices para las consultas más comunes. Rastrea las peticiones lentas con OpenTelemetry. Acerca el servidor a la base de datos, renderiza en el servidor o en la compilación. Carga los scripts de terceros después de la página.
>
> Divide el JavaScript por página. Virtualiza las listas largas. Pide solo las columnas que necesites. Usa un pool de conexiones. Evita los renderizados innecesarios.
>
> Cachea los estáticos en navegador. Reparte el tráfico entre varias instancias. Aloja tus propias fuentes y limita los grosores. Monitoriza la velocidad de tus usuarios reales. Y prueba en móviles y en redes lentas.

## 7. Las 25 pautas, en 5 bloques (como aparecen en pantalla)

### Bloque A: lo que nota el usuario
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 1 | Esqueletos de carga | Mientras llegan los datos, se ve la forma de la página (tarjetas grises) en lugar de una pantalla en blanco o un spinner. Parece más rápida y no «salta». |
| 2 | Imágenes WebP o AVIF | Pesan del 30 al 50 % menos que JPG o PNG. Además: tamaño ajustado a la pantalla (`srcset`), `loading="lazy"` fuera de pantalla y `width`/`height` para que no se mueva el diseño. |
| 3 | Sin llamadas duplicadas | Si tres partes de la pantalla piden lo mismo, se hace una sola petición compartida (caché en memoria, SWR o React Query, «deduplicar»). |
| 4 | Retardo en búsquedas | *Debounce* de 250 a 400 ms en el autocompletado: se busca cuando el usuario deja de teclear, no con cada letra. Cancelar la búsqueda anterior si llega otra. |
| 5 | Paginar la API | Nunca devolver «todo». Páginas de 20 a 50 elementos, o scroll infinito con cursor. |

### Bloque B: servidor y red
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 6 | Estáticos desde CDN | JS, CSS, imágenes y fuentes servidos desde una CDN (Cloudflare, el hosting de Vercel, Netlify o Firebase ya la llevan). |
| 7 | Cola de trabajos | Enviar correos, generar PDF o procesar imágenes no bloquea la respuesta: va a una cola o tarea en segundo plano y se avisa al terminar. |
| 8 | Adiós consultas N+1 | No hacer una consulta por cada elemento de una lista (1 para la lista + N para los detalles). Traerlo todo en una o dos consultas (`JOIN`, `include`, `in`). |
| 9 | Compresión Brotli | Activar Brotli (o al menos gzip) en el servidor o la CDN para HTML, JS, CSS y JSON. |
| 10 | Peticiones en paralelo | Lo que no depende entre sí se pide a la vez (`Promise.all`) en lugar de una detrás de otra. |

### Bloque C: base de datos y renderizado
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 11 | Índices en consultas | Índices en los campos por los que más se filtra u ordena (en Firestore, índices compuestos). |
| 12 | Rastreo de peticiones | Medir qué peticiones son lentas y dónde se pierde el tiempo (OpenTelemetry, Sentry, los registros del hosting). |
| 13 | Servidor junto a la BD | El servidor y la base de datos en la misma región. Cada viaje entre continentes suma 100 ms o más. |
| 14 | Render en servidor | Páginas generadas en el servidor (SSR) o al compilar (SSG) para que el primer pintado no espere a que cargue todo el JavaScript. |
| 15 | Scripts ajenos al final | Analítica, chats, píxeles y mapas con `defer`/`async` o cargados después del contenido principal. |

### Bloque D: el código del navegador
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 16 | JavaScript por página | Dividir el código (*code splitting*, `import()` dinámico): cada pantalla descarga solo lo suyo. |
| 17 | Virtualizar listas | En listas de cientos o miles de elementos, pintar solo los que se ven (react-window, `content-visibility: auto` o paginado visual). |
| 18 | Solo columnas útiles | Pedir solo los campos que se usan (`SELECT a, b` y no `SELECT *`; *select* en el ORM). |
| 19 | Pool de conexiones | Reutilizar conexiones a la base de datos en lugar de abrir una por petición (imprescindible en *serverless*: PgBouncer, el pooler de Supabase o Prisma Accelerate). |
| 20 | Sin renders de más | Evitar que la interfaz se repinte entera por cualquier cambio: memoizar, actualizar solo lo que cambia y no recalcular en cada pintado. |

### Bloque E: entrega y medición
| # | Pauta | Qué significa en la práctica |
|---|---|---|
| 21 | Caché en el navegador | Cabeceras `Cache-Control` largas para archivos con versión (`app.js?v=123` o con hash). Service worker para que funcione sin conexión. |
| 22 | Varias instancias | Repartir el tráfico entre varias copias del servidor (balanceo o autoescalado) para que un pico no lo tumbe. |
| 23 | Fuentes propias | Alojar las tipografías en tu dominio (no en Google Fonts), en WOFF2, solo los grosores que uses y con `font-display: swap`. |
| 24 | Velocidad real | Medir lo que viven los usuarios reales (Core Web Vitals: LCP, INP, CLS) con la librería `web-vitals`, Vercel Analytics o Search Console, no solo en tu ordenador. |
| 25 | Móviles y redes lentas | Probar con un móvil de gama media y la red limitada («Slow 4G» en las herramientas de Chrome o con Lighthouse). |

## 8. Prompt de velocidad listo para pegar

```text
Haz una revisión de velocidad a fondo de este proyecto. No quiero que la app vaya lenta y pierda usuarios.

Paso 1. Antes de cambiar nada, lee el proyecto (y su CLAUDE.md si existe), dime qué tipo de app es y MIDE:
peso de la descarga inicial, tiempo de carga, LCP, INP y CLS (Lighthouse o Playwright, con móvil emulado y
red Slow 4G). Después marca cada punto como OK / MEJORABLE (archivo:línea y ganancia estimada) / NO APLICA:

A. Esqueletos de carga · imágenes WebP/AVIF con tamaño ajustado y lazy · sin llamadas duplicadas a la API
   · debounce en búsquedas · paginar resultados
B. Estáticos desde CDN · tareas lentas en cola/segundo plano · consultas N+1 · compresión Brotli/gzip
   · peticiones independientes en paralelo
C. Índices para las consultas comunes · rastreo de peticiones lentas · servidor y BD en la misma región
   · render en servidor o en compilación · scripts de terceros al final
D. JavaScript dividido por página · listas largas virtualizadas · pedir solo los campos necesarios
   · pool de conexiones · evitar renderizados innecesarios
E. Caché del navegador para estáticos con versión · varias instancias · fuentes propias y pocos grosores
   · medición con usuarios reales · prueba en móvil y red lenta

Paso 2. Aplica las mejoras de más impacto a menos. Reglas:
- No quites ni simplifiques ninguna función ni cambies el diseño para ganar velocidad.
- Cada mejora con su prueba; la batería de pruebas tiene que acabar en verde.
- No cambies el modelo de datos sin copia de seguridad comprobada y migración sin pérdida.

Paso 3. Vuelve a medir en las mismas condiciones.

Paso 4. Informe: tabla antes/después de las métricas, lista de lo mejorado, lo que no se ha hecho
(motivo y ganancia que se pierde) y lo que tengo que hacer yo (ajustes del hosting o la CDN, región del servidor...).
```

## 9. Cómo encaja con la Parte I
- Son dos skills distintas: `/revision-seguridad` y `/revision-velocidad`. Se instalan igual (sección 3).
- Orden recomendado: **primero seguridad y después velocidad.** Algunas mejoras de velocidad (cachés, CDN, scripts de terceros) tocan cabeceras y CSP; conviene que la seguridad ya esté en su sitio y que la revisión de velocidad no la afloje.
- **En el Comparador** (PWA en el móvil con IndexedDB y Firestore, sin servidor propio), las que más aplican son:
  - las de la interfaz: esqueletos de carga, fotos en WebP con tamaño ajustado, debounce en la búsqueda, virtualizar listas largas y evitar repintados;
  - las de entrega: caché del navegador y service worker (ya existe `?v=` con `tools/bump.py`);
  - las de Firestore: índices y pedir solo lo necesario.

  Las de servidor (cola, pool, instancias, región) no aplican mientras no haya servidor. Convertir fotos ya guardadas a WebP es un cambio de datos: antes, copia de seguridad comprobada.
