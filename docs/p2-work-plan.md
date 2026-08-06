# Plan técnico P2 — Localización y primer catálogo real de Indiscreta

Fecha de planificación: 2026-08-06
Base auditada: `73ea8d8a2a9ef88e5647d775a6b083895be76795`
Rama de planificación: `chore/p2-plan`
Alcance: inspección y planificación; no incluye traducciones, carga de datos,
migraciones ni publicación de imágenes.

## 1. Resumen ejecutivo

P2 debe convertir el storefront parcialmente adaptado en una experiencia
coherente en español de Chile y reemplazar la dependencia operativa del seed
demo por un proceso controlado para el catálogo real. El repositorio está en
condiciones de iniciar esa etapa, pero todavía mezcla textos en español e
inglés, usa `dk` como fallback territorial, formatea dinero con `en-US` y su
seed crea una región europea, precios EUR/USD, inventario artificial y cuatro
productos Medusa publicados.

La recomendación es separar tres conceptos que hoy se cruzan:

- **idioma visible:** `es-CL`, aplicado a textos del storefront y a contenido
  traducible servido por Medusa;
- **mercado:** Chile (`cl`) como país habilitado en una región comercial;
- **moneda:** CLP, con reglas de impuestos, despacho y precios configuradas en
  Medusa independientemente del idioma.

Para una tienda inicialmente monolingüe, se recomienda un diccionario central
tipado para la interfaz, con `es-CL` como locale explícito y una API pequeña de
consulta. Es más seguro que seguir reemplazando literales y evita incorporar
ahora la complejidad de un framework completo. La capa debe dejar un contrato
compatible con agregar diccionarios y selección de locale en el futuro. Los
datos comerciales —títulos, descripciones, categorías, opciones y colecciones—
deben gestionarse en Medusa y no duplicarse en ese diccionario.

Para los primeros productos se recomienda carga manual por Medusa Admin,
usando una ficha maestra aprobada, borradores, revisión por dos personas y un
registro de carga. Para futuras cargas masivas, un importador idempotente y
versionado sobre la API administrativa. Para reconstrucción de ambientes, un
bootstrap reproducible de configuración no comercial separado del catálogo y
un manifiesto/export validado; el seed demo actual no debe reutilizarse en
producción.

Estimación total: **122 horas-persona**, equivalentes a **15,25 jornadas de 8
horas**. Con dependencias resueltas y dos perfiles trabajando en paralelo, la
duración calendario esperada es de **13 días hábiles**. La estimación excluye
esperas por definiciones del propietario, producción fotográfica, aprobación
legal, alta de proveedores y propagación de DNS.

## 2. Estado inicial heredado de P1

P1 quedó aprobado con observaciones. La base heredada aporta pnpm 10.11.1,
Turbo, tareas reales de lint/typecheck/test, flujo comercial aislado en CI,
validación centralizada de entorno, PostgreSQL, cuatro responsabilidades Redis,
procesos API/worker separados, liveness/readiness y selección del File Module
S3 en producción con almacenamiento local seguro en desarrollo.

No se observaron secretos rastreados. Esta planificación no leyó archivos
`.env`, no consultó la base de datos y no ejecutó servicios, seeds ni
migraciones.

Deuda relevante heredada:

- S3 está validado por configuración, pero no existen pruebas reales de subir,
  recuperar y eliminar objetos ni validación del proveedor, CORS, política
  pública o CDN.
- `next.config.js` mantiene `images.unoptimized: true` y permite localhost,
  patrones S3 de AWS y un patrón productivo derivado del entorno.
- El carrito contiene TODO de límite real de inventario; no debe aprobarse P2.6
  sin decidir o corregir ese comportamiento.
- El storefront conserva metadata, errores, cuenta, carrito, checkout y pedidos
  en inglés, aunque home, navegación y footer ya tienen adaptación parcial.
- Falta la configuración concreta de hosting, dominio, pagos, impuestos,
  despacho y observabilidad productiva.

## 3. Inventario de textos y fuentes de contenido

### 3.1 Clasificación por superficie

