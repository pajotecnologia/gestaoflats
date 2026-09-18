'use client';

import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        className:
          '!bg-zinc-900/95 !text-zinc-100 !border-zinc-800 !backdrop-blur-md !shadow-2xl !rounded-2xl !p-4 !font-sans',
        descriptionClassName: '!text-zinc-400 !text-xs',
        actionButtonStyle: {
          background: '#6366f1',
          color: '#ffffff',
          borderRadius: '0.75rem',
          fontWeight: '600',
        },
        cancelButtonStyle: {
          background: '#27272a',
          color: '#e4e4e7',
          borderRadius: '0.75rem',
          fontWeight: '600',
        },
      }}
    />
  );
}
