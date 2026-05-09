interface Props {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'reserve'
}

export function Badge({ children, variant = 'default' }: Props) {
  const styles = {
    default: 'bg-zinc-100 text-zinc-600',
    accent:  'bg-accent-subtle text-accent',
    reserve: 'bg-amber-50 text-amber-700',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${styles[variant]}`}>
      {children}
    </span>
  )
}
