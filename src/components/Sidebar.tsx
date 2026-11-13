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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo */}
        <div className="h-18 px-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-700 dark:from-white dark:via-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Bola de Nieve
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Finanzas Inteligentes
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Abono</span>
          </button>

          <button
            onClick={() => {
              onOpenAddDebtModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Agregar Deuda</span>
          </button>
        </div>

        {/* Menú de Navegación Principal */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Módulos
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-emerald-500/15 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-emerald-400 dark:text-emerald-400'
                        : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500/30 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
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
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* Indicador de conexión */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Database
                className={`w-3.5 h-3.5 ${
                  connectionType === 'supabase'
                    ? 'text-emerald-500'
                    : connectionType === 'local_postgres'
                    ? 'text-teal-500'
                    : 'text-amber-500'
                }`}
              />
              <span className="text-[11px] font-medium">
                {connectionType === 'supabase'
                  ? 'Supabase Cloud'
                  : connectionType === 'local_postgres'
                  ? 'Postgres Local'
                  : 'Modo Local'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Fila de controles: Configuración, Tema y Reset */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => {
                onOpenConfigModal();
                setIsOpenMobile(false);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              title="Configuración de Aceleradores"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Ajustes</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
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
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Limpiar datos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tarjeta de Usuario Activo y Cerrar Sesión */}
          {user && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2.5 min-w-0 pr-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm">
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
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user.nombre || user.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase">
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
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
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
