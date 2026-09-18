import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'sm',
      dot = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default:
        'bg-zinc-800/80 text-zinc-300 border-zinc-700/60 shadow-xs',
      success:
        'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-xs shadow-emerald-500/10',
      warning:
        'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-xs shadow-amber-500/10',
      error:
        'bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-xs shadow-rose-500/10',
      info:
        'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-xs shadow-cyan-500/10',
      purple:
        'bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-xs shadow-violet-500/10',
    };

    const dotColors = {
      default: 'bg-zinc-400',
      success: 'bg-emerald-400',
      warning: 'bg-amber-400',
      error: 'bg-rose-400',
      info: 'bg-cyan-400',
      purple: 'bg-violet-400',
    };

    const sizes = {
      sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-bold',
      md: 'text-xs px-2.5 py-1 gap-2 font-bold',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border transition-colors select-none font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColors[variant])}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
