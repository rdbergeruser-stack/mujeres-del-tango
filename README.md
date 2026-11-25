# Mujeres del Tango — Tienda Online Oficial

Tienda online oficial de **Mujeres del Tango**, proyecto de diseño independiente dedicado a la venta de remeras temáticas inspiradas en las grandes figuras femeninas de la historia del tango: **Tita Merello, Paquita Bernardo, Eloísa D'Herbil, Rosita Quiroga, Fermina Maristany, Nina Miranda y María Nieves**.

- **Sitio en producción:** [mujeres-del-tango.vercel.app](https://mujeres-del-tango.vercel.app)
- **Administración general:** Maris

---

## 🎨 Identidad Visual y Marca

- **Tipografías oficiales:** `BOMBING` (títulos / identidad gráfica) y `Montserrat SemiBold` (lectura e interfaz), cargadas localmente mediante `next/font/local`.
- **Paleta cromática:**
  - Magenta `#FF00FF`
  - Morado `#9900CC`
  - Celeste `#199DD0`
  - Fondo oscuro `#000000` / Zinc `#09090B` y textos en Blanco `#FFFFFF`
- **Catálogo oficial:** 13 diseños reales con mockups optimizados de alta definición en `public/remeras/`.

---

## 🚀 Stack Tecnológico

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + Fuentes locales (`BOMBING.ttf`, `Montserrat-SemiBold.ttf`)
- **Íconos:** [Lucide React](https://lucide.dev/)
- **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL con prefijo `tango_`, Auth, Storage, Row Level Security)
- **Hosting & Automatización:** Vercel + GitHub Actions (Keep-Alive automático)
- **Mensajería:** Integración directa con WhatsApp Web / App con mensajes prearmados y enlaces sanitizados

---

## 🏛️ Características Principales

### 1. Catálogo Interactivo y Galería con Zoom de Estampa
- **Galería y Zoom Interactivo (`RemeraGalleryModal`):** Al hacer clic en cualquier foto o título (o en el botón *Ver Estampa*), se abre un visor inmersivo con **lupa dinámica de 1.0x a 4.0x** que sigue el movimiento del mouse o el toque en celular para apreciar cada detalle de la ilustración.
- **Variantes por color:** Previsualización en vivo y miniaturas para alternar entre los colores disponibles (*Blanco, Negro, Amarillo*).
- **Selección rápida de talles:** Botones interactivos (`S`, `M`, `L`, `XL`, `XXL`) directamente en cada tarjeta, en el visor de zoom y en el checkout.
- **Filtros y búsqueda:** Buscador instantáneo por artista o modelo, filtro por categoría, talle y colección homenajeada con ficha biográfica modal.

### 2. Acceso 100% por Usuario (Sin Emails ni Spam)
- Inicio de sesión y registro exclusivamente mediante **nombre de usuario** y contraseña (sin depender de correos de confirmación que terminan en spam).
- **Onboarding obligatorio (`/cambiar-clave`):** Si el usuario fue creado por administración con clave provisoria (`123456`), el middleware solicita definir su contraseña definitiva en el primer ingreso.

### 3. Checkout por Transferencia y Dirección Detallada
- Selección interactiva de talle y color mediante botones.
- **Formulario de envío específico (`AddressForm`):** Calle, altura/número, piso/depto, localidad, provincia, código postal y entre-calles/referencias.
- Modalidades de entrega: **Envío a domicilio** o **Punto de retiro**.
- Datos bancarios destacados (Titular, Entidad, Alias y CBU) con botón de **Copiar en 1 clic**.
- Validación de comprobante con alertas visuales integradas (sin popups nativos del navegador) y notificación directa por WhatsApp.
- Seguimiento de pedidos en `/mis-compras`.

### 4. Panel de Administración (`/admin`)
- **Métricas y Ventas:** Recaudación confirmada, unidades vendidas, pedidos pendientes, modelo más vendido, filtro por período y exportación a **CSV / Excel**.
- **Gestión de Pedidos:** Aprobación de pagos con descuento de stock en tiempo real y botón directo para confirmar por WhatsApp.
- **Gestión de Remeras:** Alta, edición, pausa/activación, subida de imágenes a Supabase Storage (`tango-remeras-images`), autosembrado inteligente y botón de **Sincronización del Catálogo Oficial** con depuración automática de duplicados.
- **Directorio de Clientes:** Alta asistida con envío de credenciales por WhatsApp, **edición de datos/dirección**, restablecimiento de clave y **eliminación de usuarios**.
- **Colecciones y Homenajes:** Administración de semblanzas e historias de cada artista homenajeada.

---

## ⚡ Rendimiento y Disponibilidad (Anti-Freeze)

- **Optimización de imágenes:** Compresión progresiva del 90% en todos los mockups del catálogo (reducción de ~30 MB a ~2.5 MB totales manteniendo resolución Retina de 1200px) + `loading="lazy"` y `decoding="async"`.
- **Carga concurrente:** Consultas en paralelo con `Promise.all` tanto en la tienda como en el panel de administración y depuración en segundo plano (*non-blocking*).
- **Keep-Alive automático (Anti-Freeze):** Flujo de **GitHub Actions** (`.github/workflows/keep-alive.yml`) que consulta el endpoint `/api/cron/keep-alive` **4 veces por día** (cada 6 horas: 00:00, 06:00, 12:00 y 18:00 UTC) para mantener la base de datos de Supabase siempre activa y evitar pausas por inactividad.

---

## 🗄️ Base de Datos (Supabase)

El esquema SQL completo con tablas aisladas (`tango_profiles`, `tango_collections`, `tango_remeras`, `tango_orders`, `tango_payment_notifications`), políticas de RLS, triggers y datos semilla se encuentra en [`supabase-schema.sql`](./supabase-schema.sql).

---

## ⚙️ Variables de Entorno

Creá un archivo `.env.local` (o configuralas en Vercel → Settings → Environment Variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY

NEXT_PUBLIC_SITE_URL=https://mujeres-del-tango.vercel.app

NEXT_PUBLIC_BANK_ALIAS=mujeres.del.tango
NEXT_PUBLIC_BANK_CBU=0000003100012345678901
NEXT_PUBLIC_BANK_HOLDER=Maris - Mujeres del Tango
NEXT_PUBLIC_BANK_NAME=Banco Nación / Mercado Pago
```

---

## 🛠️ Instalación y Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```
