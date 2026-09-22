"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyProvider";

import {
  IconActivity,
  IconAlertTriangle,
  IconAlignment,
  IconBan,
  IconBearing,
  IconBubbles,
  IconClipboard,
  IconCpu,
  IconDroplet,
  IconFitting,
  IconGauge,
  IconHistory,
  IconMail,
  IconPipe,
  IconThermometer,
  IconVolume,
  IconWalk,
  IconWrench,
  IconZap,
} from "@/components/icons";
import { enrichExplanation } from "@/lib/faultGuide";
import { faultImpact, type ImpactIcon, type ImpactLevel, type ImpactStep } from "@/lib/faultImpact";
import type { FaultDiagnosis, FaultEvidence, PurchaseOption, SourcingIntelligence, Telemetry } from "@/lib/types";

const LEVEL_COLOR: Record<ImpactLevel, string> = {
  none: "var(--status-good)",
  low: "var(--status-good)",
  moderate: "var(--status-warning)",
  high: "var(--status-critical)",
  severe: "var(--status-critical)",
};

const BRIEFING = {
  criticality: {
    heading: "text-red-300",
    body: "text-red-100/85",
    muted: "text-red-200/70",
    box: "border-red-800/45 bg-red-950/25",
  },
  artifacts: {
    heading: "text-cyan-300",
    body: "text-cyan-50/90",
    muted: "text-cyan-200/70",
    box: "border-cyan-800/40 bg-cyan-950/20",
  },
  action: {
    heading: "text-amber-300",
    body: "text-amber-50/90",
    muted: "text-amber-200/70",
    box: "border-amber-800/40 bg-amber-950/20",
  },
  downtime: {
    heading: "text-violet-300",
    body: "text-violet-50/90",
    muted: "text-violet-200/70",
    box: "border-violet-800/40 bg-violet-950/20",
  },
  repair: {
    heading: "text-sky-300",
    body: "text-sky-50/90",
    muted: "text-sky-200/70",
    box: "border-sky-800/40 bg-sky-950/20",
  },
  inventory: {
    heading: "text-emerald-300",
    body: "text-emerald-50/90",
    muted: "text-emerald-200/70",
    box: "border-emerald-800/40 bg-emerald-950/20",
  },
} as const;

export type BriefingTone = keyof typeof BRIEFING;

export function BriefingSection({
  title,
  tone,
  children,
}: {
  title: string;
  tone: BriefingTone;
  children: ReactNode;
}) {
  // Headings and body are for a maintenance reader: short, bold, colored by job
  // (criticality / artifacts / action / time / repair / stores).
  const palette = BRIEFING[tone];
  return (
    <section className={`mt-3 rounded-lg border px-3 py-3 first:mt-0 ${palette.box}`}>
      <h3 className={`text-[15px] font-bold leading-tight tracking-tight ${palette.heading}`}>{title}</h3>
      <div className={`mt-2.5 flex flex-col gap-2 text-[13px] leading-6 ${palette.body}`}>{children}</div>
    </section>
  );
}

function usableEvidence(row: FaultEvidence) {
  const v = (row.value || "").toLowerCase();
  if (!row.value) return false;
  if (v.includes("not on this frame") || v === "n/a" || v === "na") return false;
  return true;
}

export function ImpactGlyph({ icon, className }: { icon: ImpactIcon; className?: string }) {
  const cls = className ?? "h-4 w-4";
  if (icon === "leak" || icon === "pipe") return <IconPipe className={cls} />;
  if (icon === "bearing") return <IconBearing className={cls} />;
  if (icon === "align") return <IconAlignment className={cls} />;
  if (icon === "electrical" || icon === "energy") return <IconZap className={cls} />;
  if (icon === "sensor") return <IconCpu className={cls} />;
  if (icon === "thermal") return <IconThermometer className={cls} />;
  if (icon === "time") return <IconHistory className={cls} />;
  if (icon === "fitting") return <IconFitting className={cls} />;
  if (icon === "walk") return <IconWalk className={cls} />;
  if (icon === "soap") return <IconBubbles className={cls} />;
  if (icon === "seal" || icon === "part") return <IconWrench className={cls} />;
  if (icon === "ok") return <IconGauge className={cls} />;
  if (icon === "stop") return <IconAlertTriangle className={cls} />;
  return <IconDroplet className={cls} />;
}

