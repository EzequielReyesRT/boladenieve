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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Gestión de Deudas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ordenadas estrictamente de menor a mayor saldo según el Método de la Bola de Nieve
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddDebtModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agregar Deuda
        </button>
      </div>

      {/* Mini Resumen de Deudas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Saldo Restante
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatoMoneda(deudaTotalActual)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Original: {formatoMoneda(deudaTotalOriginal)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Mínimos Requeridos
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {formatoMoneda(sumaMinimosActivos)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Compromiso mensual base
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Tarjetas Pendientes
          </span>
          <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalPendientes}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Por liquidar
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Liquidadas
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalLiquidadas}
          </div>
          <div className="text-[11px] text-emerald-500 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Flujo liberado
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas de Deuda */}
      {deudasConSaldo.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No tienes deudas registradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Comienza agregando tus tarjetas de crédito, préstamos personales o créditos de nómina para activar el plan bola de nieve.
          </p>
          <button
            onClick={onOpenAddDebtModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
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
