'use client';

import React, { useState, useMemo } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { MovimientoFlujo, TipoMovimiento, DeudaConSaldoActual } from '@/types';
import { formatoMoneda } from '@/lib/snowball-engine';
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Sparkles,
  Plus,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  TrendingUp,
  Zap,
  ArrowRight,
  Repeat,
  Scale,
} from 'lucide-react';

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
    simulacion,
  } = useSnowball();

  // Fecha seleccionada para filtros (inicializada estática para compatibilidad con SSR)
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(11);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(2026);

  React.useEffect(() => {
    const hoy = new Date();
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

  const totalGastos = useMemo(() => {
    return movimientosDelMes
      .filter((m) => m.tipo === 'Gasto')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);
  }, [movimientosDelMes]);

  // Compromiso de pagos mínimos de las tarjetas activas
  const compromisoMinimosDeuda = useMemo(() => {
    return deudasConSaldo
      .filter((d) => !d.esta_liquidada)
      .reduce((sum, d) => sum + Number(d.pago_minimo || 0), 0);
  }, [deudasConSaldo]);

  // Flujo libre restante para inyectar a Bola de Nieve
  const flujoNetoExcedente = totalIngresos - totalGastos - compromisoMinimosDeuda;

  // Porcentajes para la barra de distribución
  const pctGastos = totalIngresos > 0 ? Math.min(100, Math.round((totalGastos / totalIngresos) * 100)) : 0;
  const pctMinimos = totalIngresos > 0 ? Math.min(100, Math.round((compromisoMinimosDeuda / totalIngresos) * 100)) : 0;
  const pctExcedente = totalIngresos > 0 ? Math.max(0, 100 - pctGastos - pctMinimos) : 0;

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-3">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Presupuesto y Flujo de Caja</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ingresos, Gastos y Excedente
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Tu flujo de caja determina cuánto dinero libre tienes cada mes para acelerar la liquidación de tus tarjetas en cascada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenNewMovimiento('Ingreso')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Ingreso</span>
            </button>

            <button
              onClick={() => onOpenNewMovimiento('Gasto')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <MinusCircle className="w-4 h-4" />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Selector de Período (Mes y Año) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Período:
          </span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span>Movimientos registrados en {NOMBRES_MESES[mesSeleccionado - 1]}: </span>
          <strong className="text-slate-900 dark:text-white">{movimientosDelMes.length}</strong>
        </div>
      </div>

      {/* 3. Cuatro Widgets Clave de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ingresos Totales */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Ingresos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatoMoneda(totalIngresos)}
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <span>Entrada total del mes</span>
          </p>
        </div>

        {/* Card 2: Gastos Totales */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gastos del Mes
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatoMoneda(totalGastos)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Renta, despensa, servicios ({pctGastos}% del ingreso)
          </p>
        </div>

        {/* Card 3: Compromiso Mínimo de Deudas */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Mínimos de Tarjetas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatoMoneda(compromisoMinimosDeuda)}
          </div>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            {deudasConSaldo.filter((d) => !d.esta_liquidada).length} tarjetas activas ({pctMinimos}% del ingreso)
          </p>
        </div>

        {/* Card 4: Flujo Libre / Excedente Bola de Nieve */}
        <div
          className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border ${
            flujoNetoExcedente > 0
              ? 'bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/40 text-white shadow-emerald-950/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Excedente Libre</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              flujoNetoExcedente >= 0 ? 'text-emerald-400' : 'text-rose-500'
            }`}
          >
            {formatoMoneda(flujoNetoExcedente)}
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">
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
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all shadow-sm"
            >
              <span>Abonar a {deudaObjetivoActual.nombre_tarjeta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Barra de Distribución del Ingreso */}
      {totalIngresos > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Distribución de tu Ingreso Mensual ({formatoMoneda(totalIngresos)})
            </span>
            <span className="text-slate-500 font-medium">
              Tasa de ahorro/excedente: <strong className="text-emerald-500">{pctExcedente}%</strong>
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            {/* Gastos */}
            <div
              style={{ width: `${pctGastos}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title={`Gastos: ${pctGastos}%`}
            />
            {/* Mínimos */}
            <div
              style={{ width: `${pctMinimos}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Mínimos tarjetas: ${pctMinimos}%`}
            />
            {/* Excedente */}
            <div
              style={{ width: `${pctExcedente}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Excedente libre: ${pctExcedente}%`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Gastos: <strong>{pctGastos}%</strong> ({formatoMoneda(totalGastos)})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Tarjetas (Mínimos): <strong>{pctMinimos}%</strong> ({formatoMoneda(compromisoMinimosDeuda)})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">
                Excedente Bola de Nieve: <strong>{pctExcedente}%</strong> ({formatoMoneda(Math.max(0, flujoNetoExcedente))})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tabla / Lista de Movimientos */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Controles de filtro y búsqueda */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs Todos / Ingresos / Gastos */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            {(['Todos', 'Ingreso', 'Gasto'] as const).map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroTipo === tipo
                    ? tipo === 'Ingreso'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : tipo === 'Gasto'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tipo === 'Todos' ? 'Todos los Movimientos' : `${tipo}s`}
              </button>
            ))}
          </div>

          {/* Campo de Búsqueda */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Buscar por descripción o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Lista o Tabla de Movimientos */}
        {movimientosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No hay movimientos en este período
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Comienza registrando tu nómina, ventas o gastos de vivienda para calcular tu excedente disponible.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenNewMovimiento('Ingreso')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm"
              >
                + Registrar Ingreso
              </button>
              <button
                onClick={() => onOpenNewMovimiento('Gasto')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
              >
                + Registrar Gasto
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {movimientosFiltrados.map((mov) => {
              const esIngreso = mov.tipo === 'Ingreso';

              return (
                <div
                  key={mov.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        esIngreso
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {esIngreso ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {mov.descripcion}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            esIngreso
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {mov.categoria}
                        </span>
                        {mov.es_recurrente && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>Fijo</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {mov.fecha}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold ${
                          esIngreso ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {esIngreso ? '+' : '-'} {formatoMoneda(mov.monto)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditMovimiento(mov)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Editar movimiento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar este movimiento "${mov.descripcion}"?`)) {
                            deleteMovimientoFlujo(mov.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
    </div>
  );
}
