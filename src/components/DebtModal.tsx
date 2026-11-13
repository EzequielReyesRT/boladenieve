'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { DeudaConSaldoActual } from '@/types';
import {
  X,
  CreditCard,
  Check,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreTarjeta.trim()) {
      alert('Ingresa el nombre de la tarjeta o deuda');
      return;
    }
    const saldo = parseFloat(saldoInicial) || 0;
    const tasa = parseFloat(tasaAnual) || 0;
    const min = parseFloat(pagoMinimo) || 0;
    const anualidad = parseFloat(costoAnualidad) || 0;

    if (saldo <= 0) {
      alert('El saldo inicial debe ser mayor a cero');
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
      alert('Error al guardar la deuda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Nombre de la Tarjeta o Crédito
        </label>
        <input
          type="text"
          placeholder="Ej. BBVA Azul, Liverpool, Préstamo Banamex"
          value={nombreTarjeta}
          onChange={(e) => setNombreTarjeta(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Saldo Inicial ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              required
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
              className="w-full pl-3.5 pr-8 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Pago Mínimo Requerido Mensual ($)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={pagoMinimo}
            onChange={(e) => setPagoMinimo(e.target.value)}
            required
            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Al liquidarse la deuda, este monto se liberará y alimentará a la siguiente tarjeta.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Costo de Anualidad ($)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={costoAnualidad}
              onChange={(e) => setCostoAnualidad(e.target.value)}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mes Cobro de Anualidad
          </label>
          <select
            value={mesAnualidad}
            onChange={(e) => setMesAnualidad(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MESES.map((m) => (
              <option key={m.val} value={m.val}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
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
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 transition-all"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {debtToEdit ? 'Editar Deuda / Tarjeta' : 'Agregar Nueva Deuda'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se ordenará automáticamente por menor saldo en la Bola de Nieve
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

        <DebtForm
          key={debtToEdit?.id || 'new-debt-form'}
          onClose={onClose}
          debtToEdit={debtToEdit}
        />
      </div>
    </div>
  );
}