| Superficie                                                 | Estado observado           | Fuente                                      | Tratamiento P2                                                                                |
| ---------------------------------------------------------- | -------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Home, hero, beneficios, categorías visuales, banners       | Mayoritariamente traducido | Literales del storefront y assets estáticos | Incorporar al diccionario; revisar que claims comerciales estén aprobados                     |
| Navegación y footer                                        | Parcialmente traducido     | Literales del storefront                    | Centralizar; conservar marcas como Visa, Mastercard, TikTok e Instagram                       |
| Selector de país e idioma                                  | Pendiente                  | Storefront, `Intl` y locales de Medusa      | Traducir etiquetas; mostrar idioma y país como controles distintos                            |
| Tienda, ordenamiento, filtros y paginación                 | Pendiente                  | Storefront                                  | Diccionario central; pruebas de accesibilidad                                                 |
| Ficha de producto                                          | Pendiente y dinámica       | Storefront más catálogo Medusa              | UI al diccionario; datos y opciones en Medusa; alt de imágenes desde catálogo                 |
| Carrito y minicart                                         | Parcialmente traducido     | Storefront más cálculos Medusa              | Traducir UI; conservar moneda/SKU; revisar impuestos y stock                                  |
| Checkout                                                   | Pendiente                  | Storefront, Medusa y proveedor de pago      | Traducir campos, validaciones y estados; nombres técnicos de proveedor sólo cuando sean marca |
| Cuenta, registro, direcciones y perfil                     | Pendiente                  | Storefront más mensajes backend             | Traducir UI; mapear errores sanitizados; no traducir email, URL ni identificadores            |
| Pedidos, confirmación y transferencia                      | Pendiente                  | Storefront más estados/datos Medusa         | Traducir rótulos y estados; conservar número de orden y códigos                               |
| Errores, 404, vacíos, loading y mensajes de prueba         | Pendiente                  | Storefront, backend y dependencias          | Mensajes de cliente al diccionario; logs y errores internos permanecen técnicos               |
| Metadata SEO y Open Graph                                  | Parcialmente traducido     | Storefront y catálogo                       | Localizar metadata fija; metadata de producto desde ficha aprobada                            |
| Títulos, descripciones, categorías, colecciones y opciones | Demo/en inglés             | Catálogo Medusa                             | Cargar contenido real en español y usar locale Medusa si se habilita traducción               |
| Nombre y descripción de despacho/pago                      | Demo/en inglés             | Configuración Medusa/proveedor              | Texto comercial aprobado en Admin; marcas y códigos sin traducir                              |
| Mensajes nativos del navegador o proveedor alojado         | Dependencia externa        | Browser, Stripe u otro proveedor            | Configurar locale soportado; documentar cualquier texto no controlable                        |

### 3.2 Evidencia de literales directos

Los componentes contienen textos visibles codificados directamente. La lista
de migración debe generarse por archivo y clave, incluyendo al menos:

- `app`: metadata y páginas de cuenta, carrito, checkout, colecciones, pedidos,
  verificación y páginas no encontradas;
- `modules/account`: login, registro, perfil, direcciones, pedidos y
  transferencias;
- `modules/cart`: carrito vacío, resumen, acciones y minicart;
- `modules/checkout`: direcciones, despacho, descuentos, pago y revisión;
- `modules/common`: totales, precios originales, controles y accesibilidad;
- `modules/layout`: navegación, selector de país/idioma, footer y newsletter;
- `modules/order`: resumen, ayuda, pago, despacho y confirmación;
- `modules/products`: acciones, opciones, stock, galería, pestañas y productos
  relacionados;
- `modules/store`: filtros, ordenamiento y paginación.

Ejemplos concretos pendientes incluyen `Page not found`, `Cart`, `Your
shopping bag is empty`, `First name`, `Select a payment method`, `Order
Summary`, `Material`, `Country of origin`, `Fast delivery`, `Language:` y
metadata como `Overview of your previous orders`. Ya hay ejemplos en español,
como `Cuenta`, `Carrito`, beneficios, hero y textos de colecciones. Esto confirma
que el estado actual es mixto, no una localización completa.

### 3.3 Textos que no deben traducirse automáticamente

- marca `Indiscreta` y marcas de pago, redes sociales y proveedores;
- SKU, handle, UUID, códigos ISO (`CL`, `CLP`, `es-CL`) y variables de entorno;
- nombres de API, rutas internas, claves de metadata, logs y mensajes dirigidos
  sólo a desarrolladores;
- direcciones web, emails, números de pedido y códigos promocionales;
- nombres de materiales, colores o modelos que el propietario defina como
  nombres comerciales; requieren decisión explícita, no traducción automática.

Los nombres de opción visibles como `Size` y `Color` sí pertenecen al catálogo
y deben cargarse como `Talla` y `Color` o traducirse mediante locales de Medusa.

## 4. Estrategia recomendada de localización

### 4.1 Decisión

Adoptar un **diccionario central tipado y agnóstico del framework**, inicialmente
con `es-CL`, organizado por dominio (`common`, `navigation`, `account`, `cart`,
`checkout`, `order`, `product`, `errors`, `metadata`). Exponer una función de
consulta que reciba locale, clave y parámetros. No agregar por ahora un
framework de internacionalización ni traducir cadenas mediante búsquedas y
reemplazos dispersos.

Razones:

- el storefront será monolingüe en la primera salida;
- el volumen de textos es amplio, pero el enrutamiento ya usa país y Medusa ya
  expone locales; no conviene confundir ninguno con el idioma de la UI;
- el contrato tipado permite detectar claves faltantes en compilación y sumar
  otro diccionario después;
- evita que datos de catálogo entren al bundle de UI;
- reduce dependencia y riesgo de cambios de App Router en P2.

Un framework i18n completo se reevaluará cuando exista un segundo idioma
aprobado, requisitos de locale en URL, traducción editorial externa o plural y
formatos complejos que excedan `Intl`.

### 4.2 Reglas de implementación futura

1. Definir `es-CL` como locale visible por defecto, independiente de `cl` en la
   URL y de `CLP` en el carrito.
2. Mantener claves semánticas, no usar la frase inglesa como clave.
3. Prohibir nuevos literales visibles fuera de diccionarios, salvo contenido
   dinámico, marcas y atributos técnicos documentados.
4. Formatear moneda, números y fechas con `Intl` y locale explícito; eliminar el
   default actual `en-US` de `convertToLocale`.