function evidenceIcon(label: string) {
  const s = label.toLowerCase();
  if (s.includes("pressure") || s.includes("bar")) return <IconGauge className="h-4 w-4" />;
  if (s.includes("mic") || s.includes("sound") || s.includes("acoustic")) return <IconVolume className="h-4 w-4" />;
  if (s.includes("temp")) return <IconThermometer className="h-4 w-4" />;
  if (s.includes("vuf") || s.includes("voltage") || s.includes("power") || s.includes("line")) return <IconZap className="h-4 w-4" />;
  if (s.includes("vibration") || s.includes("rms") || s.includes("peak")) return <IconActivity className="h-4 w-4" />;
  if (s.includes("gateway") || s.includes("leak") || s.startsWith("pf")) return <IconDroplet className="h-4 w-4" />;
  if (s.includes("sensor") || s.includes("cable")) return <IconCpu className="h-4 w-4" />;
  return <IconGauge className="h-4 w-4" />;
}

function ArtifactBullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
      <span>{children}</span>
    </li>
  );
}

function PictureCell({
  icon,
  label,
  muted,
}: {
  icon: ReactNode;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-hairline bg-surface-1 px-1.5 py-2.5 text-center">
      <span className={muted ? "text-muted" : "text-primary"}>{icon}</span>
      <span className="w-full truncate text-[11px] font-bold leading-tight text-primary">{label}</span>
    </div>
  );
}

function PictureRow({ steps }: { steps: ImpactStep[] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {steps.map((step) => {
        const notThis = step.label.toLowerCase().startsWith("not ");
        return (
          <PictureCell
            key={step.label}
            muted={notThis}
            icon={
              notThis ? (
                <IconBan className="h-5 w-5" />
              ) : (
                <ImpactGlyph icon={step.icon} className="h-5 w-5" />
              )
            }
            label={step.label}
          />
        );
      })}
    </div>
  );
}

function BuySites({ options }: { options: PurchaseOption[] }) {
  const [showAll, setShowAll] = useState(false);
  if (options.length === 0) return null;
  const visible = showAll ? options : options.slice(0, 3);
  return (
    <div className="flex flex-col gap-1">
      {visible.map((opt) => (
        <a
          key={`${opt.tier}-${opt.name}`}
          href={opt.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-surface-1 px-2 py-1.5 hover:border-accent/60"
        >
          <span className="min-w-0">
            <span className="block truncate text-[12px] font-medium text-primary">{opt.name}</span>
            {opt.what_it_finds ? (
              <span className="block truncate text-[11px] text-muted">{opt.what_it_finds}</span>
            ) : null}
          </span>
          <span className="shrink-0 text-[12px] font-semibold tabular-nums text-secondary">
            {opt.quote_inr != null ? `₹${opt.quote_inr.toLocaleString("en-IN")}` : ""}
            <span className="ml-1.5 font-medium text-accent">Open</span>
          </span>
        </a>
      ))}
      {options.length > 3 && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="self-start text-[12px] font-medium text-accent">
          {showAll ? "Fewer sites" : `+${options.length - 3} more sites`}
        </button>
      )}
    </div>
  );
}

function spareGlyph(name: string | null) {
  const s = (name || "").toLowerCase();
  if (s.includes("6208") || s.includes("bearing")) return <IconBearing className="h-7 w-7" />;
  if (s.includes("qsl") || s.includes("fitting") || s.includes("leak")) return <IconFitting className="h-7 w-7" />;
  if (s.includes("spider") || s.includes("shim")) return <IconAlignment className="h-7 w-7" />;
  return <IconWrench className="h-7 w-7" />;
}

function PartCard({
  partNumber,
  spareName,
}: {
  partNumber: string | null;
  spareName: string | null;
}) {
  const title = partNumber || spareName || "No spare";
  const subtitle = partNumber && spareName && spareName !== partNumber ? spareName : null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-1 px-3 py-3">
      <span className="text-primary">{spareGlyph(title)}</span>
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold text-primary">{title}</div>
        {subtitle && <div className="truncate text-[12px] text-muted">{subtitle}</div>}
      </div>
    </div>
  );
}

