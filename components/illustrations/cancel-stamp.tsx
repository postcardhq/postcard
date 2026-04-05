export function CancelStamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="var(--postal-red)"
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="var(--postal-red)"
        strokeWidth="1.2"
      />
      <circle
        cx="60"
        cy="60"
        r="37"
        stroke="var(--postal-red)"
        strokeWidth="1"
      />
      {[40, 50, 60, 70, 80].map((y) => (
        <line
          key={y}
          x1="5"
          y1={y}
          x2="115"
          y2={y}
          stroke="var(--postal-red)"
          strokeWidth="2.5"
        />
      ))}
      <path id="cancel-top" d="M 18,55 A 42,42 0 0,1 102,55" fill="none" />
      <path id="cancel-bot" d="M 18,65 A 42,42 0 0,0 102,65" fill="none" />
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif)"
      >
        <textPath href="#cancel-top" startOffset="8%">
          POSTCARD FORENSICS
        </textPath>
      </text>
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif)"
      >
        <textPath href="#cancel-bot" startOffset="8%">
          VERIFIED ✦ AUTHENTICATED
        </textPath>
      </text>
    </svg>
  );
}

export function SmallCancelStamp({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="37"
        stroke="var(--postal-red)"
        strokeWidth="1"
      />
      <line
        x1="5"
        y1="42"
        x2="95"
        y2="42"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <line
        x1="5"
        y1="50"
        x2="95"
        y2="50"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <line
        x1="5"
        y1="58"
        x2="95"
        y2="58"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <path id="stamp-arc-top" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
      <path id="stamp-arc-bot" d="M 15,50 A 35,35 0 0,0 85,50" fill="none" />
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif), serif"
        letterSpacing="2"
      >
        <textPath href="#stamp-arc-top" startOffset="10%">
          POSTCARD · FORENSICS
        </textPath>
      </text>
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif), serif"
        letterSpacing="2"
      >
        <textPath href="#stamp-arc-bot" startOffset="15%">
          LAB · EST. 2026 ·
        </textPath>
      </text>
    </svg>
  );
}