5. Mantener mensajes internos en inglés si son exclusivamente de desarrollo;
   nunca mostrar errores técnicos crudos al cliente.
6. Configurar el locale Medusa `es-CL` para contenido traducible sólo después de
   validar soporte y flujo editorial en la versión 2.18.
7. Cubrir metadata, `aria-label`, `alt`, placeholders, validaciones, estados
   vacíos y textos visualmente ocultos, no sólo párrafos y botones.

## 5. Configuración regional necesaria para Chile

| Concepto            | Estado actual                                                          | Objetivo                                                                | Tipo de cambio                        |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| Idioma UI           | Mixto español/inglés                                                   | `es-CL`                                                                 | Código storefront                     |
| Locale de contenido | Selector obtiene `/store/locales`; sin default explícito               | `es-CL` configurado y probado                                           | Medusa Admin/configuración más código |
| País en ruta        | `[countryCode]`; middleware cae a `dk`                                 | `/cl`; fallback validado `cl`                                           | Código y datos Medusa                 |
| Región comercial    | Seed `Europe`                                                          | Región Chile con país `cl`                                              | Medusa Admin/DB mediante API oficial  |
| Moneda              | Seed EUR, USD                                                          | CLP                                                                     | Medusa Admin/DB                       |
| Formato de precio   | default `en-US`                                                        | `es-CL`, sin decimales para CLP salvo regla distinta                    | Código storefront                     |
| Impuestos           | Seed crea países europeos con proveedor sistema                        | Régimen y precios con/sin impuesto definidos por responsable tributario | Medusa Admin/asesoría tributaria      |
| Despacho            | Bodega Copenhague y zonas Europa demo                                  | Ubicación, zonas, opciones, tarifas y perfil reales                     | Medusa Admin/proveedor                |
| Generación estática | Productos, categorías y colecciones multiplican por países de regiones | Generar sólo países vendibles, inicialmente `cl`                        | Datos Medusa y validación de build    |
| Fecha/hora          | Sin política chilena central observada                                 | `es-CL` y zona acordada, normalmente `America/Santiago`                 | Código/política operativa             |

Los parámetros estáticos de productos, categorías y colecciones consultan las
regiones y generan combinaciones por cada `countryCode`. Dejar países demo
produce rutas no deseadas y aumenta builds. El middleware prioriza país de la
URL, luego cabeceras Cloudflare/Vercel y finalmente `NEXT_PUBLIC_DEFAULT_REGION`
o `dk`; tanto la variable desplegada como el fallback de código deben quedar en
`cl`.

Antes de configurar impuestos debe definirse si los precios ingresados incluyen
IVA y quién valida la regla comercial. P2 no debe inferir porcentajes ni
tratamiento tributario.

## 6. Modelo mínimo del catálogo real

### 6.1 Ficha maestra

| Campo                | Nivel                         | Obligatorio para publicar               | Regla mínima                                                              |
| -------------------- | ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Título               | Producto                      | Sí                                      | Nombre comercial aprobado, único en contexto                              |
| Handle               | Producto                      | Sí                                      | Slug estable, minúsculas, ASCII, único; no cambiar sin redirección        |
| Descripción          | Producto                      | Sí                                      | Español aprobado, sin claims no validados                                 |
| Categoría            | Producto                      | Sí                                      | Taxonomía aprobada; una primaria y adicionales sólo si aportan navegación |
| Colección            | Producto                      | Condicional                             | Obligatoria cuando la campaña o navegación la use                         |
| Material/composición | Producto o variante           | Sí                                      | Texto comercial/legal exacto entregado por propietario                    |
| Color                | Opción/variante               | Sí si varía                             | Vocabulario normalizado, sin crear sinónimos accidentales                 |
| Talla                | Opción/variante               | Sí si varía                             | Tabla y orden aprobados; no inventar equivalencias                        |
| Variante             | Variante                      | Sí                                      | Toda combinación vendible; combinaciones inexistentes no se crean         |
| SKU                  | Variante                      | Sí                                      | Único, inmutable y definido por negocio                                   |
| Precio CLP           | Variante                      | Sí                                      | Entero en CLP y aprobación comercial                                      |
| Inventario           | Variante/ubicación            | Sí                                      | Cantidad inicial confirmada y ubicación real; nunca `1000000`             |
| Peso                 | Variante/producto             | Sí                                      | Unidad Medusa confirmada y dato real para despacho                        |
| Largo, ancho, alto   | Variante/producto             | Sí cuando el transportista los requiere | Unidad y orden documentados                                               |
| Perfil de despacho   | Producto                      | Sí                                      | Perfil real compatible con opciones y zona Chile                          |
| Sales channel        | Producto                      | Sí                                      | Canal del storefront publicado                                            |
| Estado               | Producto                      | Sí                                      | `draft` durante carga; `published` sólo tras aprobación                   |
| Imágenes             | Producto/variante             | Sí                                      | Principal y galería aprobadas; asociación por variante cuando corresponda |
| SEO title            | Metadata                      | Sí                                      | Único, fiel al producto                                                   |
| SEO description      | Metadata                      | Sí                                      | Resumen aprobado; longitud objetivo revisada en QA                        |
| Alt por imagen       | Metadata de activo/manifiesto | Sí                                      | Describe producto, vista y color; no usar “imagen de producto” genérico   |
| Datos adicionales    | Metadata                      | Condicional                             | Sólo claves documentadas, tipadas y con consumidor identificado           |

