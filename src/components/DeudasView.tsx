'use client';

import React from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { DebtCard } from '@/components/DebtCard';
import { DeudaConSaldoActual } from '@/types';
import { formatoMoneda } from '@/lib/snowball-engine';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DeudasViewProps {
  onOpenAddDebtModal: () => void;
  onPay: (deuda: DeudaConSaldoActual) => void;
  onEdit: (deuda: DeudaConSaldoActual) => void;
}

export function DeudasView({
  onOpenAddDebtModal,
  onPay,
  onEdit,
}: DeudasViewProps) {
  const { deudasConSaldo, deleteDeuda, deudaTotalActual, deudaTotalOriginal } = useSnowball();

  const primerDeudaPendiente = deudasConSaldo.find((d) => !d.esta_liquidada);
  const totalLiquidadas = deudasConSaldo.filter((d) => d.esta_liquidada).length;
  const totalPendientes = deudasConSaldo.filter((d) => !d.esta_liquidada).length;
  const sumaMinimosActivos = deudasConSaldo
    .filter((d) => !d.esta_liquidada)
    .reduce((sum, d) => sum + d.pago_minimo, 0);

  return (
    <div className="space-y-6">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--text-primary)]">
                Gestión de Deudas
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Ordenadas estrictamente de menor a mayor saldo según el Método de la Bola de Nieve
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddDebtModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-bold shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Deuda</span>
        </button>
      </div>

      {/* Mini Resumen de Deudas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Saldo Restante
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
            {formatoMoneda(deudaTotalActual)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
            Original: {formatoMoneda(deudaTotalOriginal)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Mínimos Requeridos
          </span>
          <div className="text-lg sm:text-xl font-black text-[var(--text-primary)] mt-1 tabular-nums">
            {formatoMoneda(sumaMinimosActivos)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Compromiso mensual base
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Tarjetas Pendientes
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {totalPendientes}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Por liquidar
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Liquidadas
          </span>
          <div className="text-lg sm:text-xl font-black text-[var(--status-success)] mt-1 tabular-nums">
            {totalLiquidadas}
          </div>
          <div className="text-[11px] text-[var(--status-success)] mt-0.5 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Flujo liberado
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Deuda */}
      {deudasConSaldo.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface-card)] border border-dashed border-[var(--border-subtle)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No tienes deudas registradas
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Comienza agregando tus tarjetas de crédito, préstamos personales o créditos de nómina para activar el plan bola de nieve.
          </p>
          <button
            onClick={onOpenAddDebtModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Registrar Primera Deuda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deudasConSaldo.map((deuda, index) => {
            const isTarget = primerDeudaPendiente?.id === deuda.id;
            return (
              <DebtCard
                key={deuda.id}
                deuda={deuda}
                rank={index + 1}
                isSnowballTarget={isTarget}
                onPay={onPay}
                onEdit={onEdit}
                onDelete={(id) => deleteDeuda(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
