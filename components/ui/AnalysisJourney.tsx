"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PostcardReport } from "@/src/lib/postcard";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Stage config ──────────────────────────────────── */
export type AnalysisStage = 0 | 1 | 2 | 3 | 4;

interface StageInfo {
  label: string;
  detail: string;
  mailboxX: number; // 0–100 percentage across landscape
}

const STAGES: StageInfo[] = [
  {
    label: "Vision Parse",
    detail: "Extracting text, handles & timestamps…",
    mailboxX: 22,
  },
  {
    label: "Navigator Agent",
    detail: "Building search queries via Gemini…",
    mailboxX: 50,
  },
  {
    label: "Forensic Verifier",
    detail: "Cross-referencing sources & timestamps…",
    mailboxX: 78,
  },
];

const STAGE_DURATIONS = [2800, 3200, 3200]; // ms per stage

/* ── Paper airplane SVG ───────────────────────────── */
function PaperPlane({ className = "" }: { className?: string }) {
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
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.8"
      />
      <polygon
        points="0,32 82,32 52,52"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.8"
      />
      <line
        x1="0"
        y1="32"
        x2="82"
        y2="32"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.7"
      />
      <line
        x1="30"
        y1="20"
        x2="75"
        y2="14"
        stroke="var(--postal-red)"
        strokeWidth="1"
        opacity="0.4"
      />
      <line
        x1="30"
        y1="24"
        x2="75"
        y2="18"
        stroke="var(--postal-blue)"
        strokeWidth="1"
        opacity="0.4"
      />
    </svg>
  );
}

