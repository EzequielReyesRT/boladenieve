'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn,
  UserCheck
} from 'lucide-react';

export function LoginPage() {
  const { login, loginAsGuest, register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    fetch('/api/auth/register', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || typeof data.registrationEnabled !== 'boolean') {
          return;
        }
        setRegistrationEnabled(data.registrationEnabled);
        if (!data.registrationEnabled) {
          setMode('login');
        }
      })
      .catch(() => {
        // Mantener valor por defecto si falla la consulta
      });

    return () => {
      active = false;
    };
  }, []);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setErrorMessage(null);
    setIsGuestLoading(true);
    const result = await loginAsGuest();
    if (!result.success) {
      setErrorMessage(result.error || 'No se pudo iniciar sesión como invitado.');
    }
    setIsGuestLoading(false);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    if (newMode === 'register' && !registrationEnabled) {
      return;
    }
    setMode(newMode);
    setErrorMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'login') {
      if (!username.trim() || !password) {
        setErrorMessage('Por favor completa todos los campos.');
        return;
      }

      setIsLoading(true);
      const result = await login(username.trim(), password, rememberMe);

      if (!result.success) {
        setErrorMessage(result.error || 'Credenciales no válidas.');
        setIsLoading(false);
      }
    } else {
      // Registro
      if (!nombre.trim()) {
        setErrorMessage('Por favor ingresa tu nombre completo.');
        return;
      }

      if (!username.trim()) {
        setErrorMessage('Por favor ingresa un correo o usuario válido.');
        return;
      }

      if (password.length < 8) {
        setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden.');
        return;
      }

      setIsLoading(true);
      const result = await register(nombre.trim(), username.trim(), password);

      if (!result.success) {
        setErrorMessage(result.error || 'Error al crear la cuenta.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Cambiar tema"
          className="p-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all shadow-xs"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center shadow-xs text-white">
            <TrendingDown className="w-7 h-7 text-white" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-1">
            Bola de Nieve
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {mode === 'login'
              ? 'Control de deudas, cascada acelerada y libertad financiera.'
              : 'Comienza hoy tu plan acelerado para liquidar tus deudas.'}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-7 shadow-sm">
          {/* Selector de Pestañas Login / Registro */}
          {registrationEnabled && (
            <div className="flex p-1 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl mb-5">
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  mode === 'login'
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                  mode === 'register'
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registrarse</span>
              </button>
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear nueva cuenta'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {mode === 'login'
                ? 'Ingresa tus credenciales para acceder al simulador.'
                : 'Registra tus datos para comenzar tu bitácora personalizada.'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Campo Nombre Completo (Solo en modo Registro) */}
            {mode === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej. Juan Pérez"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Campo Usuario / Correo */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                {mode === 'register' ? 'Correo Electrónico o Usuario' : 'Usuario o Correo'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  {mode === 'register' ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={mode === 'register' ? 'correo@ejemplo.com' : 'ej. usuario o correo...'}
                  required
                  autoFocus={mode === 'login'}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Contraseña (Solo en modo Registro) */}
            {mode === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Checkbox Recordar (Solo en Login) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--border-subtle)] text-[var(--brand-primary)] focus-visible:ring-[var(--brand-primary)] w-4 h-4"
                  />
                  <span>Recordar sesión (30 días)</span>
                </label>
              </div>
            )}

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={isLoading || isGuestLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-xs flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
            >
              {isLoading || isGuestLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{mode === 'login' ? 'Verificando...' : 'Creando cuenta...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Ingresar al Sistema' : 'Completar Registro'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading || isGuestLoading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl font-semibold text-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-card)] active:scale-98 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              {isGuestLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--text-muted)]/30 border-t-[var(--text-primary)] rounded-full animate-spin" />
                  <span>Iniciando acceso invitado...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Acceso Invitado</span>
                </>
              )}
            </button>
          )}

          {/* Enlace para cambiar de modo al pie o aviso de registro deshabilitado */}
          <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
            {!registrationEnabled ? (
              <div className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <Lock className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                <span>El registro de nuevos usuarios no está permitido por el momento.</span>
              </div>
            ) : mode === 'login' ? (
              <p>
                ¿No tienes una cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="font-bold text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded transition-colors"
                >
                  Regístrate aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya tienes una cuenta registrada?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="font-bold text-[var(--brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded transition-colors"
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Cifrado BCrypt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Base de Datos Segura</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>IIS 8083</span>
          </div>
        </div>
      </div>
    </div>
  );
}
