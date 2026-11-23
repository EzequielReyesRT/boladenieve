import { Deuda, BitacoraPago, MovimientoFlujo, ConfiguracionUsuario, TipoPago, TipoMovimiento } from '@/types';

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data: T;
}

/**
 * Sanitiza una cadena eliminando espacios extras y posibles etiquetas HTML básicas
 */
export function sanitizeString(val: unknown, maxLength = 255): string {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/[<>]/g, '') // Elimina caracteres de inyección HTML básica
    .slice(0, maxLength);
}

/**
 * Convierte y valida un número dentro de un rango
 */
export function parseFiniteNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : fallback;
  }
  if (typeof val === 'string') {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Valida formato de fecha YYYY-MM-DD
 */
export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

/**
 * Valida esquema y rangos de Deuda
 */
export function validateDeuda(input: Partial<Deuda>): ValidationResult<Deuda> {
  const errors: string[] = [];
  const nombre = sanitizeString(input.nombre_tarjeta, 120);

  if (!nombre) {
    errors.push('El nombre de la tarjeta o crédito es obligatorio.');
  }

  const saldo = parseFiniteNumber(input.saldo_inicial, -1);
  if (saldo <= 0 || saldo > 100_000_000) {
    errors.push('El saldo inicial debe ser un número positivo mayor a 0 y menor a 100,000,000.');
  }

  const tasa = parseFiniteNumber(input.tasa_anual_porcentaje, -1);
  if (tasa < 0 || tasa > 500) {
    errors.push('La tasa anual porcentual debe estar entre 0% y 500%.');
  }

  const minimo = parseFiniteNumber(input.pago_minimo, -1);
  if (minimo < 0) {
    errors.push('El pago mínimo no puede ser negativo.');
  }

  const anualidad = parseFiniteNumber(input.costo_anualidad, 0);
  if (anualidad < 0) {
    errors.push('El costo de anualidad no puede ser negativo.');
  }

  let mesAnualidad = Math.floor(parseFiniteNumber(input.mes_cobro_anualidad, 1));
  if (mesAnualidad < 1 || mesAnualidad > 12) {
    mesAnualidad = 1;
  }

  const data: Deuda = {
    id: sanitizeString(input.id || '', 60),
    user_id: input.user_id ? sanitizeString(input.user_id, 60) : undefined,
    nombre_tarjeta: nombre,
    saldo_inicial: saldo,
    tasa_anual_porcentaje: tasa,
    pago_minimo: minimo,
    costo_anualidad: anualidad,
    mes_cobro_anualidad: mesAnualidad,
    created_at: input.created_at,
    updated_at: input.updated_at,
  };

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Valida esquema y rangos de BitacoraPago
 */
export function validatePago(input: Partial<BitacoraPago>): ValidationResult<BitacoraPago> {
  const errors: string[] = [];
  const deudaId = sanitizeString(input.deuda_id, 60);

  if (!deudaId) {
    errors.push('El identificador de la deuda asociada es obligatorio.');
  }

  const monto = parseFiniteNumber(input.monto_total, -1);
  if (monto <= 0) {
    errors.push('El monto total del pago debe ser mayor a 0.');
  }

  const intereses = parseFiniteNumber(input.intereses_cobrados, 0);
  if (intereses < 0) {
    errors.push('Los intereses cobrados no pueden ser negativos.');
  }
  if (monto > 0 && intereses > monto) {
    errors.push('Los intereses cobrados no pueden exceder el monto total pagado.');
  }

  const fecha = String(input.fecha_pago || '').trim();
  if (!isValidDateString(fecha)) {
    errors.push('La fecha de pago debe tener el formato válido YYYY-MM-DD.');
  }

  const tiposValidos: TipoPago[] = ['Minimo', 'Extra', 'Anualidad', 'Liquidacion'];
  const tipo = input.tipo_pago as TipoPago;
  if (!tiposValidos.includes(tipo)) {
    errors.push(`El tipo de pago debe ser uno de: ${tiposValidos.join(', ')}.`);
  }

  const data: BitacoraPago = {
    id: sanitizeString(input.id || '', 60),
    deuda_id: deudaId,
    user_id: input.user_id ? sanitizeString(input.user_id, 60) : undefined,
    fecha_pago: fecha,
    tipo_pago: tipo,
    monto_total: monto,
    intereses_cobrados: intereses,
    folio_comprobante: input.folio_comprobante ? sanitizeString(input.folio_comprobante, 100) : undefined,
    created_at: input.created_at,
  };

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Valida esquema y rangos de MovimientoFlujo
 */
export function validateMovimientoFlujo(input: Partial<MovimientoFlujo>): ValidationResult<MovimientoFlujo> {
  const errors: string[] = [];

  const descripcion = sanitizeString(input.descripcion, 150);
  if (!descripcion) {
    errors.push('La descripción del movimiento es obligatoria.');
  }

  const categoria = sanitizeString(input.categoria || 'Varios', 80);

  const tipoValido: TipoMovimiento[] = ['Ingreso', 'Gasto'];
  const tipo = (input.tipo || 'Gasto') as TipoMovimiento;
  if (!tipoValido.includes(tipo)) {
    errors.push('El tipo de movimiento debe ser Ingreso o Gasto.');
  }

  const monto = parseFiniteNumber(input.monto, -1);
  if (monto <= 0) {
    errors.push('El monto debe ser un número positivo mayor a 0.');
  }

  const fecha = String(input.fecha || '').trim();
  if (!isValidDateString(fecha)) {
    errors.push('La fecha debe tener el formato válido YYYY-MM-DD.');
  }

  const data: MovimientoFlujo = {
    id: sanitizeString(input.id || '', 60),
    user_id: input.user_id ? sanitizeString(input.user_id, 60) : undefined,
    tipo,
    categoria,
    descripcion,
    monto,
    fecha,
    es_recurrente: Boolean(input.es_recurrente),
    created_at: input.created_at,
    updated_at: input.updated_at,
  };

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}

/**
 * Valida esquema y rangos de ConfiguracionUsuario
 */
export function validateConfig(input: Partial<ConfiguracionUsuario>): ValidationResult<ConfiguracionUsuario> {
  const errors: string[] = [];

  const pagoExtra = parseFiniteNumber(input.pago_extra_mensual, -1);
  if (pagoExtra < 0) {
    errors.push('El pago extra mensual no puede ser negativo.');
  }

  let mesInicio = Math.floor(parseFiniteNumber(input.mes_calendario_inicio, 1));
  if (mesInicio < 1 || mesInicio > 12) {
    mesInicio = 1;
  }

  let anioInicio = Math.floor(parseFiniteNumber(input.anio_inicio, 2026));
  if (anioInicio < 2000 || anioInicio > 2100) {
    anioInicio = 2026;
  }

  const aportacionUnica = parseFiniteNumber(input.aportacion_unica_anual, 0);
  if (aportacionUnica < 0) {
    errors.push('La aportación única anual no puede ser negativa.');
  }

  let mesAportacion = Math.floor(parseFiniteNumber(input.mes_aportacion_unica, 12));
  if (mesAportacion < 1 || mesAportacion > 12) {
    mesAportacion = 12;
  }

  const data: ConfiguracionUsuario = {
    id: input.id ? sanitizeString(input.id, 60) : undefined,
    user_id: input.user_id ? sanitizeString(input.user_id, 60) : undefined,
    pago_extra_mensual: Math.max(0, pagoExtra),
    mes_calendario_inicio: mesInicio,
    anio_inicio: anioInicio,
    aportacion_unica_anual: Math.max(0, aportacionUnica),
    mes_aportacion_unica: mesAportacion,
    created_at: input.created_at,
    updated_at: input.updated_at,
  };

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
}
