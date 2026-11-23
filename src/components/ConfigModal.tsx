'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import {
  X,
  Settings,
  Zap,
  Gift,
  Check,
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
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

function ConfigForm({ onClose }: { onClose: () => void }) {
  const { config, updateConfig } = useSnowball();

  const [pagoExtra, setPagoExtra] = useState(config.pago_extra_mensual.toString());
  const [mesInicio, setMesInicio] = useState(config.mes_calendario_inicio || 1);
  const [anioInicio, setAnioInicio] = useState(config.anio_inicio || new Date().getFullYear());
  const [aportacionAnual, setAportacionAnual] = useState((config.aportacion_unica_anual || 0).toString());
  const [mesAportacion, setMesAportacion] = useState(config.mes_aportacion_unica || 12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateConfig({
        pago_extra_mensual: parseFloat(pagoExtra) || 0,
        mes_calendario_inicio: mesInicio,
        anio_inicio: anioInicio,
        aportacion_unica_anual: parseFloat(aportacionAnual) || 0,
        mes_aportacion_unica: mesAportacion,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la configuración');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
        {/* Pago Extra Mensual */}
        <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4 text-indigo-500" />
            Acelerador Mensual Fijo
          </div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Pago Extra Mensual ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
            <input
              type="number"
              step="50"
              min="0"
              placeholder="0.00"
              value={pagoExtra}
              onChange={(e) => setPagoExtra(e.target.value)}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Monto adicional que sumas cada mes por encima de todos tus pagos mínimos.
          </p>
        </div>

        {/* Fecha de inicio de proyección */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Mes Inicio Simulación
            </label>
            <select
              value={mesInicio}
              onChange={(e) => setMesInicio(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              {MESES.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Año Inicio
            </label>
            <input
              type="number"
              min="2020"
              max="2040"
              value={anioInicio}
              onChange={(e) => setAnioInicio(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
            />
          </div>
        </div>

        {/* Aportación Única Anual */}
        <div className="p-4 rounded-xl bg-[var(--brand-surface)] border border-[var(--brand-border)] space-y-3">
          <div className="flex items-center gap-2 text-[var(--brand-text)] font-semibold text-xs uppercase tracking-wider">
            <Gift className="w-4 h-4 text-[var(--brand-primary)]" />
            Inyección Anual (Aguinaldo / Bono Extra)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Monto Anual ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  placeholder="0.00"
                  value={aportacionAnual}
                  onChange={(e) => setAportacionAnual(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Mes de Cobro / Aportación
              </label>
              <select
                value={mesAportacion}
                onChange={(e) => setMesAportacion(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              >
                {MESES.map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-[var(--brand-text)] opacity-90">
            Se sumará automáticamente a la bola de nieve en ese mes calendario cada año.
          </p>
        </div>
      </div>

      {/* Footer fijo con botones */}
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
          {isSubmitting ? 'Guardando...' : 'Aplicar Configuración'}
        </button>
      </div>
    </form>
  );
}

export function ConfigModal({ isOpen, onClose }: ConfigModalProps) {
  const { config } = useSnowball();
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
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                Parámetros de la Bola de Nieve
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
                Aceleradores de pago mensual y aportación anual
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

        <ConfigForm
          key={`config-form-${config.pago_extra_mensual}-${config.mes_calendario_inicio}`}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
