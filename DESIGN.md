---
name: Bola de Nieve
description: Sistema de diseño financiero disciplinado para la amortización acelerada de deudas
colors:
  cobalt-precision: "#2563eb"
  cobalt-precision-hover: "#1d4ed8"
  cobalt-precision-active: "#1e40af"
  cobalt-precision-surface: "#eff6ff"
  slate-neutral-bg: "#f8fafc"
  slate-neutral-surface: "#ffffff"
  slate-neutral-subtle: "#f1f5f9"
  slate-neutral-muted: "#e2e8f0"
  slate-neutral-border: "#e2e8f0"
  slate-neutral-border-strong: "#cbd5e1"
  slate-neutral-text: "#0f172a"
  slate-neutral-text-secondary: "#475569"
  slate-neutral-text-muted: "#94a3b8"
  emerald-amortization: "#16a34a"
  emerald-amortization-hover: "#15803d"
  emerald-amortization-surface: "#f0fdf4"
  crimson-liability: "#dc2626"
  crimson-liability-surface: "#fef2f2"
  amber-caution: "#d97706"
  amber-caution-surface: "#fffbeb"
typography:
  display:
    fontFamily: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Geist, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.025em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  "2xl": "1.5rem"
  "3xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-precision}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-precision-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1rem"
  button-secondary:
    backgroundColor: "{colors.slate-neutral-subtle}"
    textColor: "{colors.slate-neutral-text}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.875rem"
  card-base:
    backgroundColor: "{colors.slate-neutral-surface}"
    textColor: "{colors.slate-neutral-text}"
    rounded: "{rounded.xl}"
    padding: "1.25rem"
  input-base:
    backgroundColor: "{colors.slate-neutral-subtle}"
    textColor: "{colors.slate-neutral-text}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 0.875rem"
---

# Design System: Bola de Nieve

## Overview

**Creative North Star: "The Precision Ledger"**

"The Precision Ledger" concibe a Bola de Nieve no como un juego ni como una calculadora fría, sino como un libro mayor de alta precisión que sustituye la angustia financiera por certidumbre matemática y calma visual. La interfaz proyecta solvencia mediante una estricta jerarquía tipográfica, datos monetarios tabulares rigurosamente alineados y una deliberada ausencia de ruido decorativo. Cada pantalla está optimizada para ser escaneada rápidamente en el teléfono al momento de realizar un pago o en el escritorio durante la planificación presupuestal mensual.

La densidad informativa es alta pero espaciosa y ordenada, apoyada en una arquitectura de superficies estructuradas en lugar de capas superpuestas arbitrarias. Se rechazan frontalmente los clichés visuales automatizados de IA (como degradados morado-neón, tarjetas flotantes con bordes brillantes y emojis en lugar de iconografía técnica) y se adopta un lenguaje gráfico sobrio inspirado en el diseño editorial financiero y las herramientas de contabilidad profesional moderna.

**Key Characteristics:**
- Estructura tonal gobernada por la regla 60-30-10 para máxima legibilidad y descanso cognitivo.
- Cifras financieras y fechas en tipografía tabular inmutable (`tabular-nums`) para evitar desajustes verticales.
- Superficies delimitadas por bordes nítidos y elevación sutil reservada para estados interactivos.
- Iconografía vectorial consistente y técnica (Lucide Icons) sin emojis en controles de interfaz.

## Colors

Paleta semántica de alto contraste WCAG AA, anclada en neutros pizarra, acento cobalto dosificado y verde disciplinado para amortizaciones.