Las dimensiones, unidades y claves SEO deben verificarse contra el modelo y la
API efectiva de Medusa 2.18 antes de implementar; no se debe asumir que toda
metadata editorial tiene campo nativo. Si se usan claves en `metadata`, crear
un contrato versionado, por ejemplo `seo_title` y `seo_description`, y pruebas
del consumidor.

### 6.2 Puerta de publicación

Un producto sólo pasa de borrador a publicado cuando:

1. la ficha maestra y derechos de contenido están aprobados;
2. handle y SKU son únicos;
3. categoría, colección y opciones usan vocabularios aprobados;
4. todas las variantes vendibles tienen precio CLP, inventario y ubicación;
5. peso/dimensiones y perfil de despacho permiten cotizar;
6. está enlazado al sales channel correcto;
7. imagen principal, galería y alt cumplen el estándar;
8. metadata SEO está completa;
9. se verificó visualmente PDP, listado, carrito y checkout en staging;
10. una segunda persona aprueba el registro de carga.

### 6.3 Diagnóstico del seed existente

`initial-data-seed.ts` es demostrativo: crea países europeos, región `Europe`,
bodega en Copenhagen, despacho `Standard/Express`, categorías y opciones en
inglés, cuatro productos Medusa publicados, imágenes remotas demo, precios EUR
y USD e inventario de `1000000` por ítem. Es útil para CI y desarrollo aislado,
pero no es fuente válida para catálogo o configuración productiva. Debe
mantenerse separado o sustituirse en una subetapa explícita sin romper el flujo
comercial reproducible de CI.

## 7. Estándar de imágenes

### 7.1 Tipos y almacenamiento

- **Estáticas de diseño:** hero, banners e imágenes de categorías bajo
  `apps/storefront/public`; se versionan con el código y no representan SKUs.
- **Catálogo:** principal y galería asociadas a productos/variantes en Medusa;
  producción debe usar el File Module S3 compatible y URL estable.
- **Desarrollo:** File Module local y/o un bucket de staging sin credenciales
  productivas; nunca depender de URLs demo externas.
- **Producción:** bucket privado o público según arquitectura aprobada, con
  política, CORS, CDN/public URL, lifecycle, backups y permisos de mínimo
  privilegio validados.

### 7.2 Especificación propuesta

| Atributo           | Estándar                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Relación           | 4:5 vertical para catálogo; todas las imágenes de una ficha consistentes                                           |
| Resolución maestra | Mínimo 2000 × 2500 px; conservar original de cámara separado                                                       |
| Entrega web        | 1600 × 2000 px como derivado inicial, sujeto a prueba visual/retina                                                |
| Formato            | WebP o AVIF derivado; JPEG de alta calidad como fallback si la plataforma lo requiere; PNG sólo para transparencia |
| Peso máximo        | Objetivo ≤ 350 KB por derivado principal y ≤ 500 KB excepcional con aprobación visual                              |
| Color              | sRGB; sin perfil incompatible                                                                                      |
| Fondo              | Consistente y aprobado; preferencia por neutro para principal                                                      |
| Principal          | Producto completo, centrado, sin texto promocional ni watermark                                                    |
| Galería            | Frente, reverso, detalle, escala/uso y variantes necesarias; orden definido en manifiesto                          |
| Nombre             | `sku-color-vista-secuencia.ext`, ASCII, minúsculas, guiones; no incluir datos personales                           |
| Alt                | Descripción breve en español del producto, color y vista; único por imagen útil; decorativas con alt vacío         |

Los límites son un estándar técnico propuesto y deben validarse con diseño. Los
originales no se alteran: cualquier recorte o conversión genera derivados
trazables. Evitar texto incrustado que no pueda localizarse.

### 7.3 Prueba sin credenciales productivas

1. Preparar un bucket S3 compatible exclusivo de staging o usar el proveedor
   local de desarrollo ya contemplado.
2. Cargar sólo activos de prueba autorizados, sin fotografías reales si aún no
   existen derechos confirmados.
3. Verificar upload, URL persistente, lectura desde storefront, CORS, 404,
   reemplazo no destructivo y eliminación controlada.
4. Probar `next/image` con localhost y con el hostname/prefix exacto de staging.
5. Medir LCP, dimensiones, layout shift y peso; decidir en P2.4 si retirar
   `unoptimized: true` y qué capa optimiza.
6. Repetir el smoke test con proveedor productivo antes de publicar, sin copiar
   credenciales ni resultados sensibles al repositorio.

## 8. Método recomendado de carga

