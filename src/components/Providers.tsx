'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { SnowballProvider } from '@/context/SnowballContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SnowballProvider>{children}</SnowballProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
