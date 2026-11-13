import {
  Deuda,
  BitacoraPago,
  ConfiguracionUsuario,
  DeudaConSaldoActual,
  ResultadoSimulacion,
  MesSimulacion,
  ProyeccionDeudaMes,
} from '@/types';

const NOMBRES_MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Calcula los saldos actuales de cada deuda con base en el saldo inicial
 * y los pagos registrados en la bitácora (restando la porción que va a capital).
 */
export function calcularSaldosActuales(
  deudas: Deuda[],
  bitacora: BitacoraPago[]
): DeudaConSaldoActual[] {
  return deudas.map((deuda) => {
    // Filtrar pagos de esta tarjeta
    const pagosDeuda = bitacora.filter((p) => p.deuda_id === deuda.id);

    const total_pagado = pagosDeuda.reduce((sum, p) => sum + Number(p.monto_total || 0), 0);
    const total_intereses_pagados = pagosDeuda.reduce(
      (sum, p) => sum + Number(p.intereses_cobrados || 0),
      0
    );

    // Amortización real a capital = Monto pagado - Intereses cobrados
    // (Asegurando que no amortice negativamente a menos que los intereses superen el pago)
    const amortizacion_capital = Math.max(0, total_pagado - total_intereses_pagados);

    const saldo_actual = Math.max(0, Number(deuda.saldo_inicial) - amortizacion_capital);
    const esta_liquidada = saldo_actual <= 0.01;
    const porcentaje_pagado =
      deuda.saldo_inicial > 0
        ? Math.min(100, Math.max(0, (amortizacion_capital / deuda.saldo_inicial) * 100))
        : 100;

    return {
      ...deuda,
      total_pagado,
      total_intereses_pagados,
      amortizacion_capital,
      saldo_actual: Number(saldo_actual.toFixed(2)),
      porcentaje_pagado: Number(porcentaje_pagado.toFixed(1)),
      esta_liquidada,
    };
  }).sort((a, b) => a.saldo_actual - b.saldo_actual); // Orden estricto Bola de Nieve (menor a mayor saldo)
}

/**
 * Motor de Simulación del Método Bola de Nieve
 * Proyección de pagos a un máximo de 120 meses.
 */