| Alternativa                | Ventajas                                                    | Riesgos                                                                                 | Trazabilidad/repetibilidad                                   | Primer catálogo | Producción                                                    |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------- | ------------------------------------------------------------- |
| Medusa Admin manual        | Validación visual, borradores, baja barrera, control fino   | Errores de tipeo, omisiones, difícil escalar                                            | Media con ficha, checklist y log; baja sin ellos             | **Alta**        | Alta para cambios puntuales                                   |
| Seed reproducible          | Rápido para ambientes efímeros y pruebas                    | Mezcla infraestructura con negocio, puede duplicar o publicar demo, credenciales/assets | Alta si es idempotente, pero el actual no lo es para negocio | Baja            | Baja para catálogo vivo; alta sólo para baseline no comercial |
| Script de importación      | Validación previa, idempotencia, reportes y revisión en Git | Costo inicial y riesgo de API/versionado                                                | **Alta** con manifiesto, dry-run y claves estables           | Media           | **Alta** para lotes y reconstrucción                          |
| CSV                        | Familiar para negocio y portable                            | Tipado débil, variantes/relaciones/imágenes complejas, encoding y fórmulas              | Media si hay esquema/versionado; baja si se importa a mano   | Media           | Media como formato de entrada, no como ejecutor               |
| API administrativa directa | Control completo e integración                              | Autenticación, rate limits, rollback y orden de entidades                               | Alta si la envuelve un importador; baja con llamadas ad hoc  | Baja            | Alta como mecanismo subyacente                                |

Recomendación concreta:

1. **Primeros productos:** Admin en staging, uno por uno y siempre como borrador,
   desde una ficha maestra versionada; revisión dual y registro de IDs/SKU/fecha.
2. **Futuras cargas masivas:** CSV o JSON validado como entrada a un importador
   idempotente que use la API administrativa, tenga `dry-run`, reporte por fila,
   reintentos seguros y no publique automáticamente.
3. **Recuperación/reconstrucción:** bootstrap idempotente de región, sales
   channel, ubicación y despacho, seguido de importador sobre manifiesto
   aprobado y restauración/referencia de assets; catálogo y seed de CI separados.

## 9. Dependencias y riesgos

| Severidad   | Riesgo/dependencia                                                                | Bloquea                          | Mitigación/decisión                                                     |
| ----------- | --------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| Crítico     | No existe información comercial aprobada de productos, variantes, precios y stock | P2.3–P2.6                        | Obtener ficha maestra firmada; no inventar datos                        |
| Crítico     | Impuestos, despacho y pagos reales no están definidos ni probados                 | Publicación/checkout             | Definir responsables/proveedores y aprobar smoke tests en staging       |
| Alto        | Seed demo crea configuración europea y productos publicados                       | Carga segura/reconstrucción      | Separar CI/demo de bootstrap productivo; jamás ejecutarlo en producción |
| Alto        | Región Chile/CLP y país `cl` no están configurados; fallback `dk` persiste        | Rutas, precios, checkout         | P2.1 antes de productos; validar Admin y storefront                     |
| Alto        | Inventario del carrito tiene TODO y seed usa stock artificial                     | Venta fiable                     | Resolver política/límite y probar concurrencia/agotado antes de P2.6    |
| Alto        | S3 real no tiene smoke test ni política/CDN/CORS aprobados                        | Fotografías productivas          | Validar proveedor en staging y producción con checklist reversible      |
| Alto        | Derechos de fotografías, textos y marcas no están confirmados                     | Publicación                      | Aprobación documental por activo y contenido                            |
| Alto        | Dominio/hosting y URLs públicas finales están pendientes                          | SEO, imágenes, cookies, webhooks | Cerrar plataforma, DNS, TLS, CORS y variables antes de QA final         |
| Medio       | UI mezcla inglés/español y errores pueden provenir de backend/proveedores         | Calidad de experiencia           | Matriz por fuente, fallback seguro y QA de errores                      |
| Medio       | `images.unoptimized: true` puede degradar rendimiento                             | Rendimiento                      | Medir con activos finales y definir CDN/optimizer en P2.4               |
| Medio       | Locales Medusa y UI son mecanismos diferentes                                     | Consistencia editorial           | Contrato explícito `es-CL`; pruebas de caché y cart locale              |
| Medio       | Generación estática multiplica rutas por países de regiones                       | Build/SEO                        | Dejar sólo países vendibles; comprobar sitemap/canonical si existen     |
| Medio       | Falta contrato nativo comprobado para SEO/alt por imagen                          | Calidad y accesibilidad          | Definir metadata versionada o módulo editorial antes de importar        |
| Bajo        | Textos técnicos o marcas podrían traducirse por error                             | Consistencia                     | Glosario de exclusiones y revisión editorial                            |
| Informativo | Medusa 2.18, Next 15.5.21 y pnpm 10.11.1 están fijados                            | Plan técnico                     | Validar contra documentación de esa versión al implementar              |

Bloqueos previos por frente:

- **Antes de traducir:** tono de marca, glosario, textos legales, locale objetivo,
  política de tratamiento de errores y decisión sobre un segundo idioma.
- **Antes de cargar productos:** región CL/CLP, impuestos, sales channel, stock
  location, shipping profile, taxonomía, SKU, precios, stock y ficha aprobada.
- **Antes de publicar fotografías:** derechos, estándar visual, relación
  producto/variante, alt, bucket/CDN, CORS, dominio y prueba de recuperación.

## 10. Plan P2 dividido en subetapas

### P2.1 — Estrategia de idioma y configuración regional (18 h)

- Aprobar glosario, tono, `es-CL` y frontera UI/catálogo/técnico.
- Inventariar claves visibles con ubicación y fuente.
- Diseñar diccionario tipado y política de fallback.
- Configurar en entorno de staging región Chile, país `cl`, CLP, impuestos,
  locale y formatos; eliminar dependencias funcionales de `dk`.
