import type { SVGProps } from "react";

/**
 * A horizontal-tank piston air compressor, drawn as a technical line illustration
 * (tank + feet, flywheel, ribbed motor housing, a secondary vertical tank, and the
 * connecting pipework) rather than an abstract UI glyph — this is meant to read as
 * "that specific kind of equipment" on a real facility floor plan, the same way the
 * uploaded floor-plan photo itself reads as a real building rather than a diagram.
 * See machineAssets/index.ts for how a machine's type selects one of these.
 *
 * fill/stroke use theme tokens (not fixed colors) so the asset inverts correctly in
 * dark mode, matching every other themed surface in the app.
 */
export function CompressorAsset(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 120" fill="none" {...props}>
      <g
        fill="var(--surface-1)"
        stroke="var(--text-primary)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {/* horizontal air tank */}
        <rect x="6" y="84" width="148" height="24" rx="12" ry="12" />

        {/* feet */}
        <rect x="24" y="108" width="12" height="5" />
        <rect x="20" y="113" width="20" height="4" />
        <rect x="118" y="108" width="12" height="5" />
        <rect x="114" y="113" width="20" height="4" />

        {/* pump housing block the flywheel mounts on */}
        <rect x="40" y="42" width="52" height="42" rx="4" />

        {/* ribbed motor housing */}
        <rect x="92" y="36" width="30" height="48" rx="5" />
        <g strokeWidth="1.6">
          <line x1="95" y1="43" x2="119" y2="43" />
          <line x1="95" y1="49" x2="119" y2="49" />
          <line x1="95" y1="55" x2="119" y2="55" />
          <line x1="95" y1="61" x2="119" y2="61" />
          <line x1="95" y1="67" x2="119" y2="67" />
          <line x1="95" y1="73" x2="119" y2="73" />
          <line x1="95" y1="79" x2="119" y2="79" />
        </g>

        {/* secondary vertical tank, right */}
        <path d="M122 84 L122 24 L130 16 L150 16 L150 84 Z" />
        <line x1="138" y1="16" x2="138" y2="84" strokeWidth="1.4" />

        {/* flywheel */}
        <circle cx="66" cy="58" r="20" />
        <circle cx="66" cy="58" r="7" />

        {/* left elbow pipe down to the tank */}
        <path d="M30 62 L30 50 L40 50" strokeWidth="1.8" />
        <path d="M30 62 L30 84" strokeWidth="1.8" />

        {/* top pipework to the valve cluster and across to the motor */}
        <path d="M48 42 L48 24 L58 24" strokeWidth="2" />
        <line x1="60" y1="24" x2="60" y2="10" strokeWidth="2" />
        <circle cx="60" cy="8" r="2.4" fill="var(--text-primary)" />
        <line x1="68" y1="24" x2="68" y2="10" strokeWidth="2" />
        <circle cx="68" cy="8" r="2.4" fill="var(--text-primary)" />
        <path d="M58 24 L84 24 L84 36" strokeWidth="2" />
      </g>
    </svg>
  );
}
