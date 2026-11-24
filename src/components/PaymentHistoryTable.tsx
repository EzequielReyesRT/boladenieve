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
import { ConfirmModal } from './ConfirmModal';

interface PaymentHistoryTableProps {
  onOpenPaymentModal: () => void;
}

const BADGE_COLORS: Record<TipoPago, { bg: string; text: string; border: string }> = {
  Extra: {
    bg: 'bg-[var(--status-success-surface)]',
    text: 'text-[var(--status-success-text)]',
    border: 'border-[var(--status-success-border)]',
  },
  Minimo: {
    bg: 'bg-[var(--surface-subtle)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border-subtle)]',
  },
  Liquidacion: {
    bg: 'bg-[var(--brand-surface)]',
    text: 'text-[var(--brand-text)]',
    border: 'border-[var(--brand-border)]',
  },
  Anualidad: {
    bg: 'bg-[var(--status-warning-surface)]',
    text: 'text-[var(--status-warning)]',
    border: 'border-amber-200 dark:border-amber-900/50',
  },
};

export function PaymentHistoryTable({ onOpenPaymentModal }: PaymentHistoryTableProps) {
  const { bitacora, deudas, deletePago } = useSnowball();
  const [filterDeudaId, setFilterDeudaId] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [pagoToDelete, setPagoToDelete] = useState<{ id: string; monto: number } | null>(null);

  const deudaMap = new Map(deudas.map((d) => [d.id, d.nombre_tarjeta]));
  const hasActiveFilters = filterDeudaId !== 'all' || filterTipo !== 'all';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Historial de Pagos y Abonos
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              <span className="tabular-nums font-semibold">{filteredPagos.length}</span>{' '}
              {filteredPagos.length === 1 ? 'registro' : 'registros'} en la bitácora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por tarjeta */}
          <select
            value={filterDeudaId}
            onChange={(e) => setFilterDeudaId(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
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
            className="text-xs px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            <option value="all">Todos los tipos</option>
            <option value="Extra">Pago Extra</option>
            <option value="Minimo">Pago Mínimo</option>
            <option value="Liquidacion">Liquidación</option>
            <option value="Anualidad">Anualidad</option>
          </select>

          {/* Botón limpiar filtros si hay alguno activo */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterDeudaId('all');
                setFilterTipo('all');
              }}
              className="text-xs px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
            >
              Restablecer
            </button>
          )}

          {/* Botón registrar */}
          <button
            onClick={onOpenPaymentModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Abono</span>
          </button>
        </div>
      </div>

      {/* Mini resumen de la bitácora filtrada */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Total Desembolsado
          </span>
          <div className="text-lg font-black text-[var(--text-primary)] tabular-nums mt-0.5">
            {formatoMoneda(totalMontoFiltrado)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Intereses Absorbidos
          </span>
          <div className="text-lg font-black text-rose-500 tabular-nums mt-0.5">
            {formatoMoneda(totalInteresesFiltrado)}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Amortización Real al Capital
          </span>
          <div className="text-lg font-black text-[var(--brand-primary)] tabular-nums mt-0.5">
            {formatoMoneda(totalAmortizadoFiltrado)}
          </div>
        </div>
      </div>

      {/* Tabla Responsiva (Modern Web Guidance: responsive-table) */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Historial de pagos registrados"
        className="overflow-x-auto rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      >
        {filteredPagos.length === 0 ? (
          <div className="text-center py-12 px-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {hasActiveFilters ? 'Sin resultados con estos filtros' : 'Bitácora sin pagos registrados'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              {hasActiveFilters
                ? 'Prueba restableciendo los filtros para ver todos los movimientos registrados.'
                : 'Registra un pago para comenzar a visualizar la amortización y el ahorro en intereses.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={() => {
                    setFilterDeudaId('all');
                    setFilterTipo('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
                >
                  Restablecer filtros
                </button>
              ) : (
                <button
                  onClick={onOpenPaymentModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Registrar Primer Abono</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Historial de abonos y amortizaciones de deudas</caption>
            <thead className="sticky top-0 z-10 bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
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
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredPagos.map((pago) => {
                const nombre = deudaMap.get(pago.deuda_id) || 'Tarjeta eliminada';
                const amort = Math.max(0, pago.monto_total - pago.intereses_cobrados);
                const badge = BADGE_COLORS[pago.tipo_pago] || BADGE_COLORS.Extra;

                return (
                  <tr
                    key={pago.id}
                    className="hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-[var(--text-secondary)] whitespace-nowrap tabular-nums">
                      {pago.fecha_pago}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">
                      {nombre}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {pago.tipo_pago}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[var(--text-primary)] tabular-nums">
                      {formatoMoneda(pago.monto_total)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-rose-500 tabular-nums">
                      {pago.intereses_cobrados > 0 ? formatoMoneda(pago.intereses_cobrados) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--status-success)] tabular-nums">
                      {formatoMoneda(amort)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-muted)] max-w-[150px] truncate">
                      {pago.folio_comprobante || <span className="text-[var(--text-muted)] opacity-60 italic">Sin folio</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setPagoToDelete({ id: pago.id, monto: pago.monto_total })}
                        title="Eliminar registro"
                        aria-label={`Eliminar pago de ${formatoMoneda(pago.monto_total)}`}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all cursor-pointer"
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

      <ConfirmModal
        isOpen={Boolean(pagoToDelete)}
        title="¿Eliminar pago?"
        message={
          pagoToDelete
            ? `¿Estás seguro de eliminar el registro de pago por ${formatoMoneda(pagoToDelete.monto)}? Esta acción recalculará los saldos de tu deuda.`
            : ''
        }
        confirmText="Eliminar pago"
        isDestructive={true}
        onConfirm={() => {
          if (pagoToDelete) {
            deletePago(pagoToDelete.id);
            setPagoToDelete(null);
          }
        }}
        onCancel={() => setPagoToDelete(null)}
      />
    </div>
  );
}
