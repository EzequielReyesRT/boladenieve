'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { MovimientoFlujo, TipoMovimiento } from '@/types';
import {
  X,
  PlusCircle,
  Check,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  Calendar,
  FileText,
  DollarSign,
  Repeat,
} from 'lucide-react';

interface MovimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimientoToEdit?: MovimientoFlujo | null;
  defaultTipo?: TipoMovimiento;
}

const CATEGORIAS_INGRESOS = [
  'Nómina / Sueldo',
  'Negocio / Ventas',
  'Bono / Aguinaldo',
  'Rendimientos / Inversión',
  'Horas Extras',
  'Devolución',
  'Otro Ingreso',
];

const CATEGORIAS_GASTOS = [
  'Vivienda / Renta',
  'Servicios (Luz, Agua, Net)',
  'Alimentación / Despensa',
  'Transporte / Gasolina',
  'Salud / Medicinas',
  'Educación',
  'Entretenimiento / Ocio',
  'Ropa / Cuidado Personal',
  'Mascotas',
  'Mantenimiento / Hogar',
  'Otro Gasto',
];

function MovimientoForm({
  onClose,
  movimientoToEdit,
  defaultTipo = 'Ingreso',
}: {
  onClose: () => void;
  movimientoToEdit?: MovimientoFlujo | null;
  defaultTipo?: TipoMovimiento;
}) {
  const { addMovimientoFlujo, updateMovimientoFlujo } = useSnowball();

  const [tipo, setTipo] = useState<TipoMovimiento>(
    movimientoToEdit?.tipo || defaultTipo
  );
  const [monto, setMonto] = useState<string>(
    movimientoToEdit ? movimientoToEdit.monto.toString() : ''
  );
  const [categoria, setCategoria] = useState<string>(
    movimientoToEdit?.categoria ||
      (movimientoToEdit?.tipo === 'Gasto' || defaultTipo === 'Gasto'
        ? CATEGORIAS_GASTOS[0]
        : CATEGORIAS_INGRESOS[0])
  );
  const [descripcion, setDescripcion] = useState<string>(
    movimientoToEdit?.descripcion || ''
  );
  const [fecha, setFecha] = useState<string>(
    movimientoToEdit?.fecha || new Date().toISOString().split('T')[0]
  );
  const [esRecurrente, setEsRecurrente] = useState<boolean>(
    movimientoToEdit?.es_recurrente || false
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const categoriasActuales =
    tipo === 'Ingreso' ? CATEGORIAS_INGRESOS : CATEGORIAS_GASTOS;

  const handleTipoChange = (nuevoTipo: TipoMovimiento) => {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'Ingreso') {
      if (!CATEGORIAS_INGRESOS.includes(categoria)) {
        setCategoria(CATEGORIAS_INGRESOS[0]);
      }
    } else {
      if (!CATEGORIAS_GASTOS.includes(categoria)) {
        setCategoria(CATEGORIAS_GASTOS[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!descripcion.trim()) {
      alert('Por favor ingresa una breve descripción.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (movimientoToEdit) {
        await updateMovimientoFlujo({
          ...movimientoToEdit,
          tipo,
          categoria,
          descripcion: descripcion.trim(),
          monto: montoNum,
          fecha,
          es_recurrente: esRecurrente,
        });
      } else {
        await addMovimientoFlujo({
          tipo,
          categoria,
          descripcion: descripcion.trim(),
          monto: montoNum,
          fecha,
          es_recurrente: esRecurrente,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Switcher Ingreso / Gasto */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => handleTipoChange('Ingreso')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tipo === 'Ingreso'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Ingreso (+)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTipoChange('Gasto')}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tipo === 'Gasto'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Gasto (-)</span>
        </button>
      </div>

      {/* Monto y Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Monto ($)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              autoFocus
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Fecha</span>
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Categoría</span>
        </label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          {categoriasActuales.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Chips de acceso rápido */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {categoriasActuales.slice(0, 4).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoria(cat)}
              className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                categoria === cat
                  ? tipo === 'Ingreso'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Descripción</span>
        </label>
        <input
          type="text"
          placeholder={
            tipo === 'Ingreso'
              ? 'Ej. Sueldo primera quincena, Venta en tienda...'
              : 'Ej. Renta departamento, Despensa de la semana, Pago de CFE...'
          }
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Es Recurrente */}
      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white select-none">
          <input
            type="checkbox"
            checked={esRecurrente}
            onChange={(e) => setEsRecurrente(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/30 w-4 h-4"
          />
          <Repeat className="w-3.5 h-3.5 text-slate-400" />
          <span>Movimiento recurrente fijo (mensual / quincenal)</span>
        </label>
      </div>

      {/* Botones */}
      <div className="pt-3 flex items-center justify-end gap-2.5">
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
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg active:scale-95 disabled:opacity-50 transition-all ${
            tipo === 'Ingreso'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
          }`}
        >
          <Check className="w-4 h-4" />
          {isSubmitting
            ? 'Guardando...'
            : movimientoToEdit
            ? 'Actualizar'
            : tipo === 'Ingreso'
            ? 'Guardar Ingreso'
            : 'Guardar Gasto'}
        </button>
      </div>
    </form>
  );
}

export function MovimientoModal({
  isOpen,
  onClose,
  movimientoToEdit,
  defaultTipo = 'Ingreso',
}: MovimientoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {movimientoToEdit ? 'Editar Movimiento' : 'Registrar Ingreso o Gasto'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Flujo de caja para determinar tu excedente de Bola de Nieve
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

        <MovimientoForm
          key={movimientoToEdit?.id || `new-${defaultTipo}`}
          onClose={onClose}
          movimientoToEdit={movimientoToEdit}
          defaultTipo={defaultTipo}
        />
      </div>
    </div>
  );
}