export function simularBolaDeNieve(
  deudasConSaldo: DeudaConSaldoActual[],
  config: ConfiguracionUsuario,
  maxMeses: number = 120
): ResultadoSimulacion {
  // 1. Filtrar deudas con saldo pendiente y ordenarlas estrictamente de menor a mayor
  const deudasOrdenadas = [...deudasConSaldo]
    .filter((d) => d.saldo_actual > 0)
    .sort((a, b) => a.saldo_actual - b.saldo_actual);

  // Si no hay deudas con saldo pendiente
  if (deudasOrdenadas.length === 0) {
    return {
      meses: [],
      meses_totales: 0,
      fecha_libertad_financiera: '¡Ya libre de deudas!',
      total_capital_pagado: 0,
      total_intereses_proyectados: 0,
      total_anualidades_proyectadas: 0,
      gran_total_pagado: 0,
      ahorro_tiempo_meses: 0,
      hitos_liquidacion: [],
    };
  }

  // Estado interno de saldos que mutará mes a mes durante la simulación
  const saldosRastreo = deudasOrdenadas.map((d) => ({
    id: d.id,
    nombre_tarjeta: d.nombre_tarjeta,
    saldo_restante: d.saldo_actual,
    tasa_anual_porcentaje: d.tasa_anual_porcentaje,
    pago_minimo: d.pago_minimo,
    costo_anualidad: d.costo_anualidad,
    mes_cobro_anualidad: d.mes_cobro_anualidad,
    esta_liquidada: false,
    mes_liquidada: null as number | null,
    fecha_liquidada: null as string | null,
  }));

  const mesesResultado: MesSimulacion[] = [];
  const hitosLiquidacion: ResultadoSimulacion['hitos_liquidacion'] = [];

  const anioBase = config.anio_inicio || new Date().getFullYear();
  const mesInicio = Math.min(12, Math.max(1, config.mes_calendario_inicio || 1));

  let mesIndex = 0;

  while (mesIndex < maxMeses) {
    // Comprobar si todas las deudas están ya en 0
    const deudasPendientes = saldosRastreo.filter((d) => !d.esta_liquidada);
    if (deudasPendientes.length === 0) {
      break;
    }

    const numeroMes = mesIndex + 1;
    // Cálculo de mes y año calendario
    const totalMesesOffset = (mesInicio - 1) + mesIndex;
    const mesCalendario = (totalMesesOffset % 12) + 1; // 1-12
    const anioCalendario = anioBase + Math.floor(totalMesesOffset / 12);
    const fechaEtiqueta = `${NOMBRES_MESES[mesCalendario - 1]} ${anioCalendario}`;

    // Aportaciones adicionales configuradas
    const pagoExtraMensual = Number(config.pago_extra_mensual || 0);
    const aplicaAportacionAnual = mesCalendario === Number(config.mes_aportacion_unica);
    const aportacionAnual = aplicaAportacionAnual ? Number(config.aportacion_unica_anual || 0) : 0;

    // Bolsa de dinero extra bola de nieve inicial para este mes
    let sobranteAnterior = pagoExtraMensual + aportacionAnual;

    let saldoTotalInicialMes = 0;
    let interesesTotalesMes = 0;
    let anualidadesTotalesMes = 0;
    let pagoTotalMes = 0;

    const proyeccionDeudasMes: ProyeccionDeudaMes[] = [];
    const chartDataPoint: Record<string, number | string> = {};

    for (let i = 0; i < saldosRastreo.length; i++) {
      const deuda = saldosRastreo[i];
      const saldoInicialDeuda = deuda.saldo_restante;
      saldoTotalInicialMes += saldoInicialDeuda;

      if (deuda.esta_liquidada) {
        // Esta deuda ya fue liquidada en un mes anterior.
        // Su pago mínimo se suma automáticamente a la bolsa de la bola de nieve.
        sobranteAnterior += deuda.pago_minimo;

        proyeccionDeudasMes.push({
          deuda_id: deuda.id,
          nombre_tarjeta: deuda.nombre_tarjeta,
          saldo_inicial_mes: 0,
          interes_mes: 0,
          anualidad_mes: 0,
          pago_asignado: 0,
          pago_capital: 0,
          saldo_final_mes: 0,
          esta_liquidada: true,
          se_liquido_este_mes: false,
        });
        chartDataPoint[`deuda_${deuda.id}`] = 0;
        continue;
      }

      // 1. Intereses del mes: Saldo * (Tasa Anual / 12 / 100)
      const tasaMensual = (deuda.tasa_anual_porcentaje / 100) / 12;
      const interesMes = Number((saldoInicialDeuda * tasaMensual).toFixed(2));
      interesesTotalesMes += interesMes;

      // 2. Anualidad: solo si el mes coincide y la deuda aún tiene saldo
      const cobraAnualidad = mesCalendario === deuda.mes_cobro_anualidad;
      const anualidadMes = cobraAnualidad ? Number(deuda.costo_anualidad || 0) : 0;
      anualidadesTotalesMes += anualidadMes;

      // Obligación total a cubrir este mes
      const adeudoTotal = saldoInicialDeuda + interesMes + anualidadMes;

      // 3. Fórmula del pago crítico:
      // pago = MAX(0, MIN(saldo_restante + intereses + anualidad, pago_minimo_propio + sobrante_deuda_anterior))
      const recursosDisponibles = deuda.pago_minimo + sobranteAnterior;
      const pagoAsignado = Math.max(0, Math.min(adeudoTotal, recursosDisponibles));

      // Sobrante que cascada a la siguiente deuda en este mismo mes
      const excedenteGenerado = Math.max(0, recursosDisponibles - pagoAsignado);
      sobranteAnterior = excedenteGenerado;

      // 4. Saldo resultante tras el pago
      const saldoFinalDeuda = Math.max(0, Number((adeudoTotal - pagoAsignado).toFixed(2)));
      const pagoCapital = Math.max(0, Number((pagoAsignado - interesMes - anualidadMes).toFixed(2)));

      deuda.saldo_restante = saldoFinalDeuda;
      pagoTotalMes += pagoAsignado;

      let seLiquidoEsteMes = false;
      if (saldoFinalDeuda <= 0.01) {
        deuda.esta_liquidada = true;
        deuda.saldo_restante = 0;
        deuda.mes_liquidada = numeroMes;
        deuda.fecha_liquidada = fechaEtiqueta;
        seLiquidoEsteMes = true;

        hitosLiquidacion.push({
          deuda_id: deuda.id,
          nombre_tarjeta: deuda.nombre_tarjeta,
          numero_mes: numeroMes,
          fecha_etiqueta: fechaEtiqueta,
        });
      }

      proyeccionDeudasMes.push({
        deuda_id: deuda.id,
        nombre_tarjeta: deuda.nombre_tarjeta,
        saldo_inicial_mes: saldoInicialDeuda,
        interes_mes: interesMes,
        anualidad_mes: anualidadMes,
        pago_asignado: Number(pagoAsignado.toFixed(2)),
        pago_capital: pagoCapital,
        saldo_final_mes: deuda.saldo_restante,
        esta_liquidada: deuda.esta_liquidada,
        se_liquido_este_mes: seLiquidoEsteMes,
      });

      chartDataPoint[`deuda_${deuda.id}`] = deuda.saldo_restante;
    }

    const saldoTotalFinalMes = saldosRastreo.reduce((sum, d) => sum + d.saldo_restante, 0);
    const deudasLiquidadasAcumuladas = saldosRastreo.filter((d) => d.esta_liquidada).length;

    mesesResultado.push({
      numero_mes: numeroMes,
      mes_calendario: mesCalendario,
      anio_calendario: anioCalendario,
      fecha_etiqueta: fechaEtiqueta,
      saldo_total_inicial: Number(saldoTotalInicialMes.toFixed(2)),
      intereses_totales_mes: Number(interesesTotalesMes.toFixed(2)),
      anualidades_totales_mes: Number(anualidadesTotalesMes.toFixed(2)),
      pago_extra_disponible: pagoExtraMensual,
      aportacion_anual_disponible: aportacionAnual,
      pago_total_mes: Number(pagoTotalMes.toFixed(2)),
      saldo_total_final: Number(saldoTotalFinalMes.toFixed(2)),
      deudas: proyeccionDeudasMes,
      deudas_liquidadas_acumuladas: deudasLiquidadasAcumuladas,
      ...chartDataPoint,
    });

    mesIndex++;
  }

  // Métricas globales de la simulación
  const mesesTotales = mesesResultado.length;
  const fechaLibertadFinanciera =
    mesesResultado.length > 0
      ? mesesResultado[mesesResultado.length - 1].fecha_etiqueta
      : 'N/A';

  const totalCapitalInicial = deudasConSaldo.reduce((sum, d) => sum + d.saldo_actual, 0);
  const totalInteresesProyectados = Number(
    mesesResultado.reduce((sum, m) => sum + m.intereses_totales_mes, 0).toFixed(2)
  );
  const totalAnualidadesProyectadas = Number(
    mesesResultado.reduce((sum, m) => sum + m.anualidades_totales_mes, 0).toFixed(2)
  );
  const granTotalPagado = Number(
    mesesResultado.reduce((sum, m) => sum + m.pago_total_mes, 0).toFixed(2)
  );

  return {
    meses: mesesResultado,
    meses_totales: mesesTotales,
    fecha_libertad_financiera: fechaLibertadFinanciera,
    total_capital_pagado: Number(totalCapitalInicial.toFixed(2)),
    total_intereses_proyectados: totalInteresesProyectados,
    total_anualidades_proyectadas: totalAnualidadesProyectadas,
    gran_total_pagado: granTotalPagado,
    ahorro_tiempo_meses: 0, // Opcional para comparativas
    hitos_liquidacion: hitosLiquidacion,
  };
}

/**
 * Formateador de moneda para UX/UI
 */
export function formatoMoneda(valor: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor || 0);
}

/**
 * Formateador de porcentaje para UX/UI
 */
export function formatoPorcentaje(valor: number): string {
  return `${(valor || 0).toFixed(2)}%`;
}