### Primary
- **Cobalt Precision** (#2563eb en Light / #3b82f6 en Dark): Acento dosificado del 10%. Reservado exclusivamente para llamadas a la acción principales, indicador de deuda objetivo Bola de Nieve en foco, enlaces clave y barras de progreso activas.

### Secondary
- **Emerald Amortization** (#16a34a en Light / #22c55e en Dark): Color funcional reservado estrictamente para saldos liquidados, abonos a capital, excedentes de flujo de caja positivos y confirmaciones de pago exitosas.

### Tertiary
- **Crimson Liability** (#dc2626 en Light / #f87171 en Dark): Señalización de pasivos críticos, deudas con mora, montos de intereses bancarios devorados o acciones destructivas en modales.
- **Amber Caution** (#d97706 en Light / #fbbf24 en Dark): Advertencias de cobro próximo de membresías o anualidades bancarias y fechas límite inminentes.

### Neutral
- **Slate Canvas** (#f8fafc en Light / #0b0f19 en Dark): Base neutra dominante del 60% que provee el lienzo de lectura libre de distracciones.
- **Surface Card** (#ffffff en Light / #111827 en Dark): Superficie secundaria del 30% para tarjetas, modales, barras laterales y paneles de datos agrupados.
- **Surface Subtle** (#f1f5f9 en Light / #1e293b en Dark): Fondos de controles de entrada, cabeceras de tablas y contenedores secundarios.
- **Border Subtle** (#e2e8f0 en Light / #1e293b en Dark): Líneas de contorno precisas que definen la estructura sin saturar la vista.
- **Border Strong** (#cbd5e1 en Light / #334155 en Dark): Bordes interactivos para estados hover e inputs en foco.
- **Text Primary** (#0f172a en Light / #f8fafc en Dark): Máximo contraste para cifras monetarias y encabezados principales.
- **Text Secondary** (#475569 en Light / #94a3b8 en Dark): Etiquetas de apoyo, descripciones y leyendas explicativas.
- **Text Muted** (#94a3b8 en Light / #64748b en Dark): Placeholders y metadatos secundarios.

### Named Rules
**The 10% Accent Rule.** El color Cobalt Precision nunca cubre más del 10% de la superficie de ninguna pantalla. Su escasez es lo que garantiza la atención inmediata sobre la acción clave.
**The Green Exclusivity Rule.** El verde está prohibido como adorno estético o fondo genérico; su uso es un premio visual reservado únicamente para reducción de pasivos, amortización y liquidez a favor.

## Typography

**Display Font:** Geist Sans (con fallback `system-ui, -apple-system, sans-serif`)  
**Body Font:** Geist Sans (con fallback `system-ui, -apple-system, sans-serif`)  
**Label/Mono Font:** Geist Mono (con fallback `monospace`)  

**Character:** Tipografía contemporánea de proporciones geométricas puras, optimizada para legibilidad en pantallas digitales de alta resolución y combinada con tipografía monoespaciada para datos numéricos contables.

### Hierarchy
- **Display** (Extrabold 800, 2rem / 32px, line-height 1.25, letter-spacing -0.025em): Métricas globales principales (Deuda Total Acumulada, Ahorro Total Proyectado).
- **Headline** (Bold 700, 1.5rem / 24px, line-height 1.3, letter-spacing -0.02em): Títulos de vistas principales (Dashboard, Mis Deudas, Flujo de Caja, Simulador).
- **Title** (Semibold 600, 1.125rem / 18px, line-height 1.4, letter-spacing -0.01em): Encabezados de tarjetas, títulos de créditos bancarios y nombres de modales.
- **Body** (Regular 400, 0.875rem / 14px, line-height 1.5, letter-spacing 0em): Texto informativo, instrucciones, descripciones y valores de formulario (longitud máxima de línea recomendada 65–75ch).
- **Label** (Bold 700, 0.75rem / 12px, line-height 1.4, letter-spacing 0.025em, uppercase selectivo): Badges de clasificación, botones de comando y encabezados de columna en tablas.

### Named Rules
**The Tabular Data Rule.** Todo valor monetario, porcentaje de CAT, tasa de interés, fecha de calendario o conteo de plazo debe portar `font-variant-numeric: tabular-nums` para garantizar alineación vertical perfecta en balances y comparativas.

## Layout

Modelo espacial basado en cuadrícula flexible con escala modular de espaciado estricta en múltiplos de 4px / 8px (`0.25rem` a `2rem`).

- **Estructura adaptativa (Mobile-First):**
  - **Móvil (< 768px):** Barra superior compacta con acceso directo a acciones rápidas, menú lateral desplegable tipo drawer y botones de acción primaria en ancho completo (`w-full`) para interacción con pulgar.
  - **Tablet y Escritorio (≥ 1024px):** Barra lateral de navegación fija de 288px (`w-72`), área de trabajo central contenida y cuadrículas responsivas asimétricas (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
- **Ritmo y separación:** Separación consistente entre tarjetas y bloques de `1.5rem` (`gap-6` o `space-y-6`), rellenos internos de tarjeta de `1.25rem` (`p-5` a `p-6`) y márgenes entre secciones de datos de `1rem` (`gap-4`).

## Elevation & Depth

El sistema emplea una filosofía **plana estructurada por defecto** (Flat-By-Default), comunicando la profundidad y jerarquía a través del contraste de superficies y bordes nítidos (`border-subtle` y `border-strong`), evitando el abuso de sombras que ensucian la legibilidad contable.

### Shadow Vocabulary
- **Card Subtle** (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)`): Estado de reposo de tarjetas y paneles.
- **KPI Hover Lift** (`box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.04)`): Elevación sutil en widgets métricos interactivos al pasar el cursor.
- **Button Action** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Anclaje táctil para botones de llamada a la acción primarios.
- **Keyboard Focus Ring** (`box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--brand-primary)`): Anillo de enfoque de dos capas accesible para navegación por teclado.

### Named Rules
**The Border-First Depth Rule.** La jerarquía entre capas se establece primero mediante contraste de fondos y bordes milimétricos. Las sombras solo aparecen como respuesta a un estado interactivo (hover, focus o modal activo).

## Shapes

- **Controles interactivos:** Radio medio de 12px (`0.75rem` / `rounded-xl`) en botones, selects y campos de entrada. Proporciona una curvatura moderna y ergonómica sin infantilizar el instrumento.
- **Paneles y tarjetas:** Radio amplio de 16px (`1rem` / `rounded-2xl`) en tarjetas de crédito, modales y gráficos.
- **Insignias y estados:** Radio completo pill (`9999px` / `rounded-full`) para badges de orden de bola de nieve y tags de categoría.
- **Bordes:** Trazo uniforme de 1px en reposo, elevándose a 2px exclusivamente en el contenedor de la deuda objetivo activa de bola de nieve.

## Components

### Buttons
- **Shape:** Esquinas redondeadas (12px / `0.75rem`).
- **Primary:** Fondo Cobalt Precision (`#2563eb`), texto blanco en negrita (`font-weight: 700`), relleno vertical de 10px y horizontal de 16px (`0.625rem 1rem`), sombra sutil de 1px.
- **Hover / Focus:** Transición suave a tono más oscuro (`#1d4ed8`), anillo de enfoque de 4px con espacio de separación de 2px respecto al fondo base. Efecto táctil al presionar (`transform: scale(0.98)`).
- **Secondary:** Fondo neutro sutil (`--surface-subtle`), borde visible (`--border-subtle`), texto principal. Al hover cambia a `--surface-muted` con borde reforzado.

### Cards / Containers
- **Corner Style:** Radio de 16px (`1rem` / `rounded-2xl`).
- **Background:** `--surface-card` en reposo; `--surface-subtle` para créditos liquidados como evidencia archivada.
- **Shadow Strategy:** Plana con sombra mínima de 1px a 3px para despegarse del lienzo.
- **Border:** 1px sólido (`--border-subtle`).
- **Internal Padding:** 20px a 24px (`1.25rem` a `1.5rem`).

### Inputs / Fields
- **Style:** Fondo `--surface-subtle`, borde de 1px `--border-subtle`, radio de 12px (`0.75rem`), texto primario con tipografía tabular para valores monetarios.
- **Focus:** Borde Cobalt Precision y anillo sutil exterior (`box-shadow: 0 0 0 3px var(--brand-surface)`).
- **Disabled:** Opacidad reducida al 50%, fondo `--surface-muted` y cursor `not-allowed`.

### Navigation
- **Sidebar:** Barra lateral fija a la izquierda con logotipo de marca, insignias numéricas para deudas pendientes, botón para alternar tema claro/oscuro y estado activo con píldora de fondoCobalt sutil y barra lateral de acento.
- **Mobile Nav:** Botón de menú hamburguesa accesible en cabecera con panel deslizante y backdrop desenfocado sutil.

### Signature Component: Snowball Target Card
- Tarjeta de crédito prioritaria para liquidación inmediata: resaltada con borde doble de 2px en Cobalt Precision (`#2563eb`), sombra exterior sutil y badge con icono de llama/fuego que indica que cada peso extraordinario del flujo de caja debe ser dirigido a esta tarjeta hasta su aniquilación.

## Do's and Don'ts

### Do:
- **Do** alinear verticalmente todas las cantidades numéricas, saldos, fechas y tasas mediante `tabular-nums`.
- **Do** reservar el color verde (#16a34a / #22c55e) exclusivamente para amortizaciones, abonos a capital, deudas liquidadas y excedentes de flujo.
- **Do** asegurar que todo elemento interactivo implemente de forma visible sus cuatro estados: hover, focus-visible, active y disabled.
- **Do** respetar la distribución cromática 60-30-10 en cada nueva pantalla o modal creado.
- **Do** mantener el modo oscuro en tonalidades pizarra profunda equilibrada (#0b0f19 / #111827), evitando el negro absoluto (#000000).

### Don't:
- **Don't** utilizar emojis como sustitutos de iconos de interfaz; emplear siempre iconos vectoriales SVG de Lucide Icons.
- **Don't** emplear gradientes morado/cian, glassmorphism excesivo o tarjetas flotantes descontextualizadas de estilo IA cliché.
- **Don't** formatear montos financieros sin decimales consistentes o sin el símbolo de divisa correspondiente.
- **Don't** omitir el desglose entre capital e intereses bancarios al registrar pagos o proyecciones.
- **Don't** permitir scroll horizontal accidental en pantallas móviles; probar siempre la vista compacta primero.
