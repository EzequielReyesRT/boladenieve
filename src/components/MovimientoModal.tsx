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
  AlertCircle,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoriasActuales =
    tipo === 'Ingreso' ? CATEGORIAS_INGRESOS : CATEGORIAS_GASTOS;

  const handleTipoChange = (nuevoTipo: TipoMovimiento) => {
    setTipo(nuevoTipo);
    setErrorMessage(null);
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
    setErrorMessage(null);
    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMessage('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (!descripcion.trim()) {
      setErrorMessage('Por favor ingresa una breve descripción.');
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
      setErrorMessage('Ocurrió un error al guardar el movimiento.');
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
        {/* Switcher Ingreso / Gasto */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => handleTipoChange('Ingreso')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
              tipo === 'Ingreso'
                ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Ingreso (+)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTipoChange('Gasto')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              tipo === 'Gasto'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Gasto (-)</span>
          </button>
        </div>

        {/* Monto y Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Monto ($)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[var(--text-muted)] font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                autoFocus
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-bold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Fecha</span>
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] font-medium"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Categoría</span>
          </label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] font-medium"
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
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 ${
                  categoria === cat
                    ? tipo === 'Ingreso'
                      ? 'bg-[var(--brand-surface)] border-[var(--brand-border)] text-[var(--brand-text)] font-semibold'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-semibold'
                    : 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          />
        </div>

        {/* Es Recurrente */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] select-none">
            <input
              type="checkbox"
              checked={esRecurrente}
              onChange={(e) => setEsRecurrente(e.target.checked)}
              className="rounded border-[var(--border-subtle)] text-[var(--brand-primary)] focus-visible:ring-[var(--brand-primary)] w-4 h-4"
            />
            <Repeat className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Movimiento recurrente fijo (mensual / quincenal)</span>
          </label>
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
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-xs active:scale-95 disabled:opacity-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            tipo === 'Ingreso'
              ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] focus-visible:ring-[var(--brand-primary)]'
              : 'bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-500'
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
              <PlusCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                {movimientoToEdit ? 'Editar Movimiento' : 'Registrar Ingreso o Gasto'}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
                Flujo de caja para determinar tu excedente de Bola de Nieve
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
