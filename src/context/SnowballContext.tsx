'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Deuda,
  BitacoraPago,
  ConfiguracionUsuario,
  DeudaConSaldoActual,
  ResultadoSimulacion,
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
  // Acciones
  updateConfig: (nuevaConfig: Partial<ConfiguracionUsuario>) => Promise<void>;
  addDeuda: (nuevaDeuda: Omit<Deuda, 'id' | 'created_at'>) => Promise<void>;
  updateDeuda: (deudaActualizada: Deuda) => Promise<void>;
  deleteDeuda: (deudaId: string) => Promise<void>;
  addPago: (nuevoPago: Omit<BitacoraPago, 'id' | 'created_at'>) => Promise<void>;
  deletePago: (pagoId: string) => Promise<void>;
  resetToDemo: () => void;
}

const SnowballContext = createContext<SnowballContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  CONFIG: 'snowball_config_v1',
  DEUDAS: 'snowball_deudas_v1',
  BITACORA: 'snowball_bitacora_v1',
};

export function SnowballProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfiguracionUsuario>(CONFIG_INICIAL);
  const [deudas, setDeudas] = useState<Deuda[]>(DEUDAS_INICIALES);
  const [bitacora, setBitacora] = useState<BitacoraPago[]>(BITACORA_INICIAL);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<'supabase' | 'local_postgres' | 'local_storage'>('local_postgres');

  // 1. Cargar datos iniciales
  useEffect(() => {
    async function loadData() {
      // Prioridad 1: Supabase si están las credenciales
      if (isSupabaseConfigured && supabase) {
        try {
          const [cfgRes, deudasRes, bitacoraRes] = await Promise.all([
            supabase.from('configuracion_usuario').select('*').limit(1).single(),
            supabase.from('deudas').select('*').order('saldo_inicial', { ascending: true }),
            supabase.from('bitacora_pagos').select('*').order('fecha_pago', { ascending: false }),
          ]);

          if (cfgRes.data) setConfig(cfgRes.data);
          if (Array.isArray(deudasRes.data)) setDeudas(deudasRes.data);
          if (Array.isArray(bitacoraRes.data)) setBitacora(bitacoraRes.data);
          setConnectionType('supabase');
          setIsLoaded(true);
          return;
        } catch (err) {
          console.warn('Supabase no disponible, intentando base de datos local:', err);
        }
      }

      // Prioridad 2: Base de datos PostgreSQL local via API de desarrollo
      try {
        const [resCfg, resDeudas, resBitacora] = await Promise.all([
          fetch('/api/config'),
          fetch('/api/deudas'),
          fetch('/api/pagos'),
        ]);

        if (resCfg.ok && resDeudas.ok && resBitacora.ok) {
          const dataCfg = await resCfg.json();
          const dataDeudas = await resDeudas.json();
          const dataBitacora = await resBitacora.json();

          if (dataCfg) setConfig(dataCfg);
          if (Array.isArray(dataDeudas)) setDeudas(dataDeudas);
          if (Array.isArray(dataBitacora)) setBitacora(dataBitacora);

          setConnectionType('local_postgres');
          setIsLoaded(true);
          return;
        }
      } catch (err) {
        console.warn('API local no disponible, usando almacenamiento local:', err);
      }

      // Prioridad 3: Fallback a LocalStorage o Mock Inicial
      if (typeof window !== 'undefined') {
        const savedCfg = localStorage.getItem(LOCAL_STORAGE_KEYS.CONFIG);
        const savedDeudas = localStorage.getItem(LOCAL_STORAGE_KEYS.DEUDAS);
        const savedBitacora = localStorage.getItem(LOCAL_STORAGE_KEYS.BITACORA);

        if (savedCfg) setConfig(JSON.parse(savedCfg));
        if (savedDeudas) setDeudas(JSON.parse(savedDeudas));
        if (savedBitacora) setBitacora(JSON.parse(savedBitacora));
      }
      setConnectionType('local_storage');
      setIsLoaded(true);
    }

    loadData();
  }, []);

  // 2. Guardar en LocalStorage como respaldo adicional
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONFIG, JSON.stringify(config));
    localStorage.setItem(LOCAL_STORAGE_KEYS.DEUDAS, JSON.stringify(deudas));
    localStorage.setItem(LOCAL_STORAGE_KEYS.BITACORA, JSON.stringify(bitacora));
  }, [config, deudas, bitacora, isLoaded]);

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

  // 4. Operaciones CRUD con sincronización
  const updateConfig = async (nuevaConfig: Partial<ConfiguracionUsuario>) => {
    const updated = { ...config, ...nuevaConfig };
    setConfig(updated);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('configuracion_usuario').upsert(updated);
      } catch (e) {
        console.error('Error al guardar config en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/config', {
          method: 'POST',
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
      created_at: new Date().toISOString(),
    };
    setDeudas((prev) => [...prev, debtObj]);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('deudas').insert(debtObj);
      } catch (e) {
        console.error('Error al insertar deuda en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/deudas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debtObj),
        });
      } catch (e) {
        console.error('Error al insertar deuda en base local:', e);
      }
    }
  };

  const updateDeuda = async (deudaActualizada: Deuda) => {
    setDeudas((prev) =>
      prev.map((d) => (d.id === deudaActualizada.id ? deudaActualizada : d))
    );

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('deudas')
          .update(deudaActualizada)
          .eq('id', deudaActualizada.id);
      } catch (e) {
        console.error('Error al actualizar deuda en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/deudas', {
          method: 'PUT',
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

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('deudas').delete().eq('id', deudaId);
      } catch (e) {
        console.error('Error al eliminar deuda en Supabase:', e);
      }
    } else {
      try {
        await fetch(`/api/deudas?id=${deudaId}`, {
          method: 'DELETE',
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
      created_at: new Date().toISOString(),
    };
    setBitacora((prev) => [paymentObj, ...prev]);

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bitacora_pagos').insert(paymentObj);
      } catch (e) {
        console.error('Error al registrar pago en Supabase:', e);
      }
    } else {
      try {
        await fetch('/api/pagos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentObj),
        });
      } catch (e) {
        console.error('Error al registrar pago en base local:', e);
      }
    }
  };

  const deletePago = async (pagoId: string) => {
    setBitacora((prev) => prev.filter((p) => p.id !== pagoId));

    if (connectionType === 'supabase' && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('bitacora_pagos').delete().eq('id', pagoId);
      } catch (e) {
        console.error('Error al eliminar pago en Supabase:', e);
      }
    } else {
      try {
        await fetch(`/api/pagos?id=${pagoId}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.error('Error al eliminar pago en base local:', e);
      }
    }
  };

  const resetToDemo = () => {
    setConfig(CONFIG_INICIAL);
    setDeudas(DEUDAS_INICIALES);
    setBitacora(BITACORA_INICIAL);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CONFIG);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.DEUDAS);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.BITACORA);
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
        updateConfig,
        addDeuda,
        updateDeuda,
        deleteDeuda,
        addPago,
        deletePago,
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
