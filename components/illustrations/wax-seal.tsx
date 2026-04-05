export function WaxSeal() {
  return (
    <div className="wax-seal-active flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
        <circle cx="26" cy="26" r="24" fill="var(--postal-wax)" />
        <circle
          cx="26"
          cy="26"
          r="20"
          fill="none"
          stroke="rgba(244,192,90,0.5)"
          strokeWidth="1"
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          const rad = (angle * Math.PI) / 180;
          const x = 26 + 16 * Math.cos(rad);
          const y = 26 + 16 * Math.sin(rad);
          return (
            <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(244,192,90,0.6)" />
          );
        })}
        <text
          x="26"
          y="32"
          textAnchor="middle"
          fill="#f4c05a"
          fontSize="18"
          fontFamily="var(--font-display), serif"
          fontWeight="700"
          fontStyle="italic"
        >
          P
        </text>
      </svg>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{
          color: "var(--postal-ink-muted)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Postal Service Active
      </span>
    </div>
  );
}