/* ── Cloud ─────────────────────────────────────────── */
function Cloud({
  cx,
  cy,
  scale = 1,
  delay = 0,
}: {
  cx: number;
  cy: number;
  scale?: number;
  delay?: number;
}) {
  return (
    <g
      transform={`translate(${cx},${cy}) scale(${scale})`}
      style={{
        animation: `cloud-drift ${14 + delay}s ease-in-out infinite alternate`,
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

/* ── Mailbox ───────────────────────────────────────── */
function Mailbox({
  active,
  passed,
  stageIndex,
}: {
  active: boolean;
  passed: boolean;
  stageIndex: number;
}) {
  const label = STAGES[stageIndex].label;
  return (
    <g className={active ? "mailbox-glowing" : ""}>
      {/* Post */}
      <rect
        x="18"
        y="44"
        width="4"
        height="22"
        rx="1"
        fill="var(--postal-green-dark)"
      />
      {/* Box body */}
      <rect
        x="4"
        y="26"
        width="32"
        height="20"
        rx="3"
        fill={passed ? "var(--postal-red)" : "#8b6340"}
      />
      {/* Slot */}
      <rect
        x="10"
        y="32"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(0,0,0,0.25)"
      />
      {/* Flag */}
      {passed && (
        <g style={{ animation: "flag-raise 0.4s ease-out both" }}>
          <rect x="36" y="18" width="2" height="12" fill="#c8a060" />
          <polygon points="38,18 38,26 46,22" fill="var(--postal-red)" />
        </g>
      )}
      {/* Glow dot */}
      {active && (
        <circle
          cx="20"
          cy="18"
          r="4"
          fill="var(--postal-amber)"
          opacity="0.9"
        />
      )}
      {/* Label (above) */}
      {(active || passed) && (
        <text
          x="20"
          y="14"
          textAnchor="middle"
          fontSize="7"
          fill={active ? "var(--postal-amber)" : "var(--postal-ink-muted)"}
          fontFamily="var(--font-serif), serif"
          fontStyle="italic"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* ── SSE parser ───────────────────────────────────── */
async function fetchReport(file: File): Promise<PostcardReport> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyses", {
    method: "POST",
    body: formData,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Analysis request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const eventMatch = block.match(/^event: (\w+)/m);
      const dataMatch = block.match(/^data: (.+)/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      const payload = JSON.parse(dataMatch[1]);

      if (event === "complete") return payload.report as PostcardReport;
      if (event === "error") throw new Error(payload.error);
    }
  }

  throw new Error("Stream ended without a result.");
}

/* ── Main AnalysisJourney ─────────────────────────── */

export function AnalysisJourney({
  imageUrl,
  file,
  onComplete,
}: {
  imageUrl: string;
  file: File;
  onComplete: (report: PostcardReport) => void;
}) {
  const [stage, setStage] = useState<AnalysisStage>(0);
  const [animDone, setAnimDone] = useState(false);
  const pendingReport = useRef<PostcardReport | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  /* Animation timer */
  useEffect(() => {
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STAGE_DURATIONS.forEach((dur, i) => {
      elapsed += dur;
      timers.push(
        setTimeout(() => setStage((i + 1) as AnalysisStage), elapsed),
      );
    });
    timers.push(setTimeout(() => setAnimDone(true), elapsed + 1200));
    return () => timers.forEach(clearTimeout);
  }, []);

  /* API call — starts immediately in parallel with animation */
  useEffect(() => {
    fetchReport(file)
      .then((report) => {
        pendingReport.current = report;
        // If animation already finished, fire immediately
        if (animDone) onCompleteRef.current(report);
      })
      .catch((err) => {
        console.error("Analysis failed:", err);
        // Still resolve with null so the user isn't stuck — page handles the error
        if (animDone) onCompleteRef.current(null as unknown as PostcardReport);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /* When animation finishes, fire if report is already back */
  useEffect(() => {
    if (animDone && pendingReport.current) {
      onCompleteRef.current(pendingReport.current);
    }
  }, [animDone]);

  // Airplane x position across the 1200-wide SVG viewBox
  const planeX =
    stage === 0
      ? -60
      : stage === 1
        ? 220
        : stage === 2
          ? 500
          : stage === 3
            ? 780
            : 1300;
  const planeY = stage === 0 ? 160 : 150;

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: `linear-gradient(
          to bottom,
          var(--postal-sky-deep) 0%,
          var(--postal-sky-mid) 30%,
          var(--postal-sky)     55%,
          #c8e8d0               72%,
          var(--postal-paper)   100%
        )`,
      }}
    >
      {/* Landscape SVG */}
      <div className="absolute inset-x-0" style={{ top: "15%" }}>
        <svg
          viewBox="0 0 1200 320"
          className="w-full"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          {/* Clouds */}
          <Cloud cx={100} cy={40} scale={1.1} delay={0} />
          <Cloud cx={450} cy={20} scale={0.8} delay={3} />
          <Cloud cx={800} cy={50} scale={1.0} delay={6} />
          <Cloud cx={1050} cy={25} scale={0.7} delay={2} />
          <Cloud cx={280} cy={70} scale={0.55} delay={9} />

          {/* Far hills */}
          <path
            d="M0,200 C200,140 400,175 600,155 C800,130 1000,168 1200,150 L1200,320 L0,320 Z"
            fill="var(--postal-green-far)"
            opacity="0.65"
          />
          {/* Mid hills */}
          <path
            d="M0,235 C150,195 350,220 550,208 C750,194 950,224 1200,212 L1200,320 L0,320 Z"
            fill="var(--postal-green-mid)"
            opacity="0.75"
          />
          {/* Winding path / road */}
          <path
            d="M0,278 Q300,265 500,272 Q700,278 900,268 Q1050,260 1200,270"
            fill="none"
            stroke="var(--postal-path)"
            strokeWidth="5"
            opacity="0.5"
          />
          {/* Near hill */}
          <path
            d="M0,280 C100,265 300,275 500,270 C700,264 900,278 1200,272 L1200,320 L0,320 Z"
            fill="var(--postal-green-near)"
          />

          {/* Mailboxes */}
          {STAGES.map((s, i) => (
            <g
              key={i}
              transform={`translate(${(s.mailboxX / 100) * 1200 - 20}, 240)`}
            >
              <Mailbox
                stageIndex={i}
                active={stage === i + 1}
                passed={stage > i + 1 || stage === i + 1}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Paper airplane */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ top: "18%" }}
        animate={{
          left: `${((planeX + 60) / 1200) * 100}%`,
          y: planeY - 150,
        }}
        transition={{
          duration: stage === 0 ? 0 : 2.4,
          ease: EASE,
        }}
      >
        <div
          style={{
            animation:
              stage < 4 ? "plane-bob 2.5s ease-in-out infinite" : "none",
          }}
        >
          <PaperPlane className="w-24 h-auto drop-shadow-md" />
        </div>
      </motion.div>

      {/* Stage label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <AnimatePresence mode="wait">
          {stage < 4 && (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="px-5 py-3 rounded-[2px] text-center"
              style={{
                background: "rgba(253,246,227,0.9)",
                border: "1px solid var(--postal-ink-faint)",
                backdropFilter: "blur(4px)",
              }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase mb-0.5"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                {stage === 0 ? "Dispatched" : STAGES[stage - 1]?.label}
              </p>
              <p
                className="text-sm italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                {stage === 0 ? "Evidence en route…" : STAGES[stage - 1]?.detail}
              </p>
            </motion.div>
          )}

          {/* Waiting for API after animation completes */}
          {stage >= 4 && !animDone && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-5 py-3 rounded-[2px] text-center"
              style={{
                background: "rgba(253,246,227,0.9)",
                border: "1px solid var(--postal-ink-faint)",
                backdropFilter: "blur(4px)",
              }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase mb-0.5"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                Finalising
              </p>
              <p
                className="text-sm italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                Your postcard is arriving…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview thumbnail — bottom-right */}
      <motion.div
        className="absolute bottom-6 right-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Evidence preview"
          className="w-16 h-16 object-cover opacity-60"
          style={{ border: "1px solid var(--postal-ink-faint)" }}
        />
      </motion.div>
    </div>
  );
}