function CrmTicket({
  ticketId,
  ticketType,
}: {
  ticketId: string;
  ticketType?: string | null;
}) {
  const { routes } = useCompany();
  const job =
    ticketType === "PM_CONDITION"
      ? "leak walkdown / inspection"
      : "repair";
  const label = /^\d+$/.test(ticketId) ? `SAP ${ticketId}` : ticketId;
  return (
    <Link
      href={routes.crm()}
      className="block rounded-lg border border-hairline bg-surface-1 px-3 py-2.5 hover:border-accent/50"
    >
      <div className="flex items-start gap-2">
        <IconClipboard className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        <div className="min-w-0">
          <div className="text-[12px] text-muted">CRM ticket</div>
          <div className="truncate text-[13px] font-semibold tabular-nums text-primary">{label}</div>
          <p className="mt-1 text-[12px] leading-5 text-secondary">
            Agent Delta opened this work order so the {job} is on the board. It does not mean the spare is in the warehouse.
          </p>
        </div>
      </div>
    </Link>
  );
}

function WarehouseStatus({
  qty,
  bin,
}: {
  qty: number;
  bin?: string | null;
}) {
  const inWarehouse = qty > 0;
  if (inWarehouse) {
    return (
      <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2.5">
        <div className="text-[13px] font-semibold text-emerald-300">In warehouse</div>
        <div className="mt-0.5 text-[13px] text-emerald-100/90">
          {qty} piece{qty === 1 ? "" : "s"}
          {bin ? ` in ${bin}` : ""} — pick from stores.
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-red-800/50 bg-red-950/35 px-3 py-2.5">
      <div className="text-[13px] font-semibold text-red-300">Not in warehouse</div>
      <div className="mt-0.5 text-[13px] text-red-100/80">
        {bin ? `${bin} is empty.` : "No stock on the shelf."} Order from the listings below.
      </div>
    </div>
  );
}

function EmailOemBlock({ diagnosis }: { diagnosis: FaultDiagnosis }) {
  const mail = diagnosis.pipelineDetails?.cmms_work_order?.oem_mail;
  if (!mail?.sent) return null;
  const when = mail.sent_at ? ` at ${new Date(mail.sent_at).toLocaleString()}` : "";
  return (
    <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <IconMail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-emerald-300">An email has been sent</div>
          <p className="mt-0.5 text-[12px] leading-5 text-emerald-100/90">
            The OEM inventory check went out{when}.
          </p>
        </div>
      </div>
    </div>
  );
}

export function InventoryCheckSection({ diagnosis }: { diagnosis: FaultDiagnosis }) {
  const impact = faultImpact(diagnosis);
  const intel = diagnosis.pipelineDetails?.cmms_work_order?.sourcing_intelligence;
  const storesQty = intel?.stores_qty ?? 0;
  const storesBin = intel?.stores_bin;
  const wo = diagnosis.pipelineDetails?.cmms_work_order;
  const ticketId = wo?.work_order_id ? String(wo.work_order_id) : null;
  const ticketType = wo?.ticket_type ? String(wo.ticket_type) : null;

  return (
    <BriefingSection title="Inventory check" tone="inventory">
      {impact.spareShort ? (
        <PartCard partNumber={intel?.oem_part_number || null} spareName={impact.spareShort} />
      ) : (
        <PartCard partNumber={null} spareName="No spare to order" />
      )}
      {impact.spareShort ? (
        <>
          <WarehouseStatus qty={storesQty} bin={storesBin} />
          {ticketId && <CrmTicket ticketId={ticketId} ticketType={ticketType} />}
          {intel?.purchase_options && intel.purchase_options.length > 0 && (
            <BuySites options={intel.purchase_options} />
          )}
        </>
      ) : (
        <>
          {ticketId && <CrmTicket ticketId={ticketId} ticketType={ticketType} />}
          <p>No spare to pick or buy for this code. Fix the diagnosed source (supply, sensor, or alignment) — do not order a bearing by default.</p>
        </>
      )}
      <EmailOemBlock diagnosis={diagnosis} />
    </BriefingSection>
  );
}

export function FaultImpactCards({
  diagnosis,
  telemetry,
  recommendation,
  repairTimes,
}: {
  diagnosis: FaultDiagnosis;
  telemetry: Telemetry | null;
  recommendation?: { title: string; window?: string | null };
  repairTimes?: { intermediate?: string; permanent?: string };
}) {
  const impact = faultImpact(diagnosis);
  const explanation = enrichExplanation(diagnosis, telemetry);
  const color = LEVEL_COLOR[impact.level];
  const evidence = (explanation.evidence ?? []).filter(
    (row) => (row.role === "trigger" || row.role === "supporting") && usableEvidence(row),
  );
  const days = diagnosis.pipelineDetails?.rul_prediction?.rul_days;
  const showLife = typeof days === "number" && Number.isFinite(days) && days <= 21;
  const horizon = 14;
  const elapsedPct = showLife ? Math.min(100, Math.max(10, (1 - Math.min(days, horizon) / horizon) * 100)) : 0;
  const lifeLabel = showLife
    ? days < 1
      ? `${Math.max(1, Math.round(days * 24))} h`
      : `${days.toFixed(days < 10 ? 1 : 0)} d`
    : null;
  const artifactBullets = [impact.means, explanation.notThis, impact.howHappened, impact.rootCause].filter(
    (line): line is string => Boolean(line && line.trim()),
  );
  const actionBullets = [
    recommendation?.title,
    ...impact.doThis.map((step) => step.label),
  ].filter((line): line is string => Boolean(line && line.trim()));
  const downtimeRows = [
    repairTimes?.intermediate ? { label: "Intermediate", value: repairTimes.intermediate } : null,
    repairTimes?.permanent ? { label: "Permanent", value: repairTimes.permanent } : null,
    recommendation?.window ? { label: "Crew window", value: recommendation.window } : null,
    lifeLabel ? { label: "Act within", value: lifeLabel } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <div className="flex flex-col">
      <BriefingSection title="Criticality" tone="criticality">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1" aria-label={`Criticality ${impact.score} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="h-2.5 flex-1 rounded-sm"
                style={{ backgroundColor: i < impact.score ? color : "rgb(255 255 255 / 14%)" }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-red-200/70">
            <span>Low</span>
            <span>Severe</span>
          </div>
          {showLife && (
            <>
              <div className="h-2 overflow-hidden rounded-sm bg-red-950/80">
                <div className="h-full rounded-sm" style={{ width: `${elapsedPct}%`, backgroundColor: color }} />
              </div>
              <div className="flex justify-between text-[10px] text-red-200/70">
                <span>Act now</span>
                <span className="font-bold tabular-nums" style={{ color }}>
                  {lifeLabel} left
                </span>
                <span>14 d horizon</span>
              </div>
            </>
          )}
        </div>
        <p>
          <span className="font-bold">{impact.label}</span> on {impact.assetLine} (C{impact.assetScore}).
          {lifeLabel
            ? ` Remaining useful life is `
            : " Remaining life is still outside the 14-day action horizon."}
          {lifeLabel && <span className="font-bold tabular-nums">{lifeLabel}</span>}
          {lifeLabel ? " — act inside the next approved window." : null}
        </p>
      </BriefingSection>

      <BriefingSection title="Artifacts" tone="artifacts">
        <PictureRow steps={[impact.what, impact.where, impact.notThis]} />
        {evidence.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {evidence.slice(0, 4).map((row) => (
              <div
                key={`${row.label}-${row.value}`}
                className="flex items-start gap-2 rounded-lg border border-cyan-800/40 bg-cyan-950/40 px-2.5 py-2"
              >
                <span className="mt-0.5 text-cyan-300">{evidenceIcon(row.label)}</span>
                <div className="min-w-0">
                  <div className="truncate text-[11px] text-cyan-200/70">{row.label}</div>
                  <div className="truncate text-[14px] font-bold tabular-nums text-cyan-50">{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <ul className="flex flex-col gap-1.5">
          {artifactBullets.map((line) => (
            <ArtifactBullet key={line.slice(0, 48)}>{line}</ArtifactBullet>
          ))}
        </ul>
      </BriefingSection>

      {actionBullets.length > 0 && (
        <BriefingSection title="Action Required" tone="action">
          <PictureRow steps={impact.doThis.slice(0, 3)} />
          <ul className="flex flex-col gap-1.5">
            {actionBullets.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>
                  <span className="font-bold">{line}</span>
                </span>
              </li>
            ))}
          </ul>
        </BriefingSection>
      )}

      {downtimeRows.length > 0 && (
        <BriefingSection title="Downtime / Repair time" tone="downtime">
          <ul className="flex flex-col gap-1.5">
            {downtimeRows.map((row) => (
              <li key={row.label} className="flex items-start justify-between gap-3">
                <span className="text-violet-200/80">{row.label}</span>
                <span className="text-right font-bold tabular-nums text-violet-50">{row.value}</span>
              </li>
            ))}
          </ul>
        </BriefingSection>
      )}
    </div>
  );
}
