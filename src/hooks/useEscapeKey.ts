'use client';

import { useEffect } from 'react';

/**
 * Hook para capturar la pulsación de la tecla Escape y disparar un callback de cierre.
 * Conforme a Modern Web Guidance (platform-controls-dismiss-dialog).
 * Registra y limpia automáticamente el listener de teclado.
 */
export function useEscapeKey(isOpen: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEscape]);
}