- Validar generación de rutas por país y separación idioma/mercado/moneda.

### P2.2 — Traducción visible del storefront (28 h)

- Crear diccionario e integrar superficies por dominio.
- Traducir metadata, accesibilidad, formularios, vacíos, errores y estados.
- Configurar formatos `Intl` de moneda/fecha/número.
- Configurar locales soportados de proveedores externos.
- Añadir pruebas de claves, interpolación, literales prohibidos y recorridos.

### P2.3 — Preparación del modelo de catálogo (20 h)

- Aprobar taxonomía, colecciones, opciones y vocabularios.
- Definir esquema de ficha, metadata, SKU, unidades y reglas de publicación.
- Configurar sales channel, stock location, shipping profile y contratos de
  inventario sin cargar productos reales.
- Diseñar separación del seed demo y bootstrap/importador futuro.

### P2.4 — Pipeline y estándar de imágenes (16 h)

- Aprobar estándar fotográfico y manifiesto de activos.
- Validar local/staging S3 y posteriormente proveedor productivo.
- Definir generación no destructiva de derivados y política de nombres/alt.
- Probar `next/image`, CORS, cache, error y rendimiento; decidir optimización.

### P2.5 — Carga controlada de los primeros productos (16 h)

- Recibir fichas y activos aprobados.
- Ensayar una ficha completa en staging como borrador.
- Cargar el lote inicial manualmente con registro y revisión dual.
- Publicar sólo tras superar la puerta por producto; documentar correcciones.

### P2.6 — Validación integral del catálogo y flujo de compra (18 h)

- Validar navegación, búsqueda/filtros existentes, PDP, variantes y agotados.
- Validar precio CLP, impuestos, inventario, despacho, pago y pedido.
- Ejecutar QA responsive, accesibilidad, SEO, rendimiento y fallbacks.
- Ejecutar pruebas automatizadas y flujo comercial aislado con datos de prueba,
  nunca contra producción.

### P2.7 — Cierre documental de P2 (6 h)

- Consolidar evidencia, decisiones, deuda y manuales operativos.
- Confirmar que no quedan demo data/rutas productivas no aceptadas.
- Documentar rollback, reconstrucción y ownership.
- Emitir informe de cierre y backlog de P3.

## 11. Criterios de aceptación por subetapa

| Subetapa | Criterios de aceptación                                                                                                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2.1     | Matriz de textos completa; glosario aprobado; `es-CL`, `cl` y CLP tratados por separado; staging tiene configuración Chile aprobada; no hay fallback funcional `dk`; rutas estáticas verificadas    |
| P2.2     | No quedan textos visibles ingleses no justificados en recorridos; diccionario tipado cubre UI/metadata/a11y; formatos son `es-CL`; errores no filtran detalles técnicos; lint/typecheck/tests pasan |
| P2.3     | Ficha y taxonomía aprobadas; campos obligatorios automatizables; SKU/unidades/metadata definidos; infraestructura comercial de staging lista; seed demo no participa en producción                  |
| P2.4     | Estándar y manifiesto aprobados; originales preservados; upload/read/error/delete probados; CORS/cache/dominio documentados; decisión sobre optimización basada en medición                         |
| P2.5     | Cada producto tiene ficha y revisión dual; todos nacen draft; sólo productos completos se publican; IDs/SKU/assets quedan registrados; no hay datos inventados                                      |
| P2.6     | Flujo browse-to-order pasa en staging con CLP, impuestos, despacho, pago e inventario correctos; agotados y errores probados; QA responsive/a11y/SEO/performance aceptado                           |
| P2.7     | Evidencia y runbooks completos; riesgos residuales con dueño/fecha; procedimiento de reconstrucción ensayado; cierre aprobado por negocio y técnica                                                 |

## 12. Carta Gantt

La duración calendario presupone disponibilidad de dos perfiles y respuestas
del propietario dentro de un día hábil.

