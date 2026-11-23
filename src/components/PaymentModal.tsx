'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { DeudaConSaldoActual, TipoPago } from '@/types';
import { formatoMoneda } from '@/lib/snowball-engine';
import {
  X,
  PlusCircle,
  Check,
  Sparkles,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDebt?: DeudaConSaldoActual | null;
}

const TIPOS_PAGO: { value: TipoPago; label: string }[] = [
  { value: 'Minimo', label: 'Pago Mínimo (Autocompletar)' },
  { value: 'Extra', label: 'Pago Extra (Acelerador Bola de Nieve)' },
  { value: 'Liquidacion', label: 'Liquidación Total' },
  { value: 'Anualidad', label: 'Pago de Anualidad' },
];

function PaymentForm({
  onClose,
  preselectedDebt,
}: {
  onClose: () => void;
  preselectedDebt?: DeudaConSaldoActual | null;
}) {
  const { deudasConSaldo, addPago } = useSnowball();

  const defaultDeuda =
    preselectedDebt ||
    deudasConSaldo.find((d) => !d.esta_liquidada) ||
    deudasConSaldo[0];

  const defaultDeudaId = defaultDeuda?.id || '';

  // Por defecto, inicializamos en 'Minimo' y cargamos el pago mínimo guardado
  const defaultMonto =
    defaultDeuda && defaultDeuda.pago_minimo > 0
      ? defaultDeuda.pago_minimo.toString()
      : '';

  const [deudaId, setDeudaId] = useState<string>(defaultDeudaId);
  const [fechaPago, setFechaPago] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [tipoPago, setTipoPago] = useState<TipoPago>('Minimo');
  const [montoTotal, setMontoTotal] = useState<string>(defaultMonto);
  const [interesesCobrados, setInteresesCobrados] = useState<string>('0');
  const [folioComprobante, setFolioComprobante] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const deudaSeleccionada = deudasConSaldo.find((d) => d.id === deudaId);

  // Al cambiar la tarjeta/deuda seleccionada
  const handleDeudaChange = (newDeudaId: string) => {
    setDeudaId(newDeudaId);
    const deuda = deudasConSaldo.find((d) => d.id === newDeudaId);
    if (!deuda) return;

    if (tipoPago === 'Minimo') {
      setMontoTotal(deuda.pago_minimo > 0 ? deuda.pago_minimo.toString() : '');
    } else if (tipoPago === 'Liquidacion') {
      setMontoTotal(deuda.saldo_actual > 0 ? deuda.saldo_actual.toString() : '');
    } else if (tipoPago === 'Anualidad') {
      setMontoTotal(deuda.costo_anualidad > 0 ? deuda.costo_anualidad.toString() : '');
    }
  };

  // Al cambiar el tipo de pago
  const handleTipoPagoChange = (newTipo: TipoPago) => {
    setTipoPago(newTipo);
    const deuda = deudasConSaldo.find((d) => d.id === deudaId);
    if (!deuda) return;

    if (newTipo === 'Minimo') {
      // Auto-llenado inmediato con el pago mínimo guardado de la deuda
      setMontoTotal(deuda.pago_minimo > 0 ? deuda.pago_minimo.toString() : '');
    } else if (newTipo === 'Liquidacion') {
      // Auto-llenado con el saldo total pendiente
      setMontoTotal(deuda.saldo_actual > 0 ? deuda.saldo_actual.toString() : '');
    } else if (newTipo === 'Anualidad') {
      // Auto-llenado con el costo de anualidad guardado
      setMontoTotal(deuda.costo_anualidad > 0 ? deuda.costo_anualidad.toString() : '');
    }
  };

  const montoNum = parseFloat(montoTotal) || 0;
  const interesesNum = parseFloat(interesesCobrados) || 0;
  const amortizacionCapital = Math.max(0, montoNum - interesesNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deudaId) {
      alert('Por favor selecciona una tarjeta o deuda.');
      return;
    }
    if (montoNum <= 0) {
      alert('El monto del pago debe ser mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPago({
        deuda_id: deudaId,
        fecha_pago: fechaPago,
        tipo_pago: tipoPago,
        monto_total: montoNum,
        intereses_cobrados: interesesNum,
        folio_comprobante: folioComprobante.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Contenido scrolleable para celulares y pantallas pequeñas */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        {/* Tarjeta destino */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Tarjeta / Deuda Destino
          </label>
          <div className="relative">
            <select
              value={deudaId}
              onChange={(e) => handleDeudaChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] font-medium"
            >
              {deudasConSaldo.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre_tarjeta} — Saldo: {formatoMoneda(d.saldo_actual)} | Pago Mín: {formatoMoneda(d.pago_minimo)}{' '}
                  {d.esta_liquidada ? '(Liquidada)' : ''}
                </option>
              ))}
            </select>
          </div>
          {deudaSeleccionada && (
            <p className="mt-1 text-xs text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
              <span>Saldo pendiente:</span>
              <span className="font-semibold text-rose-500 tabular-nums">{formatoMoneda(deudaSeleccionada.saldo_actual)}</span>
              <span>•</span>
              <span>Pago mín guardado:</span>
              <span className="font-semibold text-[var(--brand-primary)] tabular-nums">{formatoMoneda(deudaSeleccionada.pago_minimo)}</span>
              {deudaSeleccionada.costo_anualidad > 0 && (
                <>
                  <span>•</span>
                  <span>Anualidad:</span>
                  <span className="font-semibold text-[var(--text-secondary)] tabular-nums">{formatoMoneda(deudaSeleccionada.costo_anualidad)}</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Fecha y Tipo de Pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Fecha de Pago
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Tipo de Pago
            </label>
            <select
              value={tipoPago}
              onChange={(e) => handleTipoPagoChange(e.target.value as TipoPago)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] font-semibold"
            >
              {TIPOS_PAGO.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Montos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                Monto Total Pagado ($)
              </label>
              {tipoPago === 'Minimo' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--brand-text)] bg-[var(--brand-surface)] px-1.5 py-0.5 rounded border border-[var(--brand-border)]">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--brand-primary)]" />
                  Auto-mínimo
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
            </div>

            {/* Accesos rápidos de monto */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {deudaSeleccionada && deudaSeleccionada.pago_minimo > 0 && (
                <button
                  type="button"
                  onClick={() => handleTipoPagoChange('Minimo')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 ${
                    tipoPago === 'Minimo' && montoTotal === deudaSeleccionada.pago_minimo.toString()
                      ? 'bg-[var(--brand-surface)] border-[var(--brand-border)] text-[var(--brand-text)] font-bold'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                  }`}
                  title="Cargar pago mínimo guardado"
                >
                  Pago Mínimo: <span className="tabular-nums">{formatoMoneda(deudaSeleccionada.pago_minimo)}</span>
                </button>
              )}
              {deudaSeleccionada && deudaSeleccionada.saldo_actual > 0 && (
                <button
                  type="button"
                  onClick={() => handleTipoPagoChange('Liquidacion')}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 ${
                    tipoPago === 'Liquidacion' && montoTotal === deudaSeleccionada.saldo_actual.toString()
                      ? 'bg-[var(--brand-surface)] border-[var(--brand-border)] text-[var(--brand-text)] font-bold'
                      : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                  }`}
                  title="Cargar saldo restante total"
                >
                  Liquidar: <span className="tabular-nums">{formatoMoneda(deudaSeleccionada.saldo_actual)}</span>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Intereses Cobrados ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={interesesCobrados}
                onChange={(e) => setInteresesCobrados(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Se descuenta del pago para calcular la amortización a capital.
            </p>
          </div>
        </div>

        {/* Aviso de confirmación de autocompletado */}
        {tipoPago === 'Minimo' && deudaSeleccionada && deudaSeleccionada.pago_minimo > 0 && (
          <div className="p-2.5 rounded-xl bg-[var(--brand-surface)] border border-[var(--brand-border)] text-xs text-[var(--brand-text)] flex items-center gap-2">
            <Check className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
            <span>
              Monto llenado con el pago mínimo guardado de <strong>{deudaSeleccionada.nombre_tarjeta}</strong> (<span className="tabular-nums">{formatoMoneda(deudaSeleccionada.pago_minimo)}</span>).
            </span>
          </div>
        )}

        {/* Amortización Desglose */}
        <div className="p-3.5 rounded-xl bg-[var(--brand-surface)] border border-[var(--brand-border)] text-xs flex items-center justify-between">
          <span className="font-semibold text-[var(--brand-text)]">
            Amortización directa a capital:
          </span>
          <span className="font-extrabold text-sm text-[var(--brand-primary)] tabular-nums">
            {formatoMoneda(amortizacionCapital)}
          </span>
        </div>

        {/* Folio */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Folio de Comprobante / Referencia (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. SPEI-984021 o Núm de autorización"
            value={folioComprobante}
            onChange={(e) => setFolioComprobante(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          />
        </div>
      </div>

      {/* Footer fijo con botones siempre visibles en celular y escritorio */}
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
          {isSubmitting ? 'Guardando...' : 'Guardar Pago'}
        </button>
      </div>
    </form>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  preselectedDebt,
}: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xl flex flex-col max-h-[90dvh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-200">
        {/* Header fijo siempre visible arriba con botón de cerrar */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface-card)] z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                Registrar Pago en Bitácora
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
                Afecta directamente el saldo actual y la proyección
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

        <PaymentForm
          key={preselectedDebt?.id || 'default-payment-form'}
          onClose={onClose}
          preselectedDebt={preselectedDebt}
        />
      </div>
    </div>
  );
}
