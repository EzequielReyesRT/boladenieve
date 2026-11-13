'use client';

import React from 'react';
import { DeudaConSaldoActual } from '@/types';
import { formatoMoneda, formatoPorcentaje } from '@/lib/snowball-engine';
import {
  Flame,
  CheckCircle,
  Calendar,
  Trash2,
  Edit2,
  DollarSign,
} from 'lucide-react';

interface DebtCardProps {
  deuda: DeudaConSaldoActual;
  rank: number;
  isSnowballTarget: boolean;
  onPay: (deuda: DeudaConSaldoActual) => void;
  onEdit: (deuda: DeudaConSaldoActual) => void;
  onDelete: (id: string) => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function DebtCard({
  deuda,
  rank,
  isSnowballTarget,
  onPay,
  onEdit,
  onDelete,
}: DebtCardProps) {
  const isPaid = deuda.esta_liquidada;

  return (
    <div
      className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
        isPaid
          ? 'bg-slate-50 dark:bg-slate-900/40 border-emerald-500/30 opacity-80'
          : isSnowballTarget
          ? 'bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Header del Card */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Badge de Posición Bola de Nieve */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
              isPaid
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : isSnowballTarget
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isPaid ? <CheckCircle className="w-5 h-5" /> : `#${rank}`}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {deuda.nombre_tarjeta}
              </h3>
              {isSnowballTarget && !isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-600 text-white shadow-sm">
                  <Flame className="w-3 h-3 text-amber-300" />
                  Objetivo Actual
                </span>
              )}
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ¡Liquidada!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tasa anual: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatoPorcentaje(deuda.tasa_anual_porcentaje)}</span> | Pago mín: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatoMoneda(deuda.pago_minimo)}</span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(deuda)}
            title="Editar deuda"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar la deuda "${deuda.nombre_tarjeta}" y su historial de pagos?`)) {
                onDelete(deuda.id);
              }
            }}
            title="Eliminar deuda"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bloque de Saldos */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/60">
        <div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Saldo Restante
          </span>
          <div className={`text-lg sm:text-xl font-black tracking-tight ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatoMoneda(deuda.saldo_actual)}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Saldo Original
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 tracking-tight">
            {formatoMoneda(deuda.saldo_inicial)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Amortizado
          </span>
          <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatoMoneda(deuda.amortizacion_capital)}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Progreso de liquidación:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatoPorcentaje(deuda.porcentaje_pagado)}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              isPaid
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${deuda.porcentaje_pagado}%` }}
          />
        </div>
      </div>

      {/* Detalles y Anualidad */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          {deuda.costo_anualidad > 0 ? (
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Anualidad: {formatoMoneda(deuda.costo_anualidad)} en {MESES[deuda.mes_cobro_anualidad - 1]}
            </span>
          ) : (
            <span className="text-slate-400">Sin anualidad</span>
          )}
        </div>

        {!isPaid && (
          <button
            onClick={() => onPay(deuda)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white border border-emerald-500/20 hover:border-emerald-600 transition-all active:scale-95"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Registrar Abono
          </button>
        )}
      </div>
    </div>
  );
}