| Día   | Actividad                                            | Dependencia                   |                                                        Duración | Responsable sugerido        | Herramienta                                         | Resultado esperado             |
| ----- | ---------------------------------------------------- | ----------------------------- | --------------------------------------------------------------: | --------------------------- | --------------------------------------------------- | ------------------------------ |
| 1–2   | Inventario, glosario y arquitectura de locale        | P1                            |                                                            10 h | Frontend + contenido        | VS Code, Codex, Git                                 | Matriz y contrato `es-CL`      |
| 2–3   | Región CL, CLP, locale, impuestos y rutas            | Definiciones fiscal/comercial |                                                             8 h | Backend/Medusa + negocio    | Medusa Admin, PostgreSQL sólo vía Medusa, navegador | Configuración staging validada |
| 3–6   | Diccionario y traducción de UI                       | P2.1                          |                                                            22 h | Frontend                    | Next.js, VS Code, Codex                             | UI localizada                  |
| 5–6   | Metadata, a11y, proveedores y pruebas de locale      | P2.1 + traducción base        |                                                             6 h | Frontend + QA               | Vitest, navegador                                   | Cobertura completa P2.2        |
| 4–5   | Taxonomía, ficha, SKU, unidades y publicación        | Datos del propietario         |                                                            12 h | Ecommerce + negocio         | Medusa Admin, hoja maestra                          | Modelo aprobado                |
| 5–6   | Sales channel, stock y despacho; diseño de bootstrap | Configuración CL              |                                                             8 h | Backend/Medusa              | Medusa Admin, Git                                   | Base de catálogo segura        |
| 6–7   | Estándar, manifiesto y derivados                     | Aprobación diseño/derechos    |                                                             6 h | Diseño + contenido          | Procesador no destructivo                           | Especificación de activos      |
| 7–8   | Smoke test S3/Next Image y rendimiento               | Bucket staging                |                                                            10 h | DevOps + frontend           | S3 compatible, navegador                            | Pipeline validado              |
| 9     | Producto piloto en draft y revisión                  | P2.3 + P2.4                   |                                                             8 h | Operador catálogo + revisor | Medusa Admin                                        | Piloto aprobado                |
| 10    | Lote inicial controlado                              | Piloto + fichas completas     |                                                             8 h | Operador catálogo + revisor | Medusa Admin                                        | Primer catálogo cargado        |
| 11–12 | QA integral comercial                                | P2.2 + P2.5                   |                                                            14 h | QA + desarrollo             | GitHub Actions, pnpm, Turbo, navegador              | Flujo aprobado                 |
| 12    | QA SEO, a11y, responsive y performance               | Catálogo publicado en staging |                                                             4 h | QA/frontend                 | Navegador, auditoría web                            | Evidencia no funcional         |
| 13    | Cierre, runbooks y backlog                           | Todo lo anterior              |                                                             6 h | Líder técnico + negocio     | Git, GitHub, documentación                          | P2 cerrado                     |
|       | **P2.1**                                             |                               |                                                        **18 h** |                             |                                                     |                                |
|       | **P2.2**                                             |                               |                                                        **28 h** |                             |                                                     |                                |
|       | **P2.3**                                             |                               |                                                        **20 h** |                             |                                                     |                                |
|       | **P2.4**                                             |                               |                                                        **16 h** |                             |                                                     |                                |
|       | **P2.5**                                             |                               |                                                        **16 h** |                             |                                                     |                                |
|       | **P2.6**                                             |                               |                                                        **18 h** |                             |                                                     |                                |
|       | **P2.7**                                             |                               |                                                         **6 h** |                             |                                                     |                                |
|       | **Total**                                            |                               | **122 h / 15,25 jornadas-persona / 13 días hábiles calendario** |                             |                                                     |                                |

## 13. Estimaciones y supuestos

| Subetapa  | Análisis/configuración | Implementación/carga | QA/documentación |     Total |
| --------- | ---------------------: | -------------------: | ---------------: | --------: |
| P2.1      |                   12 h |                  2 h |              4 h |      18 h |
| P2.2      |                    4 h |                 18 h |              6 h |      28 h |
| P2.3      |                   12 h |                  4 h |              4 h |      20 h |
| P2.4      |                    6 h |                  4 h |              6 h |      16 h |
| P2.5      |                    2 h |                 10 h |              4 h |      16 h |
| P2.6      |                    4 h |                  4 h |             10 h |      18 h |
| P2.7      |                    2 h |                  0 h |              4 h |       6 h |
| **Total** |               **42 h** |             **42 h** |         **38 h** | **122 h** |

Supuestos: lote inicial pequeño (hasta 10 productos y hasta 50 variantes), una
sola región y moneda, un solo idioma de salida, proveedor de pago/despacho ya
seleccionado y fotografías entregadas como originales aprobados. Cada 10
productos adicionales añade aproximadamente 8–16 h según variantes y activos.

## 14. Herramientas y software

- VS Code y Codex para inspección, implementación y revisión asistida;
- Git y GitHub con PR, revisión y evidencia por subetapa;
- Medusa 2.18 y Medusa Admin para configuración y carga controlada;
- Next.js 15 para UI, metadata, rutas y manejo de imágenes;
- PostgreSQL sólo a través de módulos/workflows/API de Medusa; no SQL manual;
- pnpm 10.11.1 y Turbo para tareas del monorepo;
- Jest/Vitest, ESLint, TypeScript y GitHub Actions para validación;
- S3 compatible con bucket separado de staging y producción;
- navegador con herramientas de accesibilidad, red, performance y responsive;
- procesador de imágenes sólo para derivados, preservando originales;
- hoja maestra CSV/XLSX o sistema equivalente como fuente editorial aprobada,
  no como importación improvisada.

Antes de implementar APIs Medusa se recomienda instalar las skills oficiales
`medusa-dev` y conectar el MCP de documentación de Medusa, ausentes durante
esta planificación, para validar contratos exactos de la versión 2.18.

## 15. Secuencia exacta de ramas sugeridas

Todas parten de `main` actualizado y se fusionan en orden mediante PR. No
encadenar una rama sobre otra salvo dependencia explícita; después de cada
merge, actualizar la siguiente con `main`.

1. `feat/p2-1-localizacion-regional`
2. `feat/p2-2-storefront-es-cl`
3. `feat/p2-3-modelo-catalogo`
4. `feat/p2-4-pipeline-imagenes`
5. `chore/p2-5-carga-catalogo-inicial`
6. `test/p2-6-validacion-comercial`
7. `docs/p2-7-cierre`

