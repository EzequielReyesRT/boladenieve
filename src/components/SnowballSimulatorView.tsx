'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { formatoMoneda } from '@/lib/snowball-engine';
import { MesSimulacion } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const DEBT_COLORS = [
  { stroke: '#10b981', fill: '#10b981' }, // Emerald
  { stroke: '#6366f1', fill: '#6366f1' }, // Indigo
  { stroke: '#f59e0b', fill: '#f59e0b' }, // Amber
  { stroke: '#ec4899', fill: '#ec4899' }, // Pink
  { stroke: '#06b6d4', fill: '#06b6d4' }, // Cyan
  { stroke: '#8b5cf6', fill: '#8b5cf6' }, // Purple
  { stroke: '#f97316', fill: '#f97316' }, // Orange
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  meses: MesSimulacion[];
}

function CustomTooltipContent({ active, payload, label, meses }: TooltipProps) {
  if (active && payload && payload.length) {
    const mesData = meses.find((m) => m.fecha_etiqueta === label);
    return (
      <div className="rounded-xl bg-slate-900/95 p-3.5 shadow-2xl border border-slate-700 text-white text-xs max-w-xs">
        <div className="font-bold text-sm text-emerald-400 mb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal">Mes #{mesData?.numero_mes}</span>
        </div>
        <div className="text-slate-300 font-semibold mb-2">
          Saldo Total: {formatoMoneda(mesData?.saldo_total_final || 0)}
        </div>
        <div className="space-y-1 border-t border-slate-800 pt-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 truncate">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate text-slate-300">{entry.name}:</span>
              </div>
              <span className="font-bold">{formatoMoneda(entry.value)}</span>
            </div>
          ))}
        </div>
        {mesData && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Pago inyectado este mes:</span>
            <span className="font-bold text-emerald-400">{formatoMoneda(mesData.pago_total_mes)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

interface SnowballSimulatorViewProps {
  onOpenConfigModal: () => void;
}

export function SnowballSimulatorView({ onOpenConfigModal }: SnowballSimulatorViewProps) {
  const { simulacion, deudasConSaldo, config, updateConfig } = useSnowball();
  const [showFullTable, setShowFullTable] = useState(false);

  const deudasEnProyeccion = deudasConSaldo.filter((d) => d.saldo_actual > 0);

  const handleQuickAddExtra = (delta: number) => {
    const nuevoExtra = Math.max(0, (config.pago_extra_mensual || 0) + delta);
    updateConfig({ pago_extra_mensual: nuevoExtra });
  };

  const mesesAMostrar = showFullTable ? simulacion.meses : simulacion.meses.slice(0, 24);

  return (
    <div className="space-y-6">
      {/* Tarjeta de Métricas Clave de la Simulación */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Proyección Predictiva de la Bola de Nieve
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simulando el efecto cascada con corte a 120 meses. Al extinguirse una deuda, su cuota mínima acelera la siguiente.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-2">
              Acelerar pago extra:
            </span>
            <button
              onClick={() => handleQuickAddExtra(500)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              +$500
            </button>
            <button
              onClick={() => handleQuickAddExtra(1000)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            >
              +$1,000
            </button>
            <button
              onClick={onOpenConfigModal}
              className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Avanzado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Tiempo para Cero Deudas
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {simulacion.meses_totales} meses
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fecha: <strong className="text-slate-800 dark:text-slate-200">{simulacion.fecha_libertad_financiera}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Capital Amortizado
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatoMoneda(simulacion.total_capital_pagado)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              100% de la deuda saldada
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Intereses Proyectados
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-500 mt-1">
              {formatoMoneda(simulacion.total_intereses_proyectados)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Minimizados por la Bola de Nieve
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Gran Total a Desembolsar
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatoMoneda(simulacion.gran_total_pagado)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Capital + intereses + anualidades
            </div>
          </div>
        </div>
      </div>

      {simulacion.hitos_liquidacion.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hitos de Victoria: ¿Cuándo liquidarás cada deuda?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {simulacion.hitos_liquidacion.map((hito, idx) => (
              <div
                key={hito.deuda_id}
                className="p-3 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Victoria #{idx + 1}
                  </span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                    Mes {hito.numero_mes}
                  </span>
                </div>
                <div className="mt-1 font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {hito.nombre_tarjeta}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {hito.fecha_etiqueta}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Área Apilada */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Curva de Desendeudamiento Mes a Mes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evolución del saldo restante por tarjeta hasta llegar a cero
            </p>
          </div>
        </div>

        <div className="h-72 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={simulacion.meses}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {deudasEnProyeccion.map((deuda, idx) => {
                  const color = DEBT_COLORS[idx % DEBT_COLORS.length];
                  return (
                    <linearGradient
                      key={deuda.id}
                      id={`grad_${deuda.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color.fill} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color.fill} stopOpacity={0.1} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="fecha_etiqueta"
                tick={{ fontSize: 11 }}
                interval={Math.max(1, Math.floor(simulacion.meses.length / 8))}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={<CustomTooltipContent meses={simulacion.meses} />}
              />
              <Legend
                formatter={(value) => <span className="text-xs font-semibold">{value}</span>}
              />
              {deudasEnProyeccion.map((deuda, idx) => {
                const color = DEBT_COLORS[idx % DEBT_COLORS.length];
                return (
                  <Area
                    key={deuda.id}
                    type="monotone"
                    dataKey={`deuda_${deuda.id}`}
                    name={deuda.nombre_tarjeta}
                    stackId="1"
                    stroke={color.stroke}
                    fill={`url(#grad_${deuda.id})`}
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Tabla de Proyección Mensual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Desglose detallado del pago, intereses y amortización para cada mes
            </p>
          </div>
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            {showFullTable ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ver primeros 24 meses
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver todos ({simulacion.meses.length} meses)
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Mes #</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4 text-right">Saldo Inicial</th>
                <th className="py-3 px-4 text-right">Intereses</th>
                <th className="py-3 px-4 text-right">Anualidades</th>
                <th className="py-3 px-4 text-right">Pago Bola Nieve</th>
                <th className="py-3 px-4 text-right">Saldo Final</th>
                <th className="py-3 px-4 text-center">Liquidadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {mesesAMostrar.map((mes) => {
                const tieneAnualidad = mes.anualidades_totales_mes > 0;
                const tieneBonoAnual = mes.aportacion_anual_disponible > 0;

                return (
                  <tr
                    key={mes.numero_mes}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {mes.numero_mes}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      <span>{mes.fecha_etiqueta}</span>
                      {tieneBonoAnual && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          +Bono {formatoMoneda(mes.aportacion_anual_disponible)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400 font-medium">
                      {formatoMoneda(mes.saldo_total_inicial)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-500 font-semibold">
                      {formatoMoneda(mes.intereses_totales_mes)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-500 font-medium">
                      {tieneAnualidad ? formatoMoneda(mes.anualidades_totales_mes) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">
                      {formatoMoneda(mes.pago_total_mes)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900 dark:text-white font-extrabold">
                      {formatoMoneda(mes.saldo_total_final)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {mes.deudas_liquidadas_acumuladas} / {deudasEnProyeccion.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
