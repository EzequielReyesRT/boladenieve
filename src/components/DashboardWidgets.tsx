'use client';

import React from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { formatoMoneda, formatoPorcentaje } from '@/lib/snowball-engine';
import {
  TrendingDown,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface DashboardWidgetsProps {
  onOpenConfigModal: () => void;
  onOpenAddDebtModal: () => void;
  onGoToSimulator: () => void;
  onGoToDeudas?: () => void;
  onGoToFlujo?: () => void;
}

export function DashboardWidgets({
  onOpenConfigModal,
  onOpenAddDebtModal,
  onGoToSimulator,
  onGoToDeudas,
  onGoToFlujo,
}: DashboardWidgetsProps) {
  const {
    deudaTotalActual,
    deudaTotalOriginal,
    porcentajeAvanceGlobal,
    config,
    simulacion,
    deudasConSaldo,
    resumenFlujoMes,
  } = useSnowball();

  const totalDeudasPendientes = deudasConSaldo.filter((d) => !d.esta_liquidada).length;
  const totalDeudasLiquidadas = deudasConSaldo.filter((d) => d.esta_liquidada).length;
  const primerDeudaPendiente = deudasConSaldo.find((d) => !d.esta_liquidada);

  return (
    <div className="space-y-6">
      {/* Banner de Estado Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-8 text-[var(--text-primary)] shadow-sm">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[var(--brand-surface)] blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--brand-text)]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)]"><Sparkles className="w-3.5 h-3.5" /></span>
              PLAN DE PAGO ACTIVO
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Avanza hacia tu libertad financiera
            </h1>
            <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Priorizando primero las deudas de menor saldo para ganar victorias psicológicas rápidas
              y transferir ese flujo de caja en cascada a las siguientes.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onOpenAddDebtModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] text-[var(--text-primary)] text-sm font-semibold border border-[var(--border-subtle)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-98"
            >
              <Plus className="w-4 h-4" />
              Nueva Deuda
            </button>
            <button
              onClick={onGoToSimulator}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-98"
            >
              Ver Simulación
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de 4 Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Widget 1: Deuda Total Actual */}
        <div
          onClick={onGoToDeudas}
          className={`rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs relative overflow-hidden transition-all ${
            onGoToDeudas
              ? 'cursor-pointer hover:border-[var(--border-strong)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]'
              : ''
          }`}
          role={onGoToDeudas ? 'button' : undefined}
          tabIndex={onGoToDeudas ? 0 : undefined}
          onKeyDown={(e) => {
            if (onGoToDeudas && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onGoToDeudas();
            }
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text-muted)]">
              Saldo pendiente
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight tabular-nums">
              {formatoMoneda(deudaTotalActual)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)] tabular-nums">
              <span>Inicial:</span>
              <span className="line-through">{formatoMoneda(deudaTotalOriginal)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 tabular-nums">
              <TrendingDown className="w-3.5 h-3.5" />
              {totalDeudasPendientes} {totalDeudasPendientes === 1 ? 'pendiente' : 'pendientes'}
            </span>
            <span className="text-[var(--brand-primary)] font-semibold tabular-nums">
              {totalDeudasLiquidadas} liquidadas
            </span>
          </div>
        </div>

        {/* Widget 2: Porcentaje de Avance General */}
        <div className="rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text-muted)]">
              Deuda liquidada
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--brand-primary)] tracking-tight tabular-nums">
              {formatoPorcentaje(porcentajeAvanceGlobal)}
            </div>
            <div className="mt-2 w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[var(--brand-primary)] h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, porcentajeAvanceGlobal))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Amortizado:</span>
            <span className="font-semibold text-[var(--brand-primary)] tabular-nums">
              {formatoMoneda(Math.max(0, deudaTotalOriginal - deudaTotalActual))}
            </span>
          </div>
        </div>

        {/* Widget 3: Pago Extra Mensual */}
        <div className="rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text-muted)]">
              Aporte extra mensual
            </span>
            <button
              onClick={onOpenConfigModal}
              title="Modificar aportación extra"
              aria-label="Modificar aportación extra en configuración"
              className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center hover:bg-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight tabular-nums">
              {formatoMoneda(config.pago_extra_mensual)}
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              Acelerador inyectado cada mes a la deuda #1
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Anual (Mes {config.mes_aportacion_unica}):</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {formatoMoneda(config.aportacion_unica_anual)}
            </span>
          </div>
          {onGoToFlujo && (
            <button
              onClick={onGoToFlujo}
              className="mt-2.5 w-full flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-[var(--brand-surface)] border border-[var(--brand-border)] text-[var(--brand-text)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-98 transition-all"
            >
              <span>Flujo libre este mes:</span>
              <span className="font-bold tabular-nums">
                {resumenFlujoMes ? formatoMoneda(resumenFlujoMes.flujo_neto_disponible) : '$0.00'} →
              </span>
            </button>
          )}
        </div>

        {/* Widget 4: Meta Bola de Nieve */}
        <div className="rounded-2xl p-5 bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs relative overflow-hidden transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-[var(--text-muted)]">
              Meta Bola de Nieve
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
              {simulacion.meses_totales > 0 ? `${simulacion.meses_totales} meses` : '¡Libre!'}
            </div>
            <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
              {simulacion.fecha_libertad_financiera}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Intereses proyectados:</span>
            <span className="font-semibold text-rose-500 tabular-nums">
              {formatoMoneda(simulacion.total_intereses_proyectados)}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Foco Bola de Nieve */}
      {deudasConSaldo.length > 0 && primerDeudaPendiente && (
        <div className="p-4 rounded-2xl bg-[var(--brand-surface)] border border-[var(--brand-border)] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[var(--text-secondary)] shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <Flame className="w-5 h-5 text-[var(--brand-primary)] shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <strong className="text-[var(--text-primary)]">Foco Bola de Nieve:</strong> Tu objetivo activo inmediato es{' '}
              <span className="font-extrabold text-[var(--brand-primary)]">
                {primerDeudaPendiente.nombre_tarjeta}
              </span>
              . Cubre los pagos mínimos de las demás y abona todo tu excedente a esta tarjeta. Al liquidarla, su pago mínimo se transferirá automáticamente a la siguiente deuda.
            </p>
          </div>

          {onGoToDeudas && (
            <button
              onClick={onGoToDeudas}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[var(--brand-text)] bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] border border-[var(--brand-border)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
            >
              Ver Deudas →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
