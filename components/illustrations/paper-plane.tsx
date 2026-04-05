export function PaperPlane({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="0,32 120,8 82,32"
        fill="var(--postal-paper)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.8"
      />
      <polygon
        points="0,32 82,32 52,52"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.8"
      />
      <line
        x1="0"
        y1="32"
        x2="82"
        y2="32"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.7"
      />
      <line
        x1="30"
        y1="20"
        x2="75"
        y2="14"
        stroke="var(--postal-red)"
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="30"
        y1="24"
        x2="75"
        y2="18"
        stroke="var(--postal-blue)"
        strokeWidth="1"
        opacity="0.35"
      />
    </svg>
  );
}
