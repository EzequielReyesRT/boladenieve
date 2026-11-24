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
  { stroke: '#2563eb', fill: '#2563eb' }, // Cobalt Blue (Brand Primary)
  { stroke: '#0d9488', fill: '#0d9488' }, // Teal
  { stroke: '#6366f1', fill: '#6366f1' }, // Indigo
  { stroke: '#d97706', fill: '#d97706' }, // Amber
  { stroke: '#e11d48', fill: '#e11d48' }, // Rose Wine
  { stroke: '#0284c7', fill: '#0284c7' }, // Sky Blue
  { stroke: '#16a34a', fill: '#16a34a' }, // Emerald
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
      <div className="rounded-xl bg-slate-900/95 p-3.5 shadow-xl border border-slate-700 text-white text-xs max-w-xs">
        <div className="font-bold text-sm text-white mb-1 flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-slate-400 font-normal tabular-nums">Mes #{mesData?.numero_mes}</span>
        </div>
        <div className="text-slate-300 font-semibold mb-2 tabular-nums">
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
              <span className="font-bold tabular-nums">{formatoMoneda(entry.value)}</span>
            </div>
          ))}
        </div>
        {mesData && (
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between tabular-nums">
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
      <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Proyección Predictiva de la Bola de Nieve
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Simulando el efecto cascada con corte a 120 meses. Al extinguirse una deuda, su cuota mínima acelera la siguiente.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--surface-subtle)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-secondary)] pl-2">
              Acelerar pago extra:
            </span>
            <button
              onClick={() => handleQuickAddExtra(500)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-hover)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 cursor-pointer"
            >
              +$500
            </button>
            <button
              onClick={() => handleQuickAddExtra(1000)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--brand-border)] hover:bg-[var(--brand-surface)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 cursor-pointer"
            >
              +$1,000
            </button>
            <button
              onClick={onOpenConfigModal}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 cursor-pointer"
            >
              Avanzado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Tiempo para Cero Deudas
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--brand-primary)] mt-1 tabular-nums">
              {simulacion.meses_totales} meses
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Fecha: <strong className="text-[var(--text-primary)]">{simulacion.fecha_libertad_financiera}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Capital Amortizado
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--status-success)] mt-1 tabular-nums">
              {formatoMoneda(simulacion.total_capital_pagado)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              100% de la deuda saldada
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Intereses Proyectados
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--status-danger)] mt-1 tabular-nums">
              {formatoMoneda(simulacion.total_intereses_proyectados)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Minimizados por la Bola de Nieve
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Gran Total a Desembolsar
            </span>
            <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] mt-1 tabular-nums">
              {formatoMoneda(simulacion.gran_total_pagado)}
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              Capital + intereses + anualidades
            </div>
          </div>
        </div>
      </div>

      {simulacion.hitos_liquidacion.length > 0 && (
        <div className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Hitos de Victoria: ¿Cuándo liquidarás cada deuda?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {simulacion.hitos_liquidacion.map((hito, idx) => (
              <div
                key={hito.deuda_id}
                className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--status-success)]">
                    Victoria #{idx + 1}
                  </span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-[var(--status-success-surface)] text-[var(--status-success-text)] border border-[var(--status-success-border)] text-[10px] tabular-nums">
                    Mes {hito.numero_mes}
                  </span>
                </div>
                <div className="mt-1 font-extrabold text-sm text-[var(--text-primary)] truncate">
                  {hito.nombre_tarjeta}
                </div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {hito.fecha_etiqueta}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de Área Apilada */}
      <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Curva de Desendeudamiento Mes a Mes
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
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
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Tabla de Proyección Mensual
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Desglose detallado del pago, intereses y amortización para cada mes
            </p>
          </div>
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95"
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
            <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase font-semibold">
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
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {mesesAMostrar.map((mes) => {
                const tieneAnualidad = mes.anualidades_totales_mes > 0;
                const tieneBonoAnual = mes.aportacion_anual_disponible > 0;

                return (
                  <tr
                    key={mes.numero_mes}
                    className="hover:bg-[var(--surface-subtle)] transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-[var(--text-secondary)] tabular-nums">
                      {mes.numero_mes}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                      <span>{mes.fecha_etiqueta}</span>
                      {tieneBonoAnual && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--brand-surface)] text-[var(--brand-text)] border border-[var(--brand-border)] tabular-nums">
                          +Bono {formatoMoneda(mes.aportacion_anual_disponible)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-secondary)] font-medium tabular-nums">
                      {formatoMoneda(mes.saldo_total_inicial)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-500 font-semibold tabular-nums">
                      {formatoMoneda(mes.intereses_totales_mes)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-500 font-medium tabular-nums">
                      {tieneAnualidad ? formatoMoneda(mes.anualidades_totales_mes) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--brand-primary)] font-black tabular-nums">
                      {formatoMoneda(mes.pago_total_mes)}
                    </td>
                    <td className="py-3 px-4 text-right text-[var(--text-primary)] font-extrabold tabular-nums">
                      {formatoMoneda(mes.saldo_total_final)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] tabular-nums">
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
