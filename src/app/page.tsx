'use client';

import React, { useState } from 'react';
import { useSnowball } from '@/context/SnowballContext';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { Sidebar, NavTab } from '@/components/Sidebar';
import { DashboardWidgets } from '@/components/DashboardWidgets';
import { DeudasView } from '@/components/DeudasView';
import { SnowballSimulatorView } from '@/components/SnowballSimulatorView';
import { PaymentHistoryTable } from '@/components/PaymentHistoryTable';
import { FlujoCajaView } from '@/components/FlujoCajaView';
import { PaymentModal } from '@/components/PaymentModal';
import { DebtModal } from '@/components/DebtModal';
import { ConfigModal } from '@/components/ConfigModal';
import { MovimientoModal } from '@/components/MovimientoModal';
import { DeudaConSaldoActual, MovimientoFlujo, TipoMovimiento } from '@/types';
import {
  Menu,
  Sparkles,
  PlusCircle,
} from 'lucide-react';

export default function Home() {
  const { isLoaded, deudasConSaldo } = useSnowball();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);

  const [selectedDebtForPay, setSelectedDebtForPay] = useState<DeudaConSaldoActual | null>(null);
  const [debtToEdit, setDebtToEdit] = useState<DeudaConSaldoActual | null>(null);
  const [movimientoToEdit, setMovimientoToEdit] = useState<MovimientoFlujo | null>(null);
  const [defaultMovimientoTipo, setDefaultMovimientoTipo] = useState<TipoMovimiento>('Ingreso');

  const handleOpenPay = (deuda?: DeudaConSaldoActual) => {
    setSelectedDebtForPay(deuda || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEdit = (deuda: DeudaConSaldoActual) => {
    setDebtToEdit(deuda);
    setIsDebtModalOpen(true);
  };

  const handleOpenNewDebt = () => {
    setDebtToEdit(null);
    setIsDebtModalOpen(true);
  };

  const handleOpenNewMovimiento = (tipo: TipoMovimiento = 'Ingreso') => {
    setMovimientoToEdit(null);
    setDefaultMovimientoTipo(tipo);
    setIsMovimientoModalOpen(true);
  };

  const handleEditMovimiento = (mov: MovimientoFlujo) => {
    setMovimientoToEdit(mov);
    setDefaultMovimientoTipo(mov.tipo);
    setIsMovimientoModalOpen(true);
  };

  const handleOpenPaymentWithSurplus = () => {
    const deudaObjetivo = deudasConSaldo.find((d) => !d.esta_liquidada) || deudasConSaldo[0];
    setSelectedDebtForPay(deudaObjetivo || null);
    setIsPaymentModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-200">
              Bola de Nieve
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Verificando credenciales...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Cargando simulador Bola de Nieve...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Menú Lateral (Sidebar) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onOpenPaymentModal={() => handleOpenPay()}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenAddDebtModal={handleOpenNewDebt}
      />

      {/* 2. Barra Superior para Dispositivos Móviles (oculta en desktop lg:) */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-[var(--surface-card)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpenMobile(true)}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
              Bola de Nieve
            </span>
          </div>
        </div>

        <button
          onClick={() => handleOpenPay()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Abonar</span>
        </button>
      </div>

      {/* 3. Área de Contenido Principal (con desplazamiento a la derecha del sidebar en desktop lg:pl-72) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-9">
          {/* VISTA 1: DASHBOARD (Solo el Hero y los 4 Widgets de Métricas) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              <DashboardWidgets
                onOpenConfigModal={() => setIsConfigModalOpen(true)}
                onOpenAddDebtModal={handleOpenNewDebt}
                onGoToSimulator={() => setCurrentTab('simulador')}
                onGoToDeudas={() => setCurrentTab('deudas')}
                onGoToFlujo={() => setCurrentTab('flujo')}
              />
            </div>
          )}

          {/* VISTA 2: GESTIÓN DE DEUDAS (Apartado dedicado exclusivo para la lista) */}
          {currentTab === 'deudas' && (
            <DeudasView
              onOpenAddDebtModal={handleOpenNewDebt}
              onPay={(d) => handleOpenPay(d)}
              onEdit={(d) => handleOpenEdit(d)}
            />
          )}

          {/* VISTA 3: FLUJO DE CAJA (Ingresos, Gastos y Excedente) */}
          {currentTab === 'flujo' && (
            <FlujoCajaView
              onOpenNewMovimiento={handleOpenNewMovimiento}
              onEditMovimiento={handleEditMovimiento}
              onOpenPaymentModalWithSurplus={handleOpenPaymentWithSurplus}
            />
          )}

          {/* VISTA 4: SIMULADOR A 120 MESES */}
          {currentTab === 'simulador' && (
            <SnowballSimulatorView onOpenConfigModal={() => setIsConfigModalOpen(true)} />
          )}

          {/* VISTA 5: BITÁCORA DE PAGOS */}
          {currentTab === 'bitacora' && (
            <PaymentHistoryTable onOpenPaymentModal={() => handleOpenPay()} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border-subtle)] bg-[var(--surface-card)]/40 py-5 text-center text-xs text-[var(--text-muted)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-secondary)]">
                Método de la Bola de Nieve
              </span>
              <span>•</span>
              <span>Proyección Predictiva a 120 Meses</span>
            </div>
            <div>
              Almacenamiento Seguro en PostgreSQL Local & Supabase Cloud
            </div>
          </div>
        </footer>
      </div>

      {/* Modales Globales */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedDebt={selectedDebtForPay}
      />

      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debtToEdit={debtToEdit}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      <MovimientoModal
        isOpen={isMovimientoModalOpen}
        onClose={() => setIsMovimientoModalOpen(false)}
        movimientoToEdit={movimientoToEdit}
        defaultTipo={defaultMovimientoTipo}
      />
    </div>
  );
}
