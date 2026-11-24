# 🌹 Mujeres del Tango - Tienda Online Oficial

Tienda online oficial de **"Mujeres del Tango"**, proyecto dedicado a la venta de remeras temáticas de diseño independiente inspiradas en grandes voces, letristas y compositoras de nuestra cultura (Tita Merello, Eladia Blázquez, Nelly Omar, Ada Falcón, entre otras).

Administradora y creadora general: **Maris**.

---

## 🚀 Stack Tecnológico
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + Google Fonts (Playfair Display & sans-serif)
- **Íconos**: [Lucide React](https://lucide.dev/)
- **Backend & Base de Datos**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Row Level Security)
- **Mensajería**: Integración directa con WhatsApp Web / App mediante enlaces sanitizados internacionalmente

---

## 🏛️ Características Principales

1. **Catálogo Interactivo**:
   - Tarjetas de remeras con zoom suave y badge de precio.
   - Indicador dinámico de stock restante o advertencia de "Últimas disponibles".
   - Filtros deslizables por categoría (*Oversize, Corte Clásico, Edición Especial, Musculosas*).
   - Filtro por Colección/Homenaje con ficha modal emergente que incluye reseña histórica de la artista.
   - Selector por talle (S, M, L, XL, XXL) y buscador instantáneo.

2. **Checkout por Transferencia Bancaria**:
   - Modal de compra interactivo con selección de talle y color.
   - Modalidades de entrega: Envío a domicilio o Retiro en punto convenido.
   - Datos bancarios de Maris destacados (Alias, CBU, Titular) con botón de **Copiar en 1 Clic** y feedback visual.
   - Input de comprobante/referencia bancaria para posterior verificación.

3. **Panel Administrativo de Maris (`/admin`)**:
   - **Métricas Financieras**: Recaudación confirmada ($), prendas vendidas, pedidos pendientes y remera más pedida, con selector de período y exportación a Excel / CSV.
   - **Ventas y Pedidos**: Tabla de pedidos con botón *"Aprobar & WhatsApp"* que aprueba el pago, **descuenta el stock en tiempo real** y abre WhatsApp con el mensaje de confirmación listo para el cliente.
   - **Cargar Remeras**: Formulario ágil con subida de imágenes a Supabase Storage (`remeras-images`), selector interactivo de talles, colores y precios.
   - **Clientes & WhatsApp**: Alta asistida de clientes con clave temporal (`123456`) y botón para disparar las credenciales por WhatsApp en un clic.
   - **Colecciones & Homenajes**: CRUD para dar de alta nuevas homenajeadas con semblanza histórica.

4. **Onboarding Obligatorio (`/cambiar-clave`)**:
   - Middleware que detecta si el usuario tiene `must_change_password = true` y lo obliga a definir su contraseña definitiva en el primer ingreso.

---

## 🗄️ Base de Datos (Supabase)

El script SQL completo con tablas, políticas de RLS, triggers y datos semilla se encuentra en [`supabase-schema.sql`](./supabase-schema.sql).

Solo es necesario ejecutarlo en el **SQL Editor** del dashboard de tu proyecto en Supabase.

---

## ⚙️ Variables de Entorno

Creá un archivo `.env.local` basado en `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY

NEXT_PUBLIC_SITE_URL=http://localhost:3000

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
