import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  fullWidth?: boolean
}

const base = [
  'inline-flex items-center justify-center font-semibold rounded-2xl',
  'transition-all duration-150 tap-highlight-none',
  'active:scale-[0.97] active:opacity-90',
  'disabled:opacity-40 disabled:pointer-events-none',
].join(' ')

const variants: Record<Variant, string> = {
  primary:     'bg-accent text-white shadow-sm',
  secondary:   'bg-surface-muted text-warm-900',
  ghost:       'text-accent',
  destructive: 'bg-red-50 text-red-600',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2.5 text-sm',
  md: 'px-5 py-3.5 text-[15px]',
  lg: 'px-6 py-4 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
