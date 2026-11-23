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
      className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-200 border ${
        isPaid
          ? 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] opacity-85'
          : isSnowballTarget
          ? 'bg-[var(--surface-card)] border-2 border-[var(--brand-primary)] shadow-sm'
          : 'bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm hover:border-[var(--border-strong)]'
      }`}
    >
      {/* Header del Card */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Badge de Posición Bola de Nieve */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm tabular-nums ${
              isPaid
                ? 'bg-[var(--brand-surface)] text-[var(--brand-text)]'
                : isSnowballTarget
                ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            {isPaid ? <CheckCircle className="w-5 h-5 text-[var(--brand-primary)]" /> : `#${rank}`}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base sm:text-lg text-[var(--text-primary)] leading-tight">
                {deuda.nombre_tarjeta}
              </h3>
              {isSnowballTarget && !isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-primary)] text-white shadow-xs">
                  <Flame className="w-3 h-3 text-amber-200" />
                  Objetivo Actual
                </span>
              )}
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-surface)] text-[var(--brand-text)]">
                  Liquidada
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Tasa anual: <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatoPorcentaje(deuda.tasa_anual_porcentaje)}</span> | Pago mín: <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatoMoneda(deuda.pago_minimo)}</span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(deuda)}
            aria-label={`Editar ${deuda.nombre_tarjeta}`}
            title="Editar deuda"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar la deuda "${deuda.nombre_tarjeta}" y su historial de pagos?`)) {
                onDelete(deuda.id);
              }
            }}
            aria-label={`Eliminar ${deuda.nombre_tarjeta}`}
            title="Eliminar deuda"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)] active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bloque de Saldos */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
        <div>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Saldo Restante
          </span>
          <div className={`text-lg sm:text-xl font-bold tracking-tight tabular-nums ${isPaid ? 'text-[var(--brand-primary)]' : 'text-[var(--status-danger)]'}`}>
            {formatoMoneda(deuda.saldo_actual)}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Saldo Original
          </span>
          <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)] tracking-tight tabular-nums">
            {formatoMoneda(deuda.saldo_inicial)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Total Amortizado
          </span>
          <div className="text-base sm:text-lg font-semibold text-[var(--brand-primary)] tracking-tight tabular-nums">
            {formatoMoneda(deuda.amortizacion_capital)}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[var(--text-secondary)]">Progreso de liquidación:</span>
          <span className="font-bold text-[var(--brand-primary)] tabular-nums">
            {formatoPorcentaje(deuda.porcentaje_pagado)}
          </span>
        </div>
        <div className="w-full bg-[var(--surface-muted)] rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-[var(--brand-primary)] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, deuda.porcentaje_pagado))}%` }}
          />
        </div>
      </div>

      {/* Detalles y Anualidad */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          {deuda.costo_anualidad > 0 ? (
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[var(--status-warning)]" />
              Anualidad: <span className="tabular-nums">{formatoMoneda(deuda.costo_anualidad)}</span> en {MESES[deuda.mes_cobro_anualidad - 1]}
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">Sin anualidad</span>
          )}
        </div>

        {!isPaid && (
          <button
            onClick={() => onPay(deuda)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--brand-surface)] text-[var(--brand-text)] border border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-98 transition-all cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Registrar Abono</span>
          </button>
        )}
      </div>
    </div>
  );
}
