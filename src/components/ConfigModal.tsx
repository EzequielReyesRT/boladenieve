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
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Pago Extra Mensual */}
      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
        <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-300 font-semibold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4 text-indigo-500" />
          Acelerador Mensual Fijo
        </div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Pago Extra Mensual ($)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
          <input
            type="number"
            step="50"
            min="0"
            placeholder="0.00"
            value={pagoExtra}
            onChange={(e) => setPagoExtra(e.target.value)}
            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Monto adicional que sumas cada mes por encima de todos tus pagos mínimos.
        </p>
      </div>

      {/* Fecha de inicio de proyección */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mes Inicio Simulación
          </label>
          <select
            value={mesInicio}
            onChange={(e) => setMesInicio(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {MESES.map((m) => (
              <option key={m.val} value={m.val}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Año Inicio
          </label>
          <input
            type="number"
            min="2020"
            max="2040"
            value={anioInicio}
            onChange={(e) => setAnioInicio(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Aportación Única Anual */}
      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-3">
        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
          <Gift className="w-4 h-4 text-emerald-500" />
          Inyección Anual (Aguinaldo / Bono Extra)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monto Anual ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                step="100"
                min="0"
                placeholder="0.00"
                value={aportacionAnual}
                onChange={(e) => setAportacionAnual(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mes de Cobro / Aportación
            </label>
            <select
              value={mesAportacion}
              onChange={(e) => setMesAportacion(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MESES.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Se sumará automáticamente a la bola de nieve en ese mes calendario cada año.
        </p>
      </div>

      {/* Botones */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/25 active:scale-95 disabled:opacity-50 transition-all"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Parámetros de la Bola de Nieve
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aceleradores de pago mensual y aportación anual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
