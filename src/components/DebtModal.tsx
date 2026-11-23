'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { DeudaConSaldoActual } from '@/types';
import {
  X,
  CreditCard,
  Check,
  AlertCircle,
} from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: DeudaConSaldoActual | null;
}

const MESES = [
  { val: 1, name: 'Enero' },
  { val: 2, name: 'Febrero' },
  { val: 3, name: 'Marzo' },
  { val: 4, name: 'Abril' },
  { val: 5, name: 'Mayo' },
  { val: 6, name: 'Junio' },
  { val: 7, name: 'Julio' },
  { val: 8, name: 'Agosto' },
  { val: 9, name: 'Septiembre' },
  { val: 10, name: 'Octubre' },
  { val: 11, name: 'Noviembre' },
  { val: 12, name: 'Diciembre' },
];

function DebtForm({
  onClose,
  debtToEdit,
}: {
  onClose: () => void;
  debtToEdit?: DeudaConSaldoActual | null;
}) {
  const { addDeuda, updateDeuda } = useSnowball();

  const [nombreTarjeta, setNombreTarjeta] = useState(debtToEdit?.nombre_tarjeta || '');
  const [saldoInicial, setSaldoInicial] = useState(debtToEdit?.saldo_inicial ? debtToEdit.saldo_inicial.toString() : '');
  const [tasaAnual, setTasaAnual] = useState(debtToEdit?.tasa_anual_porcentaje ? debtToEdit.tasa_anual_porcentaje.toString() : '');
  const [pagoMinimo, setPagoMinimo] = useState(debtToEdit?.pago_minimo ? debtToEdit.pago_minimo.toString() : '');
  const [costoAnualidad, setCostoAnualidad] = useState((debtToEdit?.costo_anualidad || 0).toString());
  const [mesAnualidad, setMesAnualidad] = useState(debtToEdit?.mes_cobro_anualidad || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nombreTarjeta.trim()) {
      setErrorMessage('Ingresa el nombre de la tarjeta o deuda.');
      return;
    }
    const saldo = parseFloat(saldoInicial) || 0;
    const tasa = parseFloat(tasaAnual) || 0;
    const min = parseFloat(pagoMinimo) || 0;
    const anualidad = parseFloat(costoAnualidad) || 0;

    if (saldo <= 0) {
      setErrorMessage('El saldo inicial debe ser mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (debtToEdit) {
        await updateDeuda({
          ...debtToEdit,
          nombre_tarjeta: nombreTarjeta.trim(),
          saldo_inicial: saldo,
          tasa_anual_porcentaje: tasa,
          pago_minimo: min,
          costo_anualidad: anualidad,
          mes_cobro_anualidad: mesAnualidad,
        });
      } else {
        await addDeuda({
          nombre_tarjeta: nombreTarjeta.trim(),
          saldo_inicial: saldo,
          tasa_anual_porcentaje: tasa,
          pago_minimo: min,
          costo_anualidad: anualidad,
          mes_cobro_anualidad: mesAnualidad,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocurrió un error al guardar la deuda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Nombre de la Tarjeta o Crédito
          </label>
          <input
            type="text"
            placeholder="Ej. BBVA Azul, Liverpool, Préstamo Banamex"
            value={nombreTarjeta}
            onChange={(e) => setNombreTarjeta(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Saldo Inicial ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Tasa Anual de Interés (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="150"
                placeholder="Ej. 45.0"
                value={tasaAnual}
                onChange={(e) => setTasaAnual(e.target.value)}
                required
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
              <span className="absolute right-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Pago Mínimo Requerido Mensual ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={pagoMinimo}
              onChange={(e) => setPagoMinimo(e.target.value)}
              required
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Al liquidarse la deuda, este monto se liberará y alimentará a la siguiente tarjeta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Costo de Anualidad ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={costoAnualidad}
                onChange={(e) => setCostoAnualidad(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Mes Cobro de Anualidad
            </label>
            <select
              value={mesAnualidad}
              onChange={(e) => setMesAnualidad(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              {MESES.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Footer fijo abajo con botones siempre visibles */}
      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white shadow-xs active:scale-95 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? 'Guardando...' : debtToEdit ? 'Actualizar' : 'Guardar Deuda'}
        </button>
      </div>
    </form>
  );
}

export function DebtModal({
  isOpen,
  onClose,
  debtToEdit,
}: DebtModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface-card)] z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                {debtToEdit ? 'Editar Deuda / Tarjeta' : 'Agregar Nueva Deuda'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
                Se ordenará automáticamente por menor saldo en la Bola de Nieve
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            title="Cerrar ventana"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <DebtForm
          key={debtToEdit?.id || 'new-debt-form'}
          onClose={onClose}
          debtToEdit={debtToEdit}
        />
      </div>
    </div>
  );
}
