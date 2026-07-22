import type { ReactNode, CSSProperties } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'amber' | 'teal' | 'lav' | 'coral' | 'slate' | 'green';
  style?: CSSProperties;
}

const COLORS = {
  amber: { bg: 'var(--amber-dim)', color: 'var(--amber)' },
  teal:  { bg: 'var(--teal-dim)',  color: 'var(--teal)' },
  lav:   { bg: 'var(--lav-dim)',   color: 'var(--lav)' },
  coral: { bg: 'rgba(226,96,63,0.12)',   color: 'var(--coral)' },
  slate: { bg: 'rgba(107,122,141,0.12)', color: 'var(--slate)' },
  green: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
};

export function Badge({ children, variant = 'slate', style }: BadgeProps) {
  const c = COLORS[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        background: c.bg,
        color: c.color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function BlockTypeBadge({ type }: { type: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    cat: 'amber', tech: 'teal', health: 'lav', admin: 'slate', opt: 'slate',
  };
  return <Badge variant={map[type] || 'slate'}>{type.toUpperCase()}</Badge>;
}
