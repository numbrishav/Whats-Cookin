interface Props {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}

export function Logo({ size = 'md', showWordmark = true }: Props) {
  const dims = size === 'sm' ? 16 : size === 'md' ? 20 : 26
  const fontSize = size === 'sm' ? 14 : size === 'md' ? 17 : 22
  const fontWeight = 700

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <svg
        width={dims}
        height={Math.round(dims * 1.25)}
        viewBox="0 0 16 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer flame */}
        <path
          d="M8 19C5.24 19 3 16.76 3 14C3 10 6.5 5 8 1C9.5 5 13 10 13 14C13 16.76 10.76 19 8 19Z"
          fill="#E8622A"
        />
        {/* Inner glow — warmth and life */}
        <path
          d="M8 14.5C7.17 14.5 6.5 13.83 6.5 13C6.5 11.8 7.2 10.3 8 9C8.8 10.3 9.5 11.8 9.5 13C9.5 13.83 8.83 14.5 8 14.5Z"
          fill="#FFD4A8"
        />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontSize,
            fontWeight,
            color: '#1C1410',
            letterSpacing: '-0.3px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          }}
        >
          What's Cookin
        </span>
      )}
    </div>
  )
}

export function FlameIcon({ size = 20, color = '#E8622A' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.25)}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 19C5.24 19 3 16.76 3 14C3 10 6.5 5 8 1C9.5 5 13 10 13 14C13 16.76 10.76 19 8 19Z"
        fill={color}
      />
      <path
        d="M8 14.5C7.17 14.5 6.5 13.83 6.5 13C6.5 11.8 7.2 10.3 8 9C8.8 10.3 9.5 11.8 9.5 13C9.5 13.83 8.83 14.5 8 14.5Z"
        fill="white"
        opacity="0.7"
      />
    </svg>
  )
}
