'use client';

import React, { useState } from 'react';
import { DeudaConSaldoActual } from '@/types';
import { formatoMoneda, formatoPorcentaje } from '@/lib/snowball-engine';
import { ConfirmModal } from '@/components/ConfirmModal';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        <div className="flex items-center gap-3 min-w-0">
          {/* Badge de Posición Bola de Nieve */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm tabular-nums shrink-0 ${
              isPaid
                ? 'bg-[var(--status-success-surface)] text-[var(--status-success)] border border-[var(--status-success-border)]'
                : isSnowballTarget
                ? 'bg-[var(--brand-primary)] text-white shadow-xs ring-2 ring-[var(--brand-surface)]'
                : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            }`}
          >
            {isPaid ? <CheckCircle className="w-5 h-5 text-[var(--status-success)]" /> : `#${rank}`}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg text-[var(--text-primary)] leading-tight truncate">
                {deuda.nombre_tarjeta}
              </h3>
              {isSnowballTarget && !isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--brand-primary)] text-white shadow-xs">
                  <Flame className="w-3 h-3 text-amber-200" />
                  Objetivo #1
                </span>
              )}
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--status-success-surface)] text-[var(--status-success-text)] border border-[var(--status-success-border)]">
                  Liquidada
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
              Tasa anual: <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatoPorcentaje(deuda.tasa_anual_porcentaje)}</span> • Pago mín: <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatoMoneda(deuda.pago_minimo)}</span>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(deuda)}
            aria-label={`Editar ${deuda.nombre_tarjeta}`}
            title="Editar deuda"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 transition-all cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={`Eliminar ${deuda.nombre_tarjeta}`}
            title="Eliminar deuda"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)] active:scale-95 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bloque de Saldos */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Saldo Restante
          </span>
          <div className={`text-lg sm:text-xl font-extrabold tracking-tight tabular-nums mt-0.5 ${isPaid ? 'text-[var(--status-success)]' : 'text-[var(--status-danger)]'}`}>
            {formatoMoneda(deuda.saldo_actual)}
          </div>
        </div>

        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Saldo Original
          </span>
          <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight tabular-nums mt-0.5">
            {formatoMoneda(deuda.saldo_inicial)}
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] sm:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Amortizado
          </span>
          <div className="text-sm sm:text-base font-bold text-[var(--status-success)] tracking-tight tabular-nums mt-0.5">
            {formatoMoneda(deuda.amortizacion_capital)}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-secondary)]">Progreso de liquidación:</span>
          <span className="font-extrabold text-[var(--status-success)] tabular-nums">
            {formatoPorcentaje(deuda.porcentaje_pagado)}
          </span>
        </div>
        <div className="w-full bg-[var(--surface-muted)] rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-[var(--status-success)] transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, deuda.porcentaje_pagado))}%` }}
          />
        </div>
      </div>

      {/* Detalles y Anualidad */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          {deuda.costo_anualidad > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Anualidad: <span className="tabular-nums font-bold text-[var(--text-primary)]">{formatoMoneda(deuda.costo_anualidad)}</span> ({MESES[deuda.mes_cobro_anualidad - 1]})
            </span>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">Sin anualidad</span>
          )}
        </div>

        {!isPaid && (
          <button
            onClick={() => onPay(deuda)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-98 cursor-pointer ${
              isSnowballTarget
                ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-xs'
                : 'bg-[var(--surface-subtle)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isSnowballTarget ? 'Abonar Objetivo' : 'Registrar Abono'}</span>
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="¿Eliminar deuda?"
        message={`¿Estás seguro de eliminar "${deuda.nombre_tarjeta}" y todo su historial de pagos? Esta acción no se puede deshacer.`}
        confirmText="Eliminar deuda"
        isDestructive={true}
        onConfirm={() => {
          onDelete(deuda.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
