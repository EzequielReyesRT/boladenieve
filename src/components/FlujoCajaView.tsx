'use client';

import React, { useState, useMemo } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { MovimientoFlujo, TipoMovimiento } from '@/types';
import { formatoMoneda } from '@/lib/snowball-engine';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Sparkles,
  PlusCircle,
  MinusCircle,
  Search,
  Calendar,
  Trash2,
  Edit2,
  Zap,
  ArrowRight,
  Repeat,
  Scale,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface FlujoCajaViewProps {
  onOpenNewMovimiento: (tipo?: TipoMovimiento) => void;
  onEditMovimiento: (mov: MovimientoFlujo) => void;
  onOpenPaymentModalWithSurplus: (monto: number) => void;
}

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function FlujoCajaView({
  onOpenNewMovimiento,
  onEditMovimiento,
  onOpenPaymentModalWithSurplus,
}: FlujoCajaViewProps) {
  const {
    movimientosFlujo,
    deleteMovimientoFlujo,
    deudasConSaldo,
  } = useSnowball();

  // Fecha seleccionada para filtros (inicializada estática y sincronizada en cliente para evitar new Date() en prerender)
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(11);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(2026);
  const [movimientoToDelete, setMovimientoToDelete] = useState<{ id: string; descripcion: string; esAbonoTarjeta: boolean } | null>(null);

  React.useEffect(() => {
    const hoy = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sincronizacion de fecha en cliente para Next.js 16 prerender
    setMesSeleccionado(hoy.getMonth() + 1);
    setAnioSeleccionado(hoy.getFullYear());
  }, []);

  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Ingreso' | 'Gasto'>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // 1. Filtrar movimientos por mes y año
  const movimientosDelMes = useMemo(() => {
    return movimientosFlujo.filter((m) => {
      if (!m.fecha) return false;
      const [anioStr, mesStr] = m.fecha.split('-');
      const anio = parseInt(anioStr, 10);
      const mes = parseInt(mesStr, 10);
      return anio === anioSeleccionado && mes === mesSeleccionado;
    });
  }, [movimientosFlujo, mesSeleccionado, anioSeleccionado]);

  // 2. Cálculos financieros del mes
  const totalIngresos = useMemo(() => {
    return movimientosDelMes
      .filter((m) => m.tipo === 'Ingreso')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientosDelMes]);

  // Gastos de vida (sin incluir abonos a tarjetas)
  const gastosVida = useMemo(() => {
    return movimientosDelMes
      .filter((m) => m.tipo === 'Gasto' && m.categoria !== 'Pago de Tarjeta / Crédito')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientosDelMes]);

  // Abonos reales realizados a tarjetas este mes (generados por la bitácora)
  const pagosRealesTarjetas = useMemo(() => {
    return movimientosDelMes
      .filter((m) => m.tipo === 'Gasto' && m.categoria === 'Pago de Tarjeta / Crédito')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientosDelMes]);

  // Total gastado en el mes (Vida + Abonos a Tarjetas)
  const totalGastos = gastosVida + pagosRealesTarjetas;

  // Compromiso total de pagos mínimos presupuestados
  const compromisoMinimosDeuda = useMemo(() => {
    return deudasConSaldo
      .filter((d) => !d.esta_liquidada)
      .reduce((sum, d) => sum + Number(d.pago_minimo || 0), 0);
  }, [deudasConSaldo]);

  // Flujo libre restante para inyectar a Bola de Nieve (Ingresos - GastosVida - Mayor entre mínimos y lo ya pagado)
  const flujoNetoExcedente =
    totalIngresos - gastosVida - Math.max(compromisoMinimosDeuda, pagosRealesTarjetas);

  // Porcentajes para la barra de distribución
  const pctGastosVida = totalIngresos > 0 ? Math.min(100, Math.round((gastosVida / totalIngresos) * 100)) : 0;
  const pctTarjetas = totalIngresos > 0 ? Math.min(100, Math.round((Math.max(compromisoMinimosDeuda, pagosRealesTarjetas) / totalIngresos) * 100)) : 0;
  const pctExcedente = totalIngresos > 0 ? Math.max(0, 100 - pctGastosVida - pctTarjetas) : 0;

  // Deuda objetivo #1 actual (Foco Bola de Nieve)
  const deudaObjetivoActual = deudasConSaldo.find((d) => !d.esta_liquidada);

  // 3. Filtrar por tipo y búsqueda
  const movimientosFiltrados = useMemo(() => {
    return movimientosDelMes.filter((m) => {
      const coincideTipo = filtroTipo === 'Todos' || m.tipo === filtroTipo;
      const coincideBusqueda =
        !busqueda ||
        m.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.categoria.toLowerCase().includes(busqueda.toLowerCase());
      return coincideTipo && coincideBusqueda;
    });
  }, [movimientosDelMes, filtroTipo, busqueda]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-[var(--surface-card)] border border-slate-800 dark:border-[var(--border-subtle)] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-surface)] border border-[var(--brand-border)] text-[var(--brand-text)] text-xs font-bold tracking-wide uppercase mb-3">
              <Scale className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Presupuesto y Flujo de Caja</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white dark:text-[var(--text-primary)] tracking-tight">
              Ingresos, Gastos y Excedente
            </h1>
            <p className="text-sm text-slate-300 dark:text-[var(--text-secondary)] max-w-2xl mt-1 leading-relaxed">
              Tu flujo de caja determina cuánto dinero libre tienes cada mes para acelerar la liquidación de tus tarjetas en cascada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenNewMovimiento('Ingreso')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-success)] hover:bg-[var(--status-success-hover)] text-white text-xs font-bold shadow-xs active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-success)] focus-visible:ring-offset-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Ingreso</span>
            </button>

            <button
              onClick={() => onOpenNewMovimiento('Gasto')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Selector de Período (Mes y Año) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--brand-primary)]" />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Período:
          </span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            {NOMBRES_MESES.map((nombre, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {nombre}
              </option>
            ))}
          </select>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          <span>Movimientos registrados en {NOMBRES_MESES[mesSeleccionado - 1]}: </span>
          <strong className="text-[var(--text-primary)] tabular-nums">{movimientosDelMes.length}</strong>
        </div>
      </div>

      {/* 3. Cuatro Widgets Clave de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingresos Totales */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total Ingresos
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--status-success-surface)] text-[var(--status-success)] border border-[var(--status-success-border)] flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--status-success)] tracking-tight tabular-nums">
            {formatoMoneda(totalIngresos)}
          </div>
          <p className="mt-1 text-xs text-[var(--status-success-text)] flex items-center gap-1 font-semibold">
            <span>Entrada total del mes</span>
          </p>
        </div>

        {/* Card 2: Gastos Totales */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Gastos del Mes
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">
            {formatoMoneda(totalGastos)}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)] font-medium tabular-nums">
            {pagosRealesTarjetas > 0
              ? `Vida: ${formatoMoneda(gastosVida)} • Tarjetas: ${formatoMoneda(pagosRealesTarjetas)}`
              : `Renta, despensa, etc. (${pctGastosVida}% del ingreso)`}
          </p>
        </div>

        {/* Card 3: Compromiso Mínimo de Deudas */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Mínimos de Tarjetas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight tabular-nums">
            {formatoMoneda(compromisoMinimosDeuda)}
          </div>
          <p className="mt-1 text-xs font-semibold tabular-nums">
            {pagosRealesTarjetas >= compromisoMinimosDeuda && compromisoMinimosDeuda > 0 ? (
              <span className="text-[var(--status-success)]">
                ✓ Mínimos cubiertos ({formatoMoneda(pagosRealesTarjetas)} pagados)
              </span>
            ) : pagosRealesTarjetas > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                Cubierto: {formatoMoneda(pagosRealesTarjetas)} (Faltan {formatoMoneda(compromisoMinimosDeuda - pagosRealesTarjetas)})
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400">
                {deudasConSaldo.filter((d) => !d.esta_liquidada).length} tarjetas activas
              </span>
            )}
          </p>
        </div>

        {/* Card 4: Flujo Libre / Excedente Bola de Nieve */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 shadow-xs border ${
            flujoNetoExcedente > 0
              ? 'bg-[var(--status-success-surface)] border-[var(--status-success-border)]'
              : 'bg-[var(--surface-card)] border-[var(--border-subtle)]'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                flujoNetoExcedente > 0 ? 'text-[var(--status-success-text)]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Excedente Libre</span>
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                flujoNetoExcedente > 0
                  ? 'bg-[var(--status-success-surface)] text-[var(--status-success)] border border-[var(--status-success-border)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tracking-tight tabular-nums ${
              flujoNetoExcedente > 0
                ? 'text-[var(--status-success)]'
                : flujoNetoExcedente === 0
                ? 'text-[var(--text-primary)]'
                : 'text-rose-500'
            }`}
          >
            {formatoMoneda(flujoNetoExcedente)}
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)] font-medium">
            {flujoNetoExcedente > 0
              ? '¡Dinero listo para amortizar deudas!'
              : totalIngresos === 0
              ? 'Registra tus ingresos del mes'
              : 'Gastos superan ingresos'}
          </p>

          {/* Botón rápido para inyectar a la deuda #1 */}
          {flujoNetoExcedente > 0 && deudaObjetivoActual && (
            <button
              onClick={() => onOpenPaymentModalWithSurplus(flujoNetoExcedente)}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] active:scale-95 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <span>Abonar a {deudaObjetivoActual.nombre_tarjeta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Barra de Distribución del Ingreso */}
      {totalIngresos > 0 && (
        <div className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)]">
              Distribución de tu Ingreso Mensual (<span className="tabular-nums">{formatoMoneda(totalIngresos)}</span>)
            </span>
            <span className="text-[var(--text-muted)] font-medium">
              Tasa de ahorro/excedente: <strong className="text-[var(--brand-primary)] tabular-nums">{pctExcedente}%</strong>
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] overflow-hidden flex">
            {/* Gastos de Vida */}
            <div
              style={{ width: `${pctGastosVida}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Gastos de Vida: ${pctGastosVida}%`}
            />
            {/* Tarjetas y Deudas */}
            <div
              style={{ width: `${pctTarjetas}%` }}
              className="bg-indigo-500 h-full transition-all duration-500"
              title={`Tarjetas y Deudas: ${pctTarjetas}%`}
            />
            {/* Excedente Libre */}
            <div
              style={{ width: `${pctExcedente}%` }}
              className="bg-[var(--brand-primary)] h-full transition-all duration-500"
              title={`Excedente libre: ${pctExcedente}%`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[var(--text-secondary)]">
                Gastos de Vida: <strong className="tabular-nums">{pctGastosVida}%</strong> (<span className="tabular-nums">{formatoMoneda(gastosVida)}</span>)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-[var(--text-secondary)]">
                Abonos a Tarjetas: <strong className="tabular-nums">{pctTarjetas}%</strong> (<span className="tabular-nums">{formatoMoneda(pagosRealesTarjetas)}</span>)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />
              <span className="text-[var(--text-secondary)]">
                Excedente Libre: <strong className="tabular-nums">{pctExcedente}%</strong> (<span className="tabular-nums">{formatoMoneda(Math.max(0, flujoNetoExcedente))}</span>)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tabla / Lista de Movimientos */}
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs overflow-hidden">
        {/* Controles de filtro y búsqueda */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs Todos / Ingresos / Gastos */}
          <div className="flex p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] w-full sm:w-auto">
            {(['Todos', 'Ingreso', 'Gasto'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  filtroTipo === tipo
                    ? tipo === 'Ingreso'
                      ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                      : tipo === 'Gasto'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]'
                }`}
              >
                {tipo === 'Todos' ? 'Todos los Movimientos' : `${tipo}s`}
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            />
          </div>
        </div>

        {/* Lista o Tabla de Movimientos */}
        {movimientosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              No hay movimientos en este período
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 leading-relaxed">
              Comienza registrando tu nómina, ventas o gastos de vivienda para calcular tu excedente disponible.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenNewMovimiento('Ingreso')}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
              >
                + Registrar Ingreso
              </button>
              <button
                onClick={() => onOpenNewMovimiento('Gasto')}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95"
              >
                + Registrar Gasto
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {movimientosFiltrados.map((mov) => {
              const esIngreso = mov.tipo === 'Ingreso';
              const esAbonoTarjeta =
                mov.categoria === 'Pago de Tarjeta / Crédito' || mov.id.startsWith('flujo-pago-');

              return (
                <div
                  key={mov.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[var(--surface-subtle)] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        esIngreso
                          ? 'bg-[var(--status-success-surface)] text-[var(--status-success)] border border-[var(--status-success-border)]'
                          : esAbonoTarjeta
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : esAbonoTarjeta ? (
                        <CreditCard className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {mov.descripcion}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            esIngreso
                              ? 'bg-[var(--status-success-surface)] text-[var(--status-success-text)] border border-[var(--status-success-border)]'
                              : esAbonoTarjeta
                              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {esAbonoTarjeta && <CreditCard className="w-2.5 h-2.5" />}
                          {mov.categoria}
                        </span>
                        {esAbonoTarjeta && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Bitácora
                          </span>
                        )}
                        {mov.es_recurrente && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>Fijo</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                        {mov.fecha}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold tabular-nums ${
                          esIngreso
                            ? 'text-[var(--status-success)]'
                            : esAbonoTarjeta
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {esIngreso ? '+' : '-'} {formatoMoneda(mov.monto)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {esAbonoTarjeta ? (
                        <span
                          title="Registrado automáticamente desde la Bitácora de Pagos. Se administra desde la pestaña Pagos y Deudas."
                          className="p-1.5 rounded-lg text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          onClick={() => onEditMovimiento(mov)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
                          title="Editar movimiento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setMovimientoToDelete({
                            id: mov.id,
                            descripcion: mov.descripcion,
                            esAbonoTarjeta,
                          })
                        }
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 cursor-pointer"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(movimientoToDelete)}
        title="¿Eliminar movimiento?"
        message={
          movimientoToDelete?.esAbonoTarjeta
            ? `Este movimiento proviene de un abono a tarjeta registrado en la Bitácora.\n\n¿Deseas eliminarlo de Flujo de Caja? (Nota: para revertir el saldo de la deuda, se recomienda eliminarlo desde la Bitácora de Pagos).`
            : `¿Estás seguro de eliminar el movimiento "${movimientoToDelete?.descripcion}"? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar movimiento"
        isDestructive={true}
        onConfirm={() => {
          if (movimientoToDelete) {
            deleteMovimientoFlujo(movimientoToDelete.id);
            setMovimientoToDelete(null);
          }
        }}
        onCancel={() => setMovimientoToDelete(null)}
      />
    </div>
  );
}
