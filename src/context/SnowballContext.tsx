'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Deuda,
  BitacoraPago,
  ConfiguracionUsuario,
  DeudaConSaldoActual,
  ResultadoSimulacion,
  MovimientoFlujo,
  ResumenFlujoMes,
} from '@/types';
import {
  CONFIG_INICIAL,
  DEUDAS_INICIALES,
  BITACORA_INICIAL,
} from '@/lib/mock-data';
import {
  calcularSaldosActuales,
  simularBolaDeNieve,
} from '@/lib/snowball-engine';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface SnowballContextType {
  config: ConfiguracionUsuario;
  deudas: Deuda[];
  bitacora: BitacoraPago[];
  deudasConSaldo: DeudaConSaldoActual[];
  simulacion: ResultadoSimulacion;
  isLoaded: boolean;
  connectionType: 'supabase' | 'local_postgres' | 'local_storage';
  // Métricas rápidas
  deudaTotalActual: number;
  deudaTotalOriginal: number;
  porcentajeAvanceGlobal: number;
  pagoTotalMensualBase: number;
  // Flujo de Caja
  movimientosFlujo: MovimientoFlujo[];
  resumenFlujoMes: ResumenFlujoMes;
  // Acciones
  updateConfig: (nuevaConfig: Partial<ConfiguracionUsuario>) => Promise<void>;
  addDeuda: (nuevaDeuda: Omit<Deuda, 'id' | 'created_at'>) => Promise<void>;
  updateDeuda: (deudaActualizada: Deuda) => Promise<void>;
  deleteDeuda: (deudaId: string) => Promise<void>;
  addPago: (nuevoPago: Omit<BitacoraPago, 'id' | 'created_at'>) => Promise<void>;
  deletePago: (pagoId: string) => Promise<void>;
  addMovimientoFlujo: (nuevoMov: Omit<MovimientoFlujo, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateMovimientoFlujo: (movActualizado: MovimientoFlujo) => Promise<void>;
  deleteMovimientoFlujo: (id: string) => Promise<void>;
  resetToDemo: () => void;
}

const SnowballContext = createContext<SnowballContextType | undefined>(undefined);

const LEGACY_STORAGE_KEYS = [
  'snowball_config_v1',
  'snowball_deudas_v1',
  'snowball_bitacora_v1',
];

function getUserStorageKeys(userId: string) {
  return {
    CONFIG: `snowball_config_v2_${userId}`,
    DEUDAS: `snowball_deudas_v2_${userId}`,
    BITACORA: `snowball_bitacora_v2_${userId}`,
  };
}

export function SnowballProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [config, setConfig] = useState<ConfiguracionUsuario>(CONFIG_INICIAL);
  const [deudas, setDeudas] = useState<Deuda[]>(DEUDAS_INICIALES);
  const [bitacora, setBitacora] = useState<BitacoraPago[]>(BITACORA_INICIAL);
  const [movimientosFlujo, setMovimientosFlujo] = useState<MovimientoFlujo[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<'supabase' | 'local_postgres' | 'local_storage'>('local_postgres');

  // 1. Cargar datos iniciales aislados por usuario
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      if (isAuthLoading) return;

      // Limpiar claves globales heredadas para evitar fugas entre usuarios en el mismo navegador
      if (typeof window !== 'undefined') {
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      }

      // Reiniciar estado en memoria inmediatamente al cambiar o cerrar sesión
      setConfig(CONFIG_INICIAL);
      setDeudas([]);
      setBitacora([]);
      setMovimientosFlujo([]);

      if (!isAuthenticated || !user?.id) {
        setIsLoaded(true);
        return;
      }

      setIsLoaded(false);
      const userId = user.id;

      // Prioridad 1: Supabase si están las credenciales (filtrado estrictamente por user_id)
      if (isSupabaseConfigured && supabase) {
        try {
          const [cfgRes, deudasRes, bitacoraRes, flujoRes] = await Promise.all([
            supabase.from('configuracion_usuario').select('*').eq('user_id', userId).limit(1).maybeSingle(),
            supabase.from('deudas').select('*').eq('user_id', userId).order('saldo_inicial', { ascending: true }),
            supabase.from('bitacora_pagos').select('*').eq('user_id', userId).order('fecha_pago', { ascending: false }),
            supabase.from('movimientos_flujo').select('*').eq('user_id', userId).order('fecha', { ascending: false }),
          ]);

          if (isCancelled) return;
          setConfig(cfgRes.data ?? CONFIG_INICIAL);
          setDeudas(Array.isArray(deudasRes.data) ? deudasRes.data : []);
          setBitacora(Array.isArray(bitacoraRes.data) ? bitacoraRes.data : []);
          setMovimientosFlujo(Array.isArray(flujoRes.data) ? flujoRes.data : []);
          setConnectionType('supabase');
          setIsLoaded(true);
          return;
        } catch (err) {
          console.warn('Supabase no disponible, intentando base de datos local:', err);
        }
      }

      // Prioridad 2: Base de datos PostgreSQL local via API (sin caché, aislada por cookie de sesión)
      try {
        const [resCfg, resDeudas, resBitacora, resFlujo] = await Promise.all([
          fetch('/api/config', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/deudas', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/pagos', { credentials: 'include', cache: 'no-store' }),
          fetch('/api/flujo', { credentials: 'include', cache: 'no-store' }),
        ]);

        if (isCancelled) return;

        if (resCfg.ok && resDeudas.ok && resBitacora.ok) {
          const dataCfg = await resCfg.json();
          const dataDeudas = await resDeudas.json();
          const dataBitacora = await resBitacora.json();
          const dataFlujo = resFlujo.ok ? await resFlujo.json() : [];

          setConfig(dataCfg ?? CONFIG_INICIAL);
          setDeudas(Array.isArray(dataDeudas) ? dataDeudas : []);
          setBitacora(Array.isArray(dataBitacora) ? dataBitacora : []);
          setMovimientosFlujo(Array.isArray(dataFlujo) ? dataFlujo : []);

          setConnectionType('local_postgres');
          setIsLoaded(true);
          return;
        }
      } catch (err) {
        console.warn('API local no disponible, usando almacenamiento local por usuario:', err);
      }

      if (isCancelled) return;

      // Prioridad 3: Fallback a LocalStorage aislado por userId
      if (typeof window !== 'undefined') {
        const keys = getUserStorageKeys(userId);
        const savedCfg = localStorage.getItem(keys.CONFIG);
        const savedDeudas = localStorage.getItem(keys.DEUDAS);
        const savedBitacora = localStorage.getItem(keys.BITACORA);

        setConfig(savedCfg ? JSON.parse(savedCfg) : CONFIG_INICIAL);
        setDeudas(savedDeudas ? JSON.parse(savedDeudas) : []);
        setBitacora(savedBitacora ? JSON.parse(savedBitacora) : []);
      }
      setConnectionType('local_storage');
      setIsLoaded(true);
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, isAuthenticated, isAuthLoading]);

  // 2. Guardar en LocalStorage solo en modo local_storage y aislado por userId
  useEffect(() => {
    if (!isLoaded || !isAuthenticated || !user?.id || connectionType !== 'local_storage' || typeof window === 'undefined') {
      return;
    }
    const keys = getUserStorageKeys(user.id);
    localStorage.setItem(keys.CONFIG, JSON.stringify(config));
    localStorage.setItem(keys.DEUDAS, JSON.stringify(deudas));
    localStorage.setItem(keys.BITACORA, JSON.stringify(bitacora));
  }, [config, deudas, bitacora, isLoaded, isAuthenticated, user?.id, connectionType]);

  // 3. Cálculos reactivos con useMemo
  const deudasConSaldo = useMemo(() => {
    return calcularSaldosActuales(deudas, bitacora);
  }, [deudas, bitacora]);

  const simulacion = useMemo(() => {
    return simularBolaDeNieve(deudasConSaldo, config);
  }, [deudasConSaldo, config]);

  const deudaTotalOriginal = useMemo(() => {
    return deudas.reduce((sum, d) => sum + Number(d.saldo_inicial || 0), 0);
  }, [deudas]);

  const deudaTotalActual = useMemo(() => {
    return deudasConSaldo.reduce((sum, d) => sum + d.saldo_actual, 0);
  }, [deudasConSaldo]);

  const porcentajeAvanceGlobal = useMemo(() => {
    if (deudaTotalOriginal <= 0) return 100;
    const pagado = deudaTotalOriginal - deudaTotalActual;
    return Math.min(100, Math.max(0, (pagado / deudaTotalOriginal) * 100));
  }, [deudaTotalOriginal, deudaTotalActual]);

  const pagoTotalMensualBase = useMemo(() => {
    const sumaMinimosActivos = deudasConSaldo
      .filter((d) => !d.esta_liquidada)
      .reduce((sum, d) => sum + d.pago_minimo, 0);
    return sumaMinimosActivos + Number(config.pago_extra_mensual || 0);
  }, [deudasConSaldo, config.pago_extra_mensual]);

  const [currentMonth, setCurrentMonth] = useState<number>(11);
  const [currentYear, setCurrentYear] = useState<number>(2026);

  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Requerido por Next.js 16 para evitar new Date() en prerender estatico
    setCurrentMonth(d.getMonth() + 1);
    setCurrentYear(d.getFullYear());
  }, []);

  const resumenFlujoMes = useMemo<ResumenFlujoMes>(() => {
    const mesActual = currentMonth;
    const anioActual = currentYear;

    const movimientosDelMes = movimientosFlujo.filter((m) => {
      if (!m.fecha) return false;
      const partes = m.fecha.split('-');
      if (partes.length < 2) return false;
      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      return anio === anioActual && mes === mesActual;
    });

    const total_ingresos = movimientosDelMes
      .filter((m) => m.tipo === 'Ingreso')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const gastos_vida = movimientosDelMes
      .filter((m) => m.tipo === 'Gasto' && m.categoria !== 'Pago de Tarjeta / Crédito')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const pagos_reales_tarjetas = movimientosDelMes
      .filter((m) => m.tipo === 'Gasto' && m.categoria === 'Pago de Tarjeta / Crédito')
      .reduce((sum, m) => sum + Number(m.monto || 0), 0);

    const total_gastos = gastos_vida + pagos_reales_tarjetas;

    const compromiso_minimos_deuda = deudasConSaldo
      .filter((d) => !d.esta_liquidada)
      .reduce((sum, d) => sum + Number(d.pago_minimo || 0), 0);

    const flujo_neto_disponible =
      total_ingresos - gastos_vida - Math.max(compromiso_minimos_deuda, pagos_reales_tarjetas);

    const tasa_ahorro_porcentaje =
      total_ingresos > 0
        ? Math.max(0, Math.round((flujo_neto_disponible / total_ingresos) * 100))
        : 0;

    return {
      mes_calendario: mesActual,
      anio: anioActual,
      total_ingresos,
      total_gastos,
      compromiso_minimos_deuda,
      flujo_neto_disponible,
      tasa_ahorro_porcentaje,
    };
  }, [movimientosFlujo, deudasConSaldo, currentMonth, currentYear]);

  // 4. Operaciones CRUD con sincronización
  const updateConfig = async (nuevaConfig: Partial<ConfiguracionUsuario>) => {
    const updated = { ...config, ...nuevaConfig, ...(user?.id ? { user_id: user.id } : {}) };
    setConfig(updated);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('configuracion_usuario').upsert({ ...updated, user_id: user.id });
      } catch (e) {
        console.error('Error al guardar config en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/config', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
      } catch (e) {
        console.error('Error al guardar config en base local:', e);
      }
    }
  };

  const addDeuda = async (nuevaDeuda: Omit<Deuda, 'id' | 'created_at'>) => {
    const id = `d-${Date.now()}`;
    const debtObj: Deuda = {
      ...nuevaDeuda,
      id,
      ...(user?.id ? { user_id: user.id } : {}),
      created_at: new Date().toISOString(),
    };
    setDeudas((prev) => [...prev, debtObj]);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('deudas').insert({ ...debtObj, user_id: user.id });
      } catch (e) {
        console.error('Error al insertar deuda en Supabase:', e);
      }
    } else {
      try {
        const res = await fetch('/api/deudas', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debtObj),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.id && json.id !== id) {
            setDeudas((prev) => prev.map((d) => (d.id === id ? { ...d, id: json.id } : d)));
          }
        }
      } catch (e) {
        console.error('Error al insertar deuda en base local:', e);
      }
    }
  };

  const updateDeuda = async (deudaActualizada: Deuda) => {
    setDeudas((prev) =>
      prev.map((d) => (d.id === deudaActualizada.id ? deudaActualizada : d))
    );

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase
          .from('deudas')
          .update(deudaActualizada)
          .eq('id', deudaActualizada.id)
          .eq('user_id', user.id);
      } catch (e) {
        console.error('Error al actualizar deuda en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/deudas', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deudaActualizada),
        });
      } catch (e) {
        console.error('Error al actualizar deuda en base local:', e);
      }
    }
  };

  const deleteDeuda = async (deudaId: string) => {
    setDeudas((prev) => prev.filter((d) => d.id !== deudaId));
    setBitacora((prev) => prev.filter((p) => p.deuda_id !== deudaId));

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('deudas').delete().eq('id', deudaId).eq('user_id', user.id);
      } catch (e) {
        console.error('Error al eliminar deuda en Supabase:', e);
      }
    } else {
      try {
        await fetch(`/api/deudas?id=${deudaId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Error al eliminar deuda en base local:', e);
      }
    }
  };

  const addPago = async (nuevoPago: Omit<BitacoraPago, 'id' | 'created_at'>) => {
    const id = `p-${Date.now()}`;
    const paymentObj: BitacoraPago = {
      ...nuevoPago,
      id,
      ...(user?.id ? { user_id: user.id } : {}),
      created_at: new Date().toISOString(),
    };
    setBitacora((prev) => [paymentObj, ...prev]);

    // Buscar nombre de la tarjeta para descripción amigable
    const deuda = deudas.find((d) => d.id === nuevoPago.deuda_id);
    const nombreTarjeta = deuda ? deuda.nombre_tarjeta : 'Tarjeta / Crédito';

    // Reflejar inmediatamente en Flujo de Caja como Gasto
    const flujoId = `flujo-pago-${id}`;
    const movFlujo: MovimientoFlujo = {
      id: flujoId,
      ...(user?.id ? { user_id: user.id } : {}),
      tipo: 'Gasto',
      categoria: 'Pago de Tarjeta / Crédito',
      descripcion: `Abono a ${nombreTarjeta} (${nuevoPago.tipo_pago})`,
      monto: Number(nuevoPago.monto_total),
      fecha: nuevoPago.fecha_pago,
      es_recurrente: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMovimientosFlujo((prev) => [movFlujo, ...prev]);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('bitacora_pagos').insert({ ...paymentObj, user_id: user.id });
        await supabase.from('movimientos_flujo').insert({ ...movFlujo, user_id: user.id });
      } catch (e) {
        console.error('Error al registrar pago en Supabase:', e);
      }
    } else {
      try {
        const res = await fetch('/api/pagos', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentObj),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.id && json.id !== id) {
            const serverFlujoId = `flujo-pago-${json.id}`;
            setBitacora((prev) => prev.map((p) => (p.id === id ? { ...p, id: json.id } : p)));
            setMovimientosFlujo((prev) =>
              prev.map((m) => (m.id === flujoId ? { ...m, id: serverFlujoId } : m))
            );
          }
        }
      } catch (e) {
        console.error('Error al registrar pago en base local:', e);
      }
    }
  };

  const deletePago = async (pagoId: string) => {
    setBitacora((prev) => prev.filter((p) => p.id !== pagoId));

    // Eliminar también el movimiento vinculado en Flujo de Caja
    const flujoId = `flujo-pago-${pagoId}`;
    setMovimientosFlujo((prev) => prev.filter((m) => m.id !== flujoId));

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('bitacora_pagos').delete().eq('id', pagoId).eq('user_id', user.id);
        await supabase.from('movimientos_flujo').delete().eq('id', flujoId).eq('user_id', user.id);
      } catch (e) {
        console.error('Error al eliminar pago en Supabase:', e);
      }
    } else {
      try {
        await fetch(`/api/pagos?id=${pagoId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Error al eliminar pago en base local:', e);
      }
    }
  };

  const addMovimientoFlujo = async (nuevoMov: Omit<MovimientoFlujo, 'id' | 'created_at' | 'updated_at'>) => {
    const id = `flujo-${Date.now()}`;
    const movObj: MovimientoFlujo = {
      ...nuevoMov,
      id,
      ...(user?.id ? { user_id: user.id } : {}),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMovimientosFlujo((prev) => [movObj, ...prev]);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('movimientos_flujo').insert({ ...movObj, user_id: user.id });
      } catch (e) {
        console.error('Error al registrar movimiento en Supabase:', e);
      }
    } else {
      try {
        const res = await fetch('/api/flujo', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movObj),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.id && json.id !== id) {
            setMovimientosFlujo((prev) => prev.map((m) => (m.id === id ? { ...m, id: json.id } : m)));
          }
        }
      } catch (e) {
        console.error('Error al registrar movimiento en base local:', e);
      }
    }
  };

  const updateMovimientoFlujo = async (movActualizado: MovimientoFlujo) => {
    setMovimientosFlujo((prev) =>
      prev.map((m) => (m.id === movActualizado.id ? movActualizado : m))
    );

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase
          .from('movimientos_flujo')
          .update(movActualizado)
          .eq('id', movActualizado.id)
          .eq('user_id', user.id);
      } catch (e) {
        console.error('Error al actualizar movimiento en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/flujo', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movActualizado),
        });
      } catch (e) {
        console.error('Error al actualizar movimiento en base local:', e);
      }
    }
  };

  const deleteMovimientoFlujo = async (id: string) => {
    setMovimientosFlujo((prev) => prev.filter((m) => m.id !== id));

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase && user?.id) {
      try {
        await supabase.from('movimientos_flujo').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.error('Error al eliminar movimiento en Supabase:', e);
      }
    } else {
      try {
        await fetch(`/api/flujo?id=${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (e) {
        console.error('Error al eliminar movimiento en base local:', e);
      }
    }
  };

  const resetToDemo = () => {
    setConfig(CONFIG_INICIAL);
    setDeudas(DEUDAS_INICIALES);
    setBitacora(BITACORA_INICIAL);
    if (typeof window !== 'undefined' && user?.id) {
      const keys = getUserStorageKeys(user.id);
      localStorage.removeItem(keys.CONFIG);
      localStorage.removeItem(keys.DEUDAS);
      localStorage.removeItem(keys.BITACORA);
    }
  };

  return (
    <SnowballContext.Provider
      value={{
        config,
        deudas,
        bitacora,
        deudasConSaldo,
        simulacion,
        isLoaded,
        connectionType,
        deudaTotalActual,
        deudaTotalOriginal,
        porcentajeAvanceGlobal,
        pagoTotalMensualBase,
        movimientosFlujo,
        resumenFlujoMes,
        updateConfig,
        addDeuda,
        updateDeuda,
        deleteDeuda,
        addPago,
        deletePago,
        addMovimientoFlujo,
        updateMovimientoFlujo,
        deleteMovimientoFlujo,
        resetToDemo,
      }}
    >
      {children}
    </SnowballContext.Provider>
  );
}

export function useSnowball() {
  const context = useContext(SnowballContext);
  if (!context) {
    throw new Error('useSnowball debe usarse dentro de SnowballProvider');
  }
  return context;
}
