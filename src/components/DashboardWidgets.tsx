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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Estrategia Bola de Nieve Activa
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Tu Camino hacia la Libertad Financiera
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Priorizando primero las deudas de menor saldo para ganar victorias psicológicas rápidas
              y transferir ese flujo de caja en cascada a las siguientes.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onOpenAddDebtModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Deuda
            </button>
            <button
              onClick={onGoToSimulator}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
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
          className={`rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
            onGoToDeudas ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Deuda Total Actual
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatoMoneda(deudaTotalActual)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Inicial:</span>
              <span className="line-through">{formatoMoneda(deudaTotalOriginal)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {totalDeudasPendientes} {totalDeudasPendientes === 1 ? 'pendiente' : 'pendientes'}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {totalDeudasLiquidadas} liquidadas
            </span>
          </div>
        </div>

        {/* Widget 2: Porcentaje de Avance General */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Avance General
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatoPorcentaje(porcentajeAvanceGlobal)}
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-700"
                style={{ width: `${porcentajeAvanceGlobal}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Amortizado:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatoMoneda(Math.max(0, deudaTotalOriginal - deudaTotalActual))}
            </span>
          </div>
        </div>

        {/* Widget 3: Pago Extra Mensual */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Pago Extra Mensual
            </span>
            <button
              onClick={onOpenConfigModal}
              title="Modificar aportación extra"
              className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-200 transition-colors"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatoMoneda(config.pago_extra_mensual)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Acelerador inyectado cada mes a la deuda #1
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Anual (Mes {config.mes_aportacion_unica}):</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {formatoMoneda(config.aportacion_unica_anual)}
            </span>
          </div>
          {onGoToFlujo && (
            <button
              onClick={onGoToFlujo}
              className="mt-2.5 w-full flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <span>Flujo libre este mes:</span>
              <span className="font-bold">
                {resumenFlujoMes ? formatoMoneda(resumenFlujoMes.flujo_neto_disponible) : '$0.00'} →
              </span>
            </button>
          )}
        </div>

        {/* Widget 4: Meta Bola de Nieve */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
              Meta Bola de Nieve
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {simulacion.meses_totales > 0 ? `${simulacion.meses_totales} meses` : '¡Libre!'}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              {simulacion.fecha_libertad_financiera}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Intereses proyectados:</span>
            <span className="font-semibold text-rose-500">
              {formatoMoneda(simulacion.total_intereses_proyectados)}
            </span>
          </div>
        </div>
      </div>

      {/* Banner Foco Bola de Nieve */}
      {deudasConSaldo.length > 0 && primerDeudaPendiente && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-700 dark:text-slate-300 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start sm:items-center gap-3">
            <Flame className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <strong>Foco Bola de Nieve:</strong> Tu objetivo activo inmediato es{' '}
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {primerDeudaPendiente.nombre_tarjeta}
              </span>
              . Cubre los pagos mínimos de las demás y abona todo tu excedente a esta tarjeta. Al liquidarla, su pago mínimo se transferirá automáticamente a la siguiente deuda.
            </p>
          </div>

          {onGoToDeudas && (
            <button
              onClick={onGoToDeudas}
              className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
            >
              Ver Deudas →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