P2.3 puede empezar en paralelo con P2.2 después de fusionar P2.1. P2.4 puede
trabajarse en paralelo con P2.3 cuando estén aprobados SKU, variantes y derechos
de activos. P2.5 exige P2.2–P2.4 fusionados/desplegados en staging. P2.6 y P2.7
son secuenciales.

Cada rama debe limitarse a una subetapa, incluir rollback y no mezclar
actualizaciones de dependencias o formateo masivo.

## 16. Plan de validación manual y automatizada

### Automatizada

- `pnpm lint`, `pnpm typecheck` y `pnpm test` en cada PR;
- build completo con región/locales de staging y verificación de parámetros
  estáticos esperados;
- pruebas unitarias de resolución de claves, interpolación, fallback y formatos
  CLP/fecha/número;
- regla o prueba que detecte claves faltantes y nuevos literales visibles;
- pruebas de mapping de errores sin exponer mensajes internos;
- contratos de catálogo: SKU/handle únicos, campos de publicación, precio CLP,
  sales channel, shipping profile, imágenes y metadata;
- prueba del importador futuro con `dry-run`, idempotencia y filas inválidas;
- smoke HTTP y flujo comercial CI con datos efímeros separados de producción;
- `git diff --check` y diff acotado por PR.

### Manual

- matriz de rutas desktop/móvil: home, tienda, categoría, colección, PDP,
  carrito, checRama de planificación:kout, cuenta, pedido, 404 y errores;
- búsqueda visual de inglés y revisión de glosario, metadata, alt, aria-label,
  placeholders y correos/páginas controladas por proveedores;
- CLP en listados, descuentos, carrito, checkout, pago y orden; fecha y zona;
- país `cl`, redirección raíz, cambio de país/locale, cookies y caché;
- variante/color/talla, precio, inventario bajo/cero, concurrencia y carrito;
- dirección chilena, despacho, IVA según definición, pago exitoso/fallido y
  creación de pedido;
- imagen principal/galería/variante, zoom si existe, 404, carga lenta, LCP y CLS;
- teclado, foco, lector de pantalla básico, contraste y responsive;
- SEO: title/description, canonical, Open Graph, indexabilidad y handles;
- smoke S3 upload/read/delete en staging y luego productivo con activo de prueba;
- rollback ensayado para producto, configuración e imagen.

## 17. Información a solicitar al propietario de Indiscreta

### Marca y contenido

- tono de voz, tratamiento al cliente, glosario y palabras que no se traducen;
- textos definitivos de navegación, beneficios, newsletter, legales, cambios,
  devoluciones, privacidad, despacho y contacto;
- razón social, datos de contacto, redes y claims aprobados;
- idiomas futuros previstos y quién aprueba contenido.

### Comercial y fiscal

- moneda y política de redondeo/precios; confirmación de si incluyen IVA;
- definición tributaria validada por asesor responsable;
- mercado inicial, comunas/regiones atendidas y restricciones;
- proveedores y métodos de pago, cuotas y mensajes permitidos;
- transportistas, tarifas, tiempos, cortes, retiro, despacho gratis y devoluciones.

### Catálogo por producto

- título, handle deseado, descripción y estado inicial;
- categoría, colección y orden de exhibición;
- material/composición, cuidados, origen y cualquier advertencia;
- colores, tallas, tabla de tallas y combinaciones reales;
- SKU por variante, precio CLP, stock inicial y stock location;
- peso y dimensiones con unidades, perfil/restricciones de despacho;
- SEO title, SEO description y palabras objetivo sin sobreoptimización;
- fecha de publicación, productos relacionados y responsable de aprobación.

### Fotografías

- originales, orden de galería y asociación producto/variante;
- derechos de uso, créditos/restricciones y vigencia;
- recorte/fondo aprobado, imagen principal y alt editorial;
- disponibilidad de nuevas tomas si no cumplen resolución/consistencia.

### Operación e infraestructura

- dominio y hosting elegidos; accesos gestionados fuera del repositorio;
- proveedor S3/CDN, política de backup/retención y responsable;
- responsables de catálogo, revisión, inventario, soporte y rollback;
- tamaño exacto del lote inicial y fecha objetivo de lanzamiento;
- criterios de aprobación y tiempo máximo de respuesta durante P2.

## 18. Definición de terminado para P2

P2 termina cuando:

1. todas las superficies de cliente están en español de Chile o tienen una
   excepción técnica/marca documentada;
2. idioma `es-CL`, país `cl` y moneda CLP están separados y validados;
3. región, impuestos, sales channel, stock, despacho y pago de staging reflejan
   decisiones aprobadas, sin depender del seed demo;
4. el modelo, ficha, taxonomía, metadata y puerta de publicación están
   documentados y aplicados;
5. los primeros productos reales aprobados están cargados, revisados y
   trazables, sin datos inventados;
6. sus fotografías autorizadas cumplen el estándar y se sirven desde el
   almacenamiento aprobado;
7. el flujo completo hasta pedido funciona en staging con precio, impuesto,
   despacho e inventario correctos;
8. calidad automática, QA manual, accesibilidad, SEO y rendimiento cumplen los
   criterios acordados;
9. existen runbooks de carga, rollback, activos y reconstrucción, con dueño;
10. riesgos residuales tienen severidad, responsable, fecha y aceptación
    explícita, y el informe de cierre P2 está aprobado por técnica y negocio.
