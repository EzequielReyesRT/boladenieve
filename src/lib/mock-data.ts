import { Deuda, BitacoraPago, ConfiguracionUsuario } from '@/types';

const now = new Date();

export const CONFIG_INICIAL: ConfiguracionUsuario = {
  pago_extra_mensual: 0,
  mes_calendario_inicio: now.getMonth() + 1,
  anio_inicio: now.getFullYear(),
  aportacion_unica_anual: 0,
  mes_aportacion_unica: 12,
};

export const DEUDAS_INICIALES: Deuda[] = [];

export const BITACORA_INICIAL: BitacoraPago[] = [];
