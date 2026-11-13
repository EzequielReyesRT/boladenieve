'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { TipoPago } from '@/types';
import { formatoMoneda } from '@/lib/snowball-engine';
import {
  Receipt,
  Trash2,
  PlusCircle,
} from 'lucide-react';

interface PaymentHistoryTableProps {
  onOpenPaymentModal: () => void;
}

const BADGE_COLORS: Record<TipoPago, { bg: string; text: string; border: string }> = {
  Extra: {
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300/50 dark:border-emerald-800',
  },
  Minimo: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300/50 dark:border-slate-700',
  },
  Liquidacion: {
    bg: 'bg-purple-100 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300/50 dark:border-purple-800',
  },
  Anualidad: {
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300/50 dark:border-amber-800',
  },
};

export function PaymentHistoryTable({ onOpenPaymentModal }: PaymentHistoryTableProps) {
  const { bitacora, deudas, deletePago } = useSnowball();
  const [filterDeudaId, setFilterDeudaId] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  const deudaMap = new Map(deudas.map((d) => [d.id, d.nombre_tarjeta]));

  const filteredPagos = bitacora.filter((p) => {
    if (filterDeudaId !== 'all' && p.deuda_id !== filterDeudaId) return false;
    if (filterTipo !== 'all' && p.tipo_pago !== filterTipo) return false;
    return true;
  });

  const totalMontoFiltrado = filteredPagos.reduce((s, p) => s + Number(p.monto_total || 0), 0);
  const totalInteresesFiltrado = filteredPagos.reduce((s, p) => s + Number(p.intereses_cobrados || 0), 0);
  const totalAmortizadoFiltrado = Math.max(0, totalMontoFiltrado - totalInteresesFiltrado);

  return (
    <div className="space-y-4">
      {/* Barra de cabecera con filtros y acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Historial de Pagos y Abonos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredPagos.length} {filteredPagos.length === 1 ? 'registro' : 'registros'} en la bitácora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por tarjeta */}
          <select
            value={filterDeudaId}
            onChange={(e) => setFilterDeudaId(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todas las tarjetas</option>
            {deudas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre_tarjeta}
              </option>
            ))}
          </select>

          {/* Filtro por tipo */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="Extra">Pago Extra</option>
            <option value="Minimo">Pago Mínimo</option>
            <option value="Liquidacion">Liquidación</option>
            <option value="Anualidad">Anualidad</option>
          </select>

          {/* Botón registrar */}
          <button
            onClick={onOpenPaymentModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo Abono
          </button>
        </div>
      </div>

      {/* Mini resumen de la bitácora filtrada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Total Desembolsado
          </span>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatoMoneda(totalMontoFiltrado)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Intereses Absorbidos
          </span>
          <div className="text-lg font-black text-rose-500">
            {formatoMoneda(totalInteresesFiltrado)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
            Amortización Real al Capital
          </span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatoMoneda(totalAmortizadoFiltrado)}
          </div>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {filteredPagos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay pagos registrados con estos filtros
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registra un pago para comenzar a ver el progreso real.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tarjeta</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
                <th className="py-3 px-4 text-right">Intereses</th>
                <th className="py-3 px-4 text-right">A Capital</th>
                <th className="py-3 px-4">Folio / Comprobante</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPagos.map((pago) => {
                const nombre = deudaMap.get(pago.deuda_id) || 'Tarjeta eliminada';
                const amort = Math.max(0, pago.monto_total - pago.intereses_cobrados);
                const badge = BADGE_COLORS[pago.tipo_pago] || BADGE_COLORS.Extra;

                return (
                  <tr
                    key={pago.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {pago.fecha_pago}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {pago.tipo_pago}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                      {formatoMoneda(pago.monto_total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-rose-500">
                      {pago.intereses_cobrados > 0 ? formatoMoneda(pago.intereses_cobrados) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatoMoneda(amort)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-[150px] truncate">
                      {pago.folio_comprobante || <span className="text-slate-400 italic">Sin folio</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este pago de la bitácora?')) {
                            deletePago(pago.id);
                          }
                        }}
                        title="Eliminar registro"
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
