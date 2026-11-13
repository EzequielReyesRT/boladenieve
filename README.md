# ⚡ Aplicación Web: Método de la Bola de Nieve (Snowball Debt Payoff)

Una aplicación web moderna, responsiva (**Mobile-First**) e interactiva para la gestión, registro en tiempo real y simulación predictiva de deudas basada en el afamado **Método de la Bola de Nieve**.

---

## 🚀 Base de Datos y Conexión para Desarrollo

La aplicación cuenta con una **base de datos PostgreSQL local real** integrada mediante **PGlite (Postgres 16 en WebAssembly)** que persiste los datos en el directorio local `./dev-db/`. No requiere Docker ni instalar servicios externos en tu máquina.

### Arquitectura de Conexión:
- **Base de Datos Local (Desarrollo)**: Ubicada en `./dev-db/`, inicializada con el esquema PostgreSQL completo y datos de prueba.
- **Rutas API de Next.js**:
  - `GET / POST` [`/api/config`](file:///d:/Proyectos/Bola%20de%20nieve/src/app/api/config/route.ts)
  - `GET / POST / PUT / DELETE` [`/api/deudas`](file:///d:/Proyectos/Bola%20de%20nieve/src/app/api/deudas/route.ts)
  - `GET / POST / DELETE` [`/api/pagos`](file:///d:/Proyectos/Bola%20de%20nieve/src/app/api/pagos/route.ts)
- **Sincronización Reactiva**: Al agregar, editar o pagar una deuda desde la interfaz de usuario, la aplicación actualiza de forma inmediata y persistente la base de datos local.
- **Modo Supabase en la Nube (Producción / Opcional)**: Si configuras las variables en `.env.local`, el frontend conmuta automáticamente a Supabase con Row Level Security (RLS).

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS v4, Lucide Icons
- **Visualización de Datos**: Recharts (Stacked Area Chart)
- **Base de Datos Local**: PostgreSQL 16 embebido (`@electric-sql/pglite`) en `./dev-db`
- **Base de Datos Cloud**: Supabase (PostgreSQL con RLS)

---

## ⚡ Comandos para el Entorno de Desarrollo

### 1. Inicializar la Base de Datos Local
Crea las tablas (`configuracion_usuario`, `deudas`, `bitacora_pagos`), la vista `vista_resumen_deudas` y siembra los datos iniciales:

```bash
npm run db:init
```

### 2. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000). Verás la insignia **Postgres Local** activa en el navbar, indicando que todas las operaciones se están guardando en tu base de datos PostgreSQL local.

---

## 📂 Esquema de las Tablas Creadas

1. **`configuracion_usuario`**:
   - `id`: Identificador de configuración
   - `pago_extra_mensual`: Acelerador fijo mensual
   - `mes_calendario_inicio`: Mes de partida de la proyección (1-12)
   - `anio_inicio`: Año de partida de la proyección
   - `aportacion_unica_anual`: Monto extraordinario anual (Aguinaldo/Bono)
   - `mes_aportacion_unica`: Mes en el que se inyecta el monto anual

2. **`deudas`**:
   - `id`: Identificador de la deuda
   - `nombre_tarjeta`: Nombre del crédito o tarjeta
   - `saldo_inicial`: Saldo inicial registrado
   - `tasa_anual_porcentaje`: Tasa de interés anual (ej. 49.5%)
   - `pago_minimo`: Cuota mínima requerida mensual
   - `costo_anualidad`: Cargo por membresía/anualidad
   - `mes_cobro_anualidad`: Mes en el que se aplica la anualidad

3. **`bitacora_pagos`**:
   - `id`: Identificador del pago
   - `deuda_id`: Tarjeta a la que se aplicó el pago
   - `fecha_pago`: Fecha en formato YYYY-MM-DD
   - `tipo_pago`: `Minimo`, `Extra`, `Anualidad`, `Liquidacion`
   - `monto_total`: Monto desembolsado
   - `intereses_cobrados`: Porción que absorbió el banco en intereses
   - `folio_comprobante`: Referencia o número de autorización
