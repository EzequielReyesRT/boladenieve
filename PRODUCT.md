# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas y familias con múltiples deudas de consumo (tarjetas de crédito, préstamos personales y créditos departamentales) que experimentan estrés financiero y buscan liquidar sus pasivos de forma sistemática para recuperar el control de su flujo de caja y capacidad de ahorro.

## Product Purpose

Proporcionar un entorno interactivo y visual para planificar, simular y registrar la amortización acelerada de deudas mediante el Método de la Bola de Nieve (Snowball Debt Payoff). Su propósito es convertir la angustia financiera en una ruta clara y medible hacia la libertad de deudas, maximizando el impulso psicológico a través de victorias tempranas y vinculando el plan directamente con el flujo de caja real. El éxito se define cuando el usuario visualiza su fecha exacta de liquidación total y mantiene una bitácora consistente de pagos hasta eliminar todas sus deudas.

## Positioning

A diferencia de las hojas de cálculo tradicionales o los gestores de finanzas genéricos, Bola de Nieve combina la simulación matemática predictiva (a 120 meses con cálculo de cuotas mínimas, intereses y cargos por anualidad) con la conexión en tiempo real al flujo de caja y excedente disponible, reforzando la adherencia conductual mediante la priorización estricta por saldo menor sin requerir conexión forzosa a servicios de terceros.

## Operating Context

- Aplicación web responsive orientada a uso móvil prioritario (Mobile-First) y accesible en escritorio para revisiones exhaustivas y simulaciones de largo plazo.
- Entorno de ejecución flexible: base de datos local en desarrollo (`PGlite` en WebAssembly, persistencia en `./dev-db`), con capacidad de despliegue cloud en Supabase con RLS (Row Level Security) o intranet corporativa con Microsoft SQL Server e IIS.
- Escenarios de uso:
  - Consulta rápida y registro inmediato tras realizar un pago o recibir ingresos.
  - Planificación mensual al cierre de mes para asignar el excedente y acelerador de bola de nieve.
  - Simulación estratégica ante ingresos extraordinarios (aguinaldos, bonos o ahorros imprevistos).

## Capabilities and Constraints

- **Capacidades confirmadas**:
  - Catálogo de deudas con detalle de saldo actual, cuota mínima, CAT/tasa anual y cargos periódicos de anualidad.
  - Ordenamiento automático por saldo menor (secuencia Bola de Nieve) con reasignación acumulativa del pago libre conforme se amortizan créditos.
  - Flujo de caja con desglose de ingresos y gastos (fijos y variables) para calcular el excedente neto real inyectable al plan.
  - Simulador predictivo a 120 meses con proyecciones tabulares y gráficas de área acumulada (Recharts).
  - Bitácora de pagos con clasificación (`Minimo`, `Extra`, `Anualidad`, `Liquidacion`) y desglose de amortización a capital vs. intereses.
  - Sistema de temas claro / oscuro basado en tokens semánticos (60-30-10) y soporte multi-usuario con autenticación local/cloud.
- **Restricciones técnicas**:
  - Frontend en Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS v4.
  - Sin dependencias de servicios financieros bancarios externos cerrados; la privacidad y soberanía de datos es primordial.
  - Cumplimiento estricto de accesibilidad WCAG AA y directrices AppSec (sin secretos en cliente, consultas parametrizadas, RBAC).

## Brand Commitments

- **Nombre**: Bola de Nieve.
- **Tono y voz**: Profesional, alentador, empático, transparente y libre de tecnicismos bancarios intimidantes.
- **Identidad visual**: Limpia, orientada a datos, con paleta semántica equilibrada (azules corporativos sobrios para acento, verdes estrictamente reservados para saldos positivos y amortización, y rojos para pasivos o advertencias). Prohibido el uso de estética genérica de IA o emojis como íconos (se utiliza Lucide Icons).

## Evidence on Hand

- Código fuente completo y funcional con esquema de base de datos relacional (`supabase/schema.sql`, `dev-db`), motor de simulación (`src/lib/snowball-engine.ts`) y componentes UI en producción.
- Ausencia confirmada de testimonios comerciales fabricados o certificaciones de terceros no verificadas.

## Product Principles

1. **La psicología precede a la optimización matemática**: Priorizar victorias tempranas y tangibles liquidando deudas pequeñas primero para consolidar el hábito y la motivación.
2. **Sincronización con la realidad del bolsillo**: Ningún plan de pago existe en el vacío; la estrategia de aceleración debe responder al excedente real del flujo de caja mensual.
3. **Claridad y soberanía del dato**: Cifras directas, números tabulares legibles, visibilidad total del costo financiero (intereses y comisiones) y control total del usuario sobre su información.
4. **Respeto a la disciplina visual**: Interfaz densa pero ordenada, libre de ruidos decorativos, optimizada para la toma de decisiones financieras racionales.

## Accessibility & Inclusion

- Cumplimiento de estándar mínimo WCAG AA (contraste de texto mínimo 4.5:1 y 3:1 para elementos interactivos).
- Soporte para navegación completa por teclado con estados `:focus-visible` diferenciados.
- Formato de datos numéricos con fuentes tabulares (`tabular-nums`) para prevenir desalineaciones visuales en tablas y métricas financieras.
