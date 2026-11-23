'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSnowball } from '@/context/SnowballContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Receipt,
  Settings,
  Sun,
  Moon,
  PlusCircle,
  Plus,
  Sparkles,
  Database,
  RotateCcw,
  X,
  LogOut,
  Wallet,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'deudas' | 'flujo' | 'simulador' | 'bitacora';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenPaymentModal: () => void;
  onOpenConfigModal: () => void;
  onOpenAddDebtModal: () => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  isOpenMobile,
  setIsOpenMobile,
  onOpenPaymentModal,
  onOpenConfigModal,
  onOpenAddDebtModal,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { deudasConSaldo, connectionType, resetToDemo } = useSnowball();
  const { user, logout } = useAuth();

  const deudasPendientes = deudasConSaldo.filter((d) => !d.esta_liquidada).length;

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setIsOpenMobile(false);
  };

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Resumen y métricas clave',
    },
    {
      id: 'deudas' as NavTab,
      label: 'Mis Deudas',
      icon: CreditCard,
      badge: deudasPendientes > 0 ? deudasPendientes : null,
      desc: 'Gestión y orden bola de nieve',
    },
    {
      id: 'flujo' as NavTab,
      label: 'Flujo de Caja',
      icon: Wallet,
      badge: null,
      desc: 'Ingresos, gastos y excedente',
    },
    {
      id: 'simulador' as NavTab,
      label: 'Simulador 120m',
      icon: BarChart3,
      badge: null,
      desc: 'Proyección y gráficos',
    },
    {
      id: 'bitacora' as NavTab,
      label: 'Bitácora de Pagos',
      icon: Receipt,
      badge: null,
      desc: 'Registro e historial',
    },
  ];

  return (
    <>
      {/* Backdrop para móvil */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[var(--surface-card)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="h-18 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-sm text-white font-bold">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)]">
                  Bola de Nieve
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                Finanzas Inteligentes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            aria-label="Cerrar menú lateral"
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botones de Acción Rápida */}
        <div className="p-4 pb-2 space-y-2">
          <button
            onClick={() => {
              onOpenPaymentModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 active:scale-98 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Abono</span>
          </button>

          <button
            onClick={() => {
              onOpenAddDebtModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] text-xs font-semibold border border-[var(--border-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-98 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Agregar Deuda</span>
          </button>
        </div>

        {/* Menú de Navegación Principal */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Módulos
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  isActive
                    ? 'bg-[var(--brand-surface)] text-[var(--brand-text)] shadow-xs border-l-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] active:scale-98'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-[var(--brand-primary)]'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                    }`}
                  />
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar: Base de Datos, Configuración y Tema */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          {/* Indicador de conexión */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Database
                className={`w-3.5 h-3.5 ${
                  connectionType === 'supabase'
                    ? 'text-emerald-500'
                    : connectionType === 'local_postgres'
                    ? 'text-teal-500'
                    : 'text-amber-500'
                }`}
              />
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                {connectionType === 'supabase'
                  ? 'Supabase Cloud'
                  : connectionType === 'local_postgres'
                  ? 'Postgres Local'
                  : 'Modo Local'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {/* Fila de controles: Configuración, Tema y Reset */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => {
                onOpenConfigModal();
                setIsOpenMobile(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-98 transition-all"
              title="Configuración de Aceleradores"
            >
              <Settings className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Ajustes</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] active:scale-98 transition-all"
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            <button
              onClick={() => {
                if (confirm('¿Deseas reiniciar la captura y limpiar todos los datos?')) {
                  resetToDemo();
                }
              }}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-98 transition-all"
              title="Limpiar datos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Usuario Activo y Cerrar Sesión */}
          {user && (
            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                    {user.nombre
                      ? user.nombre
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AD'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {user.nombre || user.email}
                    </p>
                    <p className="text-[10px] text-[var(--brand-primary)] font-semibold tracking-wider uppercase">
                      {user.rol || 'Administrador'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm('¿Deseas cerrar tu sesión?')) {
                      logout();
                    }
                  }}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-98 transition-all shrink-0"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
