interface CloudProps {
  cx: number;
  cy: number;
  scale?: number;
  delay?: number;
  driftClass?: string;
}

export function Cloud({
  cx,
  cy,
  scale = 1,
  delay = 0,
  driftClass = "cloud-drift",
}: CloudProps) {
  return (
    <g
      transform={`translate(${cx},${cy}) scale(${scale})`}
      style={{
        animation: `${driftClass} ${14 + delay}s ease-in-out infinite alternate`,
      }}
    >
      <ellipse
        cx="0"
        cy="0"
        rx="36"
        ry="20"
        fill="var(--postal-cloud)"
        opacity="0.88"
      />
      <ellipse
        cx="26"
        cy="-9"
        rx="26"
        ry="17"
        fill="var(--postal-cloud)"
        opacity="0.84"
      />
      <ellipse
        cx="-24"
        cy="-5"
        rx="20"
        ry="15"
        fill="var(--postal-cloud)"
        opacity="0.84"
      />
      <ellipse cx="6" cy="-16" rx="16" ry="12" fill="white" opacity="0.65" />
    </g>
  );
}
