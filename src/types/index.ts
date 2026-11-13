export type TipoPago = 'Minimo' | 'Extra' | 'Anualidad' | 'Liquidacion';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Usuario;
  error?: string;
}

export interface ConfiguracionUsuario {
  id?: string;
  user_id?: string;
  pago_extra_mensual: number;
  mes_calendario_inicio: number; // 1 = Enero, 12 = Diciembre
  anio_inicio?: number; // ej. 2026
  aportacion_unica_anual: number;
  mes_aportacion_unica: number; // 1 a 12
  created_at?: string;
  updated_at?: string;
}

export interface Deuda {
  id: string;
  user_id?: string;
  nombre_tarjeta: string;
  saldo_inicial: number;
  tasa_anual_porcentaje: number; // Ej. 48.5 para 48.5%
  pago_minimo: number;
  costo_anualidad: number;
  mes_cobro_anualidad: number; // 1 a 12
  created_at?: string;
  updated_at?: string;
}

export interface BitacoraPago {
  id: string;
  deuda_id: string;
  user_id?: string;
  fecha_pago: string; // YYYY-MM-DD
  tipo_pago: TipoPago;
  monto_total: number;
  intereses_cobrados: number;
  folio_comprobante?: string;
  created_at?: string;
}

// Deuda enriquecida con saldos actuales calculados a partir de la bitácora
export interface DeudaConSaldoActual extends Deuda {
  total_pagado: number;
  total_intereses_pagados: number;
  amortizacion_capital: number;
  saldo_actual: number;
  porcentaje_pagado: number;
  esta_liquidada: boolean;
}

// Estructura de proyección por mes para una deuda individual
export interface ProyeccionDeudaMes {
  deuda_id: string;
  nombre_tarjeta: string;
  saldo_inicial_mes: number;
  interes_mes: number;
  anualidad_mes: number;
  pago_asignado: number;
  pago_capital: number;
  saldo_final_mes: number;
  esta_liquidada: boolean;
  se_liquido_este_mes: boolean;
}

// Proyección agregada mensual para la tabla y gráfico
export interface MesSimulacion {
  numero_mes: number; // 1, 2, 3... hasta 120
  mes_calendario: number; // 1 - 12
  anio_calendario: number;
  fecha_etiqueta: string; // "Ene 2026"
  saldo_total_inicial: number;
  intereses_totales_mes: number;
  anualidades_totales_mes: number;
  pago_extra_disponible: number;
  aportacion_anual_disponible: number;
  pago_total_mes: number;
  saldo_total_final: number;
  deudas: ProyeccionDeudaMes[];
  deudas_liquidadas_acumuladas: number;
  [key: `deuda_${string}`]: number | string; // Para Recharts Stacked Area Chart
}

export interface ResultadoSimulacion {
  meses: MesSimulacion[];
  meses_totales: number;
  fecha_libertad_financiera: string;
  total_capital_pagado: number;
  total_intereses_proyectados: number;
  total_anualidades_proyectadas: number;
  gran_total_pagado: number;
  ahorro_tiempo_meses: number; // Comparado con solo pagos mínimos
  hitos_liquidacion: {
    deuda_id: string;
    nombre_tarjeta: string;
    numero_mes: number;
    fecha_etiqueta: string;
  }[];
}
