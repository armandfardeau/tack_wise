import type { SVGProps } from 'react';

interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** The Mark-Room Cut monogram: TW inside a tactical mark-room zone. */
export default function BrandMark({ size = 24, ...props }: BrandMarkProps) {
  return (
    <svg
      {...props}
      className={`brand-mark${props.className ? ` ${props.className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={props.role ?? 'img'}
      aria-label={props['aria-label'] ?? 'Tack Wise mark'}
    >
      <circle cx="32" cy="32" r="28" fill="#0B1322" stroke="#06B6D4" strokeWidth="3.5" />
      <circle cx="32" cy="32" r="21" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="4 5" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill="#F8FAFC"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="24"
        fontWeight="900"
        letterSpacing="-3"
      >
        T<tspan fill="#06B6D4">W</tspan>
      </text>
      <path d="M18 46L24 40" stroke="#F43F5E" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M24 40L18 41L23 46Z" fill="#F43F5E" />
    </svg>
  );
}
