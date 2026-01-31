/**
 * BelizeChain Shared UI Components
 * Culturally-themed reusable components with accessibility
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

// ============================================================================
// Button Components
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-caribbean-600 text-white hover:bg-caribbean-700 focus:ring-caribbean-500 shadow-md hover:shadow-lg',
    secondary: 'bg-maya-600 text-white hover:bg-maya-700 focus:ring-maya-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-caribbean-600 text-caribbean-600 hover:bg-caribbean-50 focus:ring-caribbean-500',
    ghost: 'text-sand-700 hover:bg-sand-100 focus:ring-sand-400',
    danger: 'bg-coral-600 text-white hover:bg-coral-700 focus:ring-coral-500 shadow-md hover:shadow-lg',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-3',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={size} />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

// ============================================================================
// Card Components
// ============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-md border border-sand-200',
        paddingStyles[padding],
        hover && 'transition-all hover:shadow-lg hover:border-caribbean-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-sand-200">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 bg-caribbean-100 rounded-lg text-caribbean-600">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-sand-900">{title}</h3>
          {subtitle && <p className="text-sm text-sand-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ============================================================================
// Badge Components
// ============================================================================

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', dot = false, className }: BadgeProps) {
  const variantStyles = {
    success: 'bg-jungle-100 text-jungle-700 border-jungle-200',
    warning: 'bg-maya-100 text-maya-800 border-maya-200',
    error: 'bg-coral-100 text-coral-700 border-coral-200',
    info: 'bg-caribbean-100 text-caribbean-700 border-caribbean-200',
    neutral: 'bg-sand-100 text-sand-700 border-sand-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const dotStyles = {
    success: 'bg-jungle-500',
    warning: 'bg-maya-500',
    error: 'bg-coral-500',
    info: 'bg-caribbean-500',
    neutral: 'bg-sand-500',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={clsx('w-2 h-2 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
}

// ============================================================================
// Input Components
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-sand-700 mb-1.5">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-500">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2 bg-white border rounded-lg transition-all',
              'text-sand-900 placeholder:text-sand-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              hasError
                ? 'border-coral-500 focus:ring-coral-500'
                : 'border-sand-300 focus:border-caribbean-500 focus:ring-caribbean-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              props.disabled && 'bg-sand-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={clsx(
            'text-sm mt-1.5',
            error ? 'text-coral-600' : 'text-sand-600'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// Select Component
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className, ...props }, ref) => {
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-sand-700 mb-1.5">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-2.5 border rounded-lg',
            'bg-white text-sand-900',
            'focus:ring-2 focus:ring-caribbean-500 focus:border-caribbean-500',
            'transition-colors duration-200',
            hasError && 'border-coral-500 focus:ring-coral-500',
            !hasError && 'border-sand-300',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {helperText && !hasError && (
          <p className="mt-1.5 text-sm text-sand-600">{helperText}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-coral-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================================================
// Switch Component
// ============================================================================

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, label, description, disabled = false }: SwitchProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        {label && (
          <label className="text-sm font-medium text-sand-900">
            {label}
          </label>
        )}
        {description && (
          <p className="text-sm text-sand-600 mt-0.5">{description}</p>
        )}
      </div>
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-caribbean-500 focus:ring-offset-2',
          checked ? 'bg-caribbean-500' : 'bg-sand-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// ============================================================================
// Modal Components
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={clsx(
        'relative bg-white rounded-xl shadow-2xl w-full',
        sizeStyles[size]
      )}>
        {title && (
          <div className="px-6 py-4 border-b border-sand-200">
            <h2 className="text-xl font-bold text-sand-900">{title}</h2>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Spinner
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-t-transparent border-current',
        sizeStyles[size],
        className
      )}
    />
  );
}

// ============================================================================
// Alert Components
// ============================================================================

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

export function Alert({ variant = 'info', title, children, onClose }: AlertProps) {
  const variantStyles = {
    info: {
      bg: 'bg-caribbean-50',
      border: 'border-caribbean-200',
      text: 'text-caribbean-800',
      title: 'text-caribbean-900',
    },
    success: {
      bg: 'bg-jungle-50',
      border: 'border-jungle-200',
      text: 'text-jungle-800',
      title: 'text-jungle-900',
    },
    warning: {
      bg: 'bg-maya-50',
      border: 'border-maya-200',
      text: 'text-maya-800',
      title: 'text-maya-900',
    },
    error: {
      bg: 'bg-coral-50',
      border: 'border-coral-200',
      text: 'text-coral-800',
      title: 'text-coral-900',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={clsx(
      'p-4 rounded-lg border',
      styles.bg,
      styles.border
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && (
            <h4 className={clsx('font-semibold mb-1', styles.title)}>
              {title}
            </h4>
          )}
          <div className={styles.text}>
            {children}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={clsx('ml-4 hover:opacity-70', styles.text)}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'caribbean' | 'jungle' | 'maya' | 'bluehole';
}

export function StatCard({ label, value, icon, trend, color = 'caribbean' }: StatCardProps) {
  const colorStyles = {
    caribbean: 'bg-caribbean-100 text-caribbean-600',
    jungle: 'bg-jungle-100 text-jungle-600',
    maya: 'bg-maya-100 text-maya-700',
    bluehole: 'bg-bluehole-100 text-bluehole-600',
  };

  return (
    <Card padding="md" hover>
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={clsx('p-3 rounded-lg', colorStyles[color])}>
            {icon}
          </div>
        )}
        {trend && (
          <Badge variant={trend.direction === 'up' ? 'success' : 'error'} size="sm">
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Badge>
        )}
      </div>
      
      <div>
        <p className="text-sm text-sand-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-sand-900">{value}</p>
      </div>
    </Card>
  );
}

// ============================================================================
// Skeleton Loaders
// ============================================================================

export function SkeletonText({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse bg-sand-200 rounded', className)} />
  );
}

export function SkeletonCard() {
  return (
    <Card>
      <div className="space-y-4">
        <SkeletonText className="h-6 w-1/3" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-2/3" />
      </div>
    </Card>
  );
}
