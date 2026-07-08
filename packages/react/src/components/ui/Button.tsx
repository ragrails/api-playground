import React from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-contrast hover:bg-primary-hover',
  secondary: 'text-content border border-border hover:bg-surface-2',
  ghost: 'bg-transparent text-muted hover:text-content',
  danger: 'bg-[#EF5350] text-white hover:bg-[#e53935]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'text-[12px] px-3 py-1',
  md: 'text-[14px] px-4 py-1.5',
  lg: 'text-[16px] px-5 py-2',
};

const gaps: Record<ButtonSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}) => (
  <button
    className={cn(
      'group relative isolate overflow-hidden rounded-lg font-heading font-medium',
      'inline-flex items-center justify-center whitespace-nowrap',
      'transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      'active:scale-105 motion-reduce:active:scale-100',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      sizes[size],
      className,
    )}
    disabled={disabled || isLoading}
    {...props}
  >
    {/* Shimmer: a diagonal gleam that sweeps across on hover */}
    {variant !== 'ghost' && (
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 -translate-x-full -skew-x-12',
          'bg-gradient-to-r from-transparent via-white/25 to-transparent',
          'transition-transform duration-0 ease-out',
          'group-hover:translate-x-full group-hover:duration-[1200ms] group-disabled:hidden',
        )}
      />
    )}
    <span className={cn('inline-flex items-center', gaps[size])}>
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}
      <span
        className={cn(
          variant === 'ghost' &&
            'bg-gradient-to-r from-muted via-content to-muted bg-[length:200%_100%] bg-clip-text group-hover:text-transparent group-hover:[animation:text-shimmer_1.2s_linear_1_forwards]',
        )}
      >
        {children}
      </span>
      {!isLoading && rightIcon}
    </span>
  </button>
);
