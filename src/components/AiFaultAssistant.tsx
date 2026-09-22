"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useRealtime } from "@/context/RealtimeProvider";
import { useCompany } from "@/context/CompanyProvider";
import { useNow } from "@/hooks/useNow";
import { buildBreachSignature } from "@/lib/faultSignature";
import { formatClock, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DiagnosingGraph } from "@/components/DiagnosingGraph";
import {
  IconSparkle,
  IconAlertTriangle,
  IconHistory,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
} from "@/components/icons";
import { ResizeDivider } from "@/components/ResizeDivider";
import { namedDefectCode } from "@/lib/faultGuide";
import { FaultImpactCards, BriefingSection, ImpactGlyph, InventoryCheckSection } from "@/components/FaultImpactCards";
import { faultImpact, pictogramForStep } from "@/lib/faultImpact";
import { useFaultScenario } from "@/hooks/useFaultScenario";
import type {
  DiagnosisRun,
  FaultDiagnosis,
  Severity,
  RepairOption,
  Telemetry,
} from "@/lib/types";

interface ChatMessage {
  key: string;
  loading?: boolean;
  error?: string;
  diagnosis?: FaultDiagnosis;
  deepDiagnosisPending?: boolean;
  deepDiagnosis?: DiagnosisRun;
}

const NORMAL_DIAGNOSIS_BASE: Omit<FaultDiagnosis, "machineId" | "generatedAt"> = {
  archetype: "NORMAL",
  headline: "All monitored parameters normal",
  severity: "good",
  summary: "All sensor readings and physical parameters are within normal operating thresholds. No active alert breaches detected across the 4-agent supervisory pipeline.",
  recommendedActions: [
    "Continue 24/7 continuous autonomous telemetry monitoring.",
    "Maintain standard lubrication schedule according to OEM guidelines.",
  ],
};

function idleDiagnosis(machineId: string, zeroFields: string[]): FaultDiagnosis {
  return {
    machineId,
    archetype: "IDLE",
    generatedAt: Date.now(),
    headline: "Motor appears to be off",
    severity: "good",
    summary: `${zeroFields.join(", ")} ${zeroFields.length === 1 ? "is" : "are"} reading zero right now. That usually means the motor simply isn't running — not a fault. If it should be running, check the current/power sensor wiring instead.`,
    recommendedActions: [
      "Confirm the motor is actually stopped before troubleshooting sensors.",
      "If it should be running, check the phase-current and power-meter wiring/connections.",
    ],
  };
}

function useFocusedMachineId(): string | null {
  const pathname = usePathname();
  const { slug } = useCompany();
  const segments = pathname.split("/").filter(Boolean);
  const machinesIndex = segments.indexOf("machines");
  if (machinesIndex < 1 || segments[machinesIndex - 1] !== slug || !segments[machinesIndex + 1]) return null;
  return segments[machinesIndex + 1]!;
}

function runSeverity(run: DiagnosisRun): Severity {
  if (run.status === "FAILED") return "critical";
  if (!run.sourceCheck) return "warning";
  const hasFaults = (run.faultPredictions?.length ?? 0) > 0 || run.breachKeys.length > 0;
  if (run.sourceCheck.verdict === "nominal" || (!hasFaults && run.sourceCheck.verdict !== "sensor")) return "good";
  if (run.sourceCheck.verdict === "machine" && hasFaults) return "critical";
  if (run.sourceCheck.verdict === "inconclusive") return "warning";
  if (run.sourceCheck.verdict === "sensor") return "critical";
  return "good";
}

function runVerdictLabel(run: DiagnosisRun): string {
  if (run.status === "RUNNING") return "Diagnosing…";
  if (run.status === "FAILED") return "Diagnosis failed";
  if (!run.sourceCheck) return "No conclusion";
  const hasFaults = (run.faultPredictions?.length ?? 0) > 0 || run.breachKeys.length > 0;
  if (run.sourceCheck.verdict === "nominal" || (!hasFaults && run.sourceCheck.verdict !== "sensor")) return "Nominal";
  return { machine: "Machine fault", sensor: "Sensor fault", inconclusive: "Inconclusive", nominal: "Nominal" }[run.sourceCheck.verdict];
}

function runSummaryLine(run: DiagnosisRun): string {
  if (run.sourceCheck?.reasoning) {
    return run.sourceCheck.reasoning.length > 90 ? `${run.sourceCheck.reasoning.slice(0, 90)}…` : run.sourceCheck.reasoning;
  }
  const n = run.breachKeys.length;
  return `Triggered by ${n} alert breach${n === 1 ? "" : "es"}.`;
}

function DiagnosisRunReport({ run }: { run: DiagnosisRun }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-hairline/60 pb-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <IconSparkle className="h-3.5 w-3.5 text-accent" />
          Diagnosis Report
        </span>
        <span className="text-[10px] text-muted">{formatClock(new Date(run.createdAt).getTime())}</span>
      </div>

      {run.status === "RUNNING" && <p className="text-xs text-muted">Still analyzing…</p>}
      {run.status === "FAILED" && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--status-critical)" }}>
          {run.error ?? "This diagnosis run failed."}
        </p>
      )}

      {run.sourceCheck && (
        <div className="flex flex-col gap-1 rounded-lg border border-hairline bg-surface-1/50 p-2.5">
          <div className="flex items-center gap-2">
            <StatusBadge severity={runSeverity(run)} />
            <span className="text-xs font-semibold text-primary">{runVerdictLabel(run)}</span>
            <span className="text-[10px] text-muted">{Math.round(run.sourceCheck.confidence * 100)}% confidence</span>
          </div>
          <p className="text-xs leading-relaxed text-secondary">{run.sourceCheck.reasoning}</p>
        </div>
      )}

      {run.faultPredictions && run.faultPredictions.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-hairline bg-surface-1/50 p-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Predicted Faults & Prognostics</span>
          <ul className="flex flex-col gap-2">
            {run.faultPredictions.map((p, i) => (
              <li key={i} className="text-xs leading-relaxed text-secondary">
                <div className="flex items-center justify-between gap-1 font-medium text-primary">
                  <span>{p.description}</span>
                  <span className="rounded-full bg-amber-950 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-800/60">
                    {Math.round(p.confidence * 100)}%
                  </span>
                </div>
                {p.predictedWindowDays ? (
                  <span className="text-amber-400 font-medium text-[11px]">RUL: ~{p.predictedWindowDays} days</span>
                ) : null}
                <p className="text-[11px] text-muted mt-0.5">{p.reasoning}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {run.remediation && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-hairline bg-surface-1/50 p-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Prescriptive Maintenance</span>
          <p className="text-xs leading-relaxed text-secondary">
            Spare Part: <span className="font-semibold text-primary">{run.remediation.sparePartNeeded}</span> (
            <span className={run.remediation.availableInInventory ? "text-emerald-400" : "text-amber-400"}>
              {run.remediation.availableInInventory ? "In Stock" : "Not In Stock"}
            </span>)
          </p>
          {!run.remediation.availableInInventory && run.remediation.vendorSuggestion && (
            <p className="text-xs leading-relaxed text-secondary">
              Vendor: {run.remediation.vendorSuggestion.name}
              {run.remediation.vendorSuggestion.contact ? ` (${run.remediation.vendorSuggestion.contact})` : ""}
            </p>
          )}
          <p className="text-xs leading-relaxed text-muted">{run.remediation.reasoning}</p>
        </div>
      )}
    </div>
  );
}

function HistoryList({
  loading,
  error,
  runs,
  now,
  onSelect,
}: {
  loading: boolean;
  error: string | null;
  runs: DiagnosisRun[] | null;
  now: number;
  onSelect: (id: string) => void;
}) {
  if (loading) return <p className="px-2 py-4 text-xs text-muted">Loading diagnosis history…</p>;
  if (error) {
    return (
      <p className="px-2 py-4 text-xs leading-relaxed" style={{ color: "var(--status-critical)" }}>
        {error}
      </p>
    );
  }
  // Only show fault/sensor events — NORMAL runs are filtered at the API layer,
  // but guard here too so live-injected runs are also filtered correctly.
  const faultRuns = (runs ?? []).filter((run) => run.sourceCheck.verdict !== "nominal");

  if (faultRuns.length === 0) {
    return <p className="px-2 py-4 text-xs text-muted">No fault events recorded yet for this machine.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {faultRuns.map((run) => (
        <button
          key={run.id}
          type="button"
          onClick={() => onSelect(run.id)}
          className="flex flex-col gap-1 rounded-xl border border-hairline bg-surface-2 p-3 text-left transition-all hover:border-baseline hover:bg-surface-1/80 shadow-xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <StatusBadge severity={runSeverity(run)} />
              <span className="text-xs font-semibold text-primary">{runVerdictLabel(run)}</span>
            </span>
            <span className="shrink-0 text-[10px] text-muted">{timeAgo(new Date(run.createdAt).getTime(), now)}</span>
          </div>
          <span className="text-xs leading-relaxed text-secondary line-clamp-2">{runSummaryLine(run)}</span>
        </button>
      ))}
    </div>
  );
}

function catalogRepairOptions(code: string): RepairOption[] | null {
  if (code === "PF001") {
    return [
      {
        title: "Find and seal the air leak",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Walk the discharge line with an ultrasonic leak detector; soap-test unions, drain traps, and the safety valve.",
          "Do not treat this as a bearing job — vibration can stay ISO Zone A while air is leaking.",
        ],
        partsOrTools: "Ultrasonic leak detector, soap spray, pressure gauge",
        part: "Air-circuit fitting / seal kit",
        estDowntime: "30–60 min",
      },
      {
        title: "Compressed-air leak survey & repair (ISO 11011)",
        category: "Precision Repair",
        urgency: "Scheduled",
        steps: [
          "Record discharge pressure against the last 30 minutes of historian data while the package is loaded.",
          "Survey joints, hoses, condensate drains, and cooler cores; isolate and replace the leaking fitting.",
          "Re-check pressure hold after 10 minutes and log lost kWh.",
        ],
        partsOrTools: "Ultrasonic leak detector, soap spray, replacement fittings",
        estDowntime: "1 h",
      },
    ];
  }
  if (code === "BPFI" || code === "BPFO") {
    return [
      {
        title: code === "BPFO" ? "Stabilize the NDE bearing" : "Stabilize the drive-end bearing",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Clean the grease fitting and purge plug, then inject 15 g of SKF LGHP 2.",
          "If housing temperature stays above 65°C, plan the SKF 6208 change inside the remaining-life window.",
        ],
        partsOrTools: "Grease gun, SKF LGHP 2, infrared thermometer",
        part: "SKF 6208-2RS1/C3",
        estDowntime: "15 min (online)",
      },
      {
        title: "Replace SKF 6208 and restore alignment",
        category: "Precision Repair",
        urgency: "Scheduled",
        steps: [
          "LOTO, decouple, and pull the worn bearing.",
          "Induction-heat the new SKF 6208-2RS1/C3 to 110°C and seat against the shoulder.",
        ],
        partsOrTools: "Bearing puller, induction heater, SKF 6208-2RS1/C3",
        estDowntime: "3.5 h",
      },
    ];
  }
  if (code === "MF002") {
    return [
      {
        title: "Check coupling and soft foot",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Open the coupling guard and look for shredded elastomer.",
          "Check motor feet for soft foot greater than 0.05 mm.",
        ],
        partsOrTools: "Feeler gauge, torque wrench",
        part: "Lovejoy L-100 SOX elastomer + shims",
        estDowntime: "30 min",
      },
    ];
  }
  if (code === "EF001") {
    return [
      {
        title: "Correct supply voltage unbalance",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Measure all three line voltages at the MCC and look for a loose lug or unequal single-phase load.",
          "Do not order a mechanical spare — this is a supply / winding-heat problem.",
        ],
        partsOrTools: "Clamp meter, infrared camera",
        estDowntime: "20 min",
      },
    ];
  }
  return null;
}

function isGenericRepair(options?: RepairOption[]): boolean {
  if (!options?.length) return true;
  const title = (options[0]?.title || "").toLowerCase();
  const tools = (options[0]?.partsOrTools || "").toLowerCase();
  const steps = (options[0]?.steps || []).join(" ").toLowerCase();
  if (title === "field diagnostic triage" || title === "immediate field check") return true;
  if (tools.includes("vibration pen")) return true;
  if (steps.includes("energy / vibration") || steps.includes("live energy")) return true;
  return false;
}

function getFallbackRepairOptions(d: FaultDiagnosis): RepairOption[] {
  const code = namedDefectCode(d);
  const catalog = catalogRepairOptions(code);
  const incoming = d.repairOptions;
  if (incoming && incoming.length > 0 && !isGenericRepair(incoming)) return incoming;
  if (catalog) return catalog;
  const isHalt = code === "SENSOR" || d.headline.toLowerCase().includes("halt") || d.summary.includes("HALTED");
  const isMisalignment = code === "MF002" || d.headline.toLowerCase().includes("misalignment");
  const isBearing = code === "BPFI" || code === "BPFO" || d.headline.toLowerCase().includes("bearing");

  if (isHalt) {
    return [
      {
        title: "Inspect Physical Cable & Transducer",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Visually inspect cable from bearing housing to junction box for pinching, cuts, or heat melting.",
          "Check BNC connector for pin oxidation or loose coupling sleeve.",
          "Ensure accelerometer mounting stud is securely torqued to 3.5 Nm.",
        ],
        partsOrTools: "Flashlight, 10mm wrench, contact cleaner",
        estDowntime: "15 mins",
      },
      {
        title: "Verify NAMUR NE43 4–20 mA Loop Current",
        category: "Precision Repair",
        urgency: "Immediate",
        steps: [
          "Measure loop current with multimeter in series at PLC analog terminal.",
          "Expected normal range is 4.0–20.0 mA (reading < 3.6 mA indicates broken circuit).",
          "Verify 24V DC loop power supply stability.",
        ],
        partsOrTools: "Digital Multimeter (Fluke 87V)",
        estDowntime: "20 mins",
      },
      {
        title: "Replace Transducer & Restore Telemetry",
        category: "Parts & CMMS",
        urgency: "Scheduled",
        steps: [
          "Replace damaged sensor with reserve accelerometer (PCB 603C01 or IMI 608A11).",
          "Re-torque mounting stud to 3.5 Nm and verify data acquisition node signal.",
        ],
        partsOrTools: "Reserve Accelerometer (Bin: SENS-E14)",
        estDowntime: "45 mins",
      },
    ];
  }

  if (isMisalignment) {
    return [
      {
        title: "Immediate Soft Foot & Coupling Triage",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Inspect coupling guard interior for shredded rubber dust or elastomer wear particles.",
          "Loosen motor hold-down bolts one by one with feeler gauge to detect soft foot (> 0.05 mm).",
          "Verify coupling hub set-screws are torqued tightly.",
        ],
        partsOrTools: "Feeler gauge set, torque wrench",
        part: "Lovejoy L-100 SOX elastomer + shims",
        estDowntime: "30 mins",
      },
      {
        title: "Precision 4-Point Laser Shaft Alignment",
        category: "Precision Repair",
        urgency: "Scheduled",
        steps: [
          "Mount dual-laser alignment heads (SKF TKSA 41) across motor and compressor shafts.",
          "Measure vertical and horizontal offset and angularity through 180° sweep.",
          "Add precision stainless steel shims (0.05 mm – 0.50 mm) under motor feet until offset < 0.05 mm.",
          "Re-torque hold-down bolts in diagonal cross-pattern to 125 Nm and confirm final sweep.",
        ],
        partsOrTools: "Laser Alignment Kit, Stainless Shims (Bin: BIN-SHIM-04)",
        estDowntime: "2 hours",
      },
      {
        title: "Replace Coupling Spider & Execute CMMS",
        category: "Parts & CMMS",
        urgency: "Scheduled",
        steps: [
          "Execute CMMS Work Order to disengage hubs and replace worn polyurethane spider insert.",
          "Reserved Part: Lovejoy / SKF Jaw Spider Insert from Warehouse Bin BIN-A12.",
          "Log alignment certificate and vibration baseline in ERP.",
        ],
        partsOrTools: "OEM Spider Insert, Jaw Puller",
        estDowntime: "1.5 hours",
      },
    ];
  }

  if (isBearing) {
    return [
      {
        title: "High-Temperature Relubrication Triage",
        category: "Immediate Triage",
        urgency: "Immediate",
        steps: [
          "Clean grease fitting and purge plug on motor drive-end bearing housing.",
          "Inject 15 grams of high-temperature polyurea grease (SKF LGHP 2).",
          "Monitor bearing housing temperature to confirm stabilization below 65°C.",
        ],
        partsOrTools: "SKF LGHP 2 Grease, Grease Gun",
        part: "SKF 6208-2RS1/C3",
        estDowntime: "15 mins (online)",
      },
      {
        title: "Bearing Pull & Induction Fitment Replacement",
        category: "Precision Repair",
        urgency: "Scheduled",
        steps: [
          "LOTO motor, decouple load, and extract worn bearing using 3-jaw mechanical puller.",
          "Heat replacement SKF 6208 bearing on induction heater to exactly 110°C.",
          "Slide onto shaft firmly against shoulder without impact; allow to cool.",
        ],
        partsOrTools: "Bearing Puller TMHP, Induction Heater TIH 030M",
        estDowntime: "3.5 hours",
      },
      {
        title: "VFD Shaft Grounding Ring & CMMS Closeout",
        category: "Parts & CMMS",
        urgency: "Scheduled",
        steps: [
          "Install AEGIS SGR shaft grounding ring to prevent VFD inverter electrical raceway fluting.",
          "Reserved Part: SKF 6208 C3 Deep Groove Ball Bearing from Bin BIN-A12.",
        ],
        partsOrTools: "SKF 6208 C3 Bearing, AEGIS SGR-1.875",
        estDowntime: "4 hours",
      },
    ];
  }

  return [
    {
      title: "Field Diagnostic Triage",
      category: "Immediate Triage",
      urgency: "Immediate",
      steps: [
        "Inspect motor and mechanical coupling for physical abnormal vibration or noise.",
        "Check bearing and stator temperatures with infrared thermometer.",
      ],
      partsOrTools: "Infrared thermometer, vibration pen",
      estDowntime: "15 mins",
    },
    {
      title: "Planned Maintenance & Precision Check",
      category: "Precision Repair",
      urgency: "Scheduled",
      steps: [
        "Inspect mechanical tolerances, shaft runout, and mounting bolt torque.",
        "Follow OEM guidelines for scheduled component refurbishment.",
      ],
      partsOrTools: "Torque wrench, dial indicators",
      estDowntime: "1-2 hours",
    },
  ];
}


function Fold({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-t border-hairline">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-3 text-[15px] font-bold text-primary [&::-webkit-details-marker]:hidden">
        {title}
        <IconChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-open:rotate-90" />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

function isSparePartLabel(value?: string | null): boolean {
  if (!value) return false;
  const text = value.trim();
  const low = text.toLowerCase();
  if (!text || low === "none" || low === "n/a") return false;
  if (low.startsWith("no spare") || low.startsWith("no mechanical") || low.startsWith("no machine") || low.startsWith("inspect")) {
    return false;
  }
  return true;
}

function repairTabKind(category: RepairOption["category"]): "intermediate" | "permanent" {
  return category === "Precision Repair" ? "permanent" : "intermediate";
}

function toRepairTabs(options: RepairOption[], sparePart?: string | null): RepairOption[] {
  const intermediate =
    options.find((opt) => opt.category === "Immediate Triage") ||
    options.find((opt) => repairTabKind(opt.category) === "intermediate") ||
    options[0];
  const permanent = options.find((opt) => opt.category === "Precision Repair");
  const partsTab = options.find((opt) => opt.category === "Parts & CMMS");
  const part = [sparePart, intermediate?.part, partsTab?.part, partsTab?.partsOrTools].find(isSparePartLabel);
  const tabs: RepairOption[] = [];
  if (intermediate) tabs.push({ ...intermediate, part });
  if (permanent) tabs.push(permanent);
  return tabs;
}

function RepairOptionsSection({
  options,
  sparePart,
}: {
  options: RepairOption[];
  sparePart?: string | null;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const tabs = toRepairTabs(options, sparePart);

  if (tabs.length === 0) return null;

  const active = tabs[Math.min(selectedIdx, tabs.length - 1)];
  const tabLabel = (category: RepairOption["category"]) =>
    repairTabKind(category) === "permanent" ? "Permanent" : "Intermediate";

  return (
    <div className="flex flex-col gap-3">
      {tabs.length > 1 && (
        <div className="flex gap-1">
          {tabs.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-bold ${
                selectedIdx === idx ? "bg-sky-800/70 text-sky-50" : "text-sky-200/70 hover:text-sky-50"
              }`}
            >
              {tabLabel(opt.category)}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-medium text-primary">{active.title}</span>
            {active.estDowntime && (
              <span className="shrink-0 text-[11px] tabular-nums text-muted">{active.estDowntime}</span>
            )}
          </div>
          {repairTabKind(active.category) === "intermediate" && active.part && (
            <p className="text-[13px] text-sky-100/90">
              Part · <span className="font-bold text-sky-50">{active.part}</span>
            </p>
          )}
          <ol className="flex flex-col gap-2">
            {active.steps.map((step, sIdx) => {
              const pic = pictogramForStep(step);
              return (
                <li key={sIdx} className="flex items-start gap-2.5 text-[13px] leading-6 text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-1 text-muted">
                    <ImpactGlyph icon={pic.icon} className="h-3 w-3" />
                  </span>
                  <span>{step}</span>
                </li>
              );
            })}
          </ol>
          {active.partsOrTools && (
            <p className="text-[12px] text-sky-200/80">
              Tools · <span className="font-bold text-sky-50">{active.partsOrTools}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FourAgentBreakdown({ diagnosis }: { diagnosis: FaultDiagnosis }) {
  const { summary, pipelineDetails } = diagnosis;
  const isHalt =
    (pipelineDetails?.cable_check?.status && pipelineDetails.cable_check.status !== "VALID") ||
    summary.includes("HALTED");
  const vuf = (pipelineDetails?.electrical_health as { voltage_unbalance_pct?: number } | undefined)?.voltage_unbalance_pct;
  const domain = pipelineDetails?.electrical_health?.isolated_failure_domain;
  const code = (pipelineDetails?.defect_localization as { defect_code?: string } | undefined)?.defect_code;
  const rul = pipelineDetails?.rul_prediction?.rul_days;

  const agents = [
    { name: "Alpha", status: isHalt ? "Halt" : "Valid", tone: isHalt ? "text-red-300" : "text-emerald-300" },
    {
      name: "Beta",
      status: isHalt ? "—" : domain || (typeof vuf === "number" ? `VUF ${vuf.toFixed(1)}%` : "OK"),
      tone: "text-secondary",
    },
    {
      name: "Gamma",
      status: isHalt ? "—" : [code, rul != null ? `${rul.toFixed(1)} d` : null].filter(Boolean).join(" · ") || "OK",
      tone: "text-secondary",
    },
    { name: "Delta", status: !isHalt && pipelineDetails?.cmms_work_order ? "WO" : "—", tone: "text-secondary" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {agents.map((agent, i) => (
        <div key={agent.name} className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] text-muted">
            {i + 1}. {agent.name}
          </span>
          <span className={`text-[12px] font-medium ${agent.tone}`}>{agent.status}</span>
        </div>
      ))}
    </div>
  );
}

function Bubble({
  message,
  telemetry,
  onRetry,
  onRunDiagnosis,
}: {
  message: ChatMessage;
  telemetry?: Telemetry | null;
  onRetry?: () => void;
  onRunDiagnosis?: () => void;
}) {
  if (message.loading) {
    return (
      <div className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface-2 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <IconSparkle className="h-3.5 w-3.5 text-accent animate-spin" />
            AI Assistant
          </span>
          <span className="text-[10px] font-medium text-accent animate-pulse">Running LangGraph</span>
        </div>
        <p className="text-xs text-muted">Running 4-agent supervisory diagnosis on real-time telemetry…</p>
        <DiagnosingGraph />
        <div className="flex flex-col gap-1 pt-1 text-[11px] text-muted">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Agent Alpha: Sensor cable & NAMUR loop verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>Agent Beta: Power quality & thermal de-weathering</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Agent Gamma: ISO-13379 Prognostics & RUL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Agent Delta: Prescriptive CMMS dispatch</span>
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex flex-col gap-2.5 rounded-xl border border-red-900/60 bg-red-950/25 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <IconAlertTriangle className="h-3.5 w-3.5 text-red-400" />
            Diagnosis Service Alert
          </span>
        </div>
        <p className="text-xs leading-relaxed text-secondary">{message.error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-red-800/60 bg-red-900/40 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-800/60"
          >
            <IconRefresh className="h-3.5 w-3.5" />
            Retry Diagnosis
          </button>
        )}
      </div>
    );
  }

  const d = message.diagnosis;
  if (!d) return null;

  const isFaultOrHalt =
    d.severity !== "good" ||
    d.summary.includes("HALTED") ||
    d.headline.toLowerCase().includes("halt") ||
    d.headline.includes("Identified") ||
    (d.archetype !== "NORMAL" && d.archetype !== "IDLE");

  const isNominalOrIdle = !isFaultOrHalt;
  const repairOptions = isNominalOrIdle ? [] : getFallbackRepairOptions(d);
  const wo = d.pipelineDetails?.cmms_work_order;
  const windowLine = wo
    ? [
        wo.pm_due_date ? `PM due ${wo.pm_due_date}` : null,
        wo.scheduled_repair_window || null,
        wo.repair_crew && !(wo.scheduled_repair_window || "").includes(String(wo.repair_crew))
          ? wo.repair_crew
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1.5">
          <StatusBadge severity={d.severity} />
          <h2 className="text-[15px] font-semibold leading-snug text-primary">
            {d.headline.replace(/\s+Identified$/i, "")}
          </h2>
        </div>
        <span className="shrink-0 pt-0.5 text-[11px] text-muted">{formatClock(d.generatedAt)}</span>
      </div>

      {isNominalOrIdle ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-[13px] leading-6 text-secondary">{d.summary}</p>
          {onRunDiagnosis && (
            <button
              type="button"
              onClick={onRunDiagnosis}
              className="self-start text-[13px] font-medium text-accent hover:underline"
            >
              Run diagnosis
            </button>
          )}
        </div>
      ) : (
        <div className="mt-5 flex flex-col">
          <FaultImpactCards
            diagnosis={d}
            telemetry={telemetry ?? null}
            recommendation={
              repairOptions[0]
                ? { title: repairOptions[0].title, window: windowLine || null }
                : undefined
            }
            repairTimes={{
              intermediate: repairOptions.find((opt) => opt.category === "Immediate Triage")?.estDowntime
                || repairOptions[0]?.estDowntime,
              permanent: repairOptions.find((opt) => opt.category === "Precision Repair")?.estDowntime,
            }}
          />
          {repairOptions.length > 0 && (
            <BriefingSection title="Repair procedure" tone="repair">
              <RepairOptionsSection
                options={repairOptions}
                sparePart={
                  d.pipelineDetails?.cmms_work_order?.sourcing_intelligence?.oem_part_number
                  || faultImpact(d).spareShort
                  || d.faultExplanation?.sparePart
                }
              />
            </BriefingSection>
          )}
          <InventoryCheckSection diagnosis={d} />
          <Fold title="How we diagnosed">
            <FourAgentBreakdown diagnosis={d} />
          </Fold>
        </div>
      )}

      {repairOptions.length === 0 && d.recommendedActions.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {d.recommendedActions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-6 text-secondary">
              <span className="mt-0.5 w-4 shrink-0 text-[11px] tabular-nums text-muted">{i + 1}.</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FleetRollup() {
  const { activeAlerts, machines } = useRealtime();
  const { routes } = useCompany();
  const affected = Object.keys(activeAlerts).filter((id) => (activeAlerts[id]?.length ?? 0) > 0);

  if (affected.length === 0) {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2 p-3.5 shadow-sm">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <IconSparkle className="h-3.5 w-3.5 text-accent" />
          AI Fleet Assistant
        </span>
        <p className="text-xs text-muted leading-relaxed">
          All machines across the monitored fleet are operating within nominal baseline parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs text-muted">Select a machine below to view its 4-agent diagnostic breakdown.</p>
      {affected.map((machineId) => {
        const machine = machines.find((m) => m.id === machineId);
        const count = activeAlerts[machineId]?.length ?? 0;
        return (
          <Link
            key={machineId}
            href={routes.machine(machineId)}
            className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-2 p-3 transition-all hover:border-baseline hover:bg-surface-1/80 shadow-xs"
          >
            <IconAlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--status-warning)" }} />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-primary">
              {machine?.name ?? machineId}
            </span>
            <span className="shrink-0 rounded-full bg-amber-950/70 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-800/60">
              {count} breach{count === 1 ? "" : "es"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

const ASSISTANT_WIDTH_STORAGE_KEY = "apms_assistant_panel_width";
const DEFAULT_ASSISTANT_WIDTH = 400;
const MIN_ASSISTANT_WIDTH = 300;
const MAX_ASSISTANT_WIDTH = 780;

export function AiFaultAssistant({
  open,
  onRequestOpen,
  variant = "docked",
}: {
  open: boolean;
  onRequestOpen: () => void;
  variant?: "docked" | "floating";
}) {
  const { records, activeAlerts, activeActivity, latestDiagnosis } = useRealtime();
  const focusedMachineId = useFocusedMachineId();
  const injectScenario = useFaultScenario(focusedMachineId ?? undefined);
  const now = useNow(30_000);

  const [panelWidth, setPanelWidth] = useState(DEFAULT_ASSISTANT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ASSISTANT_WIDTH_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        if (!isNaN(val) && val >= MIN_ASSISTANT_WIDTH && val <= MAX_ASSISTANT_WIDTH) {
          setPanelWidth(val);
        }
      }
    } catch {}
  }, []);

  const [messagesByMachine, setMessagesByMachine] = useState<Record<string, ChatMessage[]>>({});
  const notifiedRef = useRef<Record<string, Set<string>>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  const [view, setView] = useState<"live" | "history">("live");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [historyRuns, setHistoryRuns] = useState<DiagnosisRun[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [historyMachineId, setHistoryMachineId] = useState(focusedMachineId);
  if (focusedMachineId !== historyMachineId) {
    setHistoryMachineId(focusedMachineId);
    setView("live");
    setSelectedRunId(null);
    setHistoryRuns(null);
    setHistoryError(null);
  }

  function openHistory() {
    if (!focusedMachineId) return;
    setView("history");
    setSelectedRunId(null);
    setHistoryLoading(true);
    setHistoryError(null);
    apiFetch<{ machineId: string; runs: DiagnosisRun[] }>(`/api/machines/${focusedMachineId}/diagnosis-runs?limit=20`)
      .then(({ runs }) => setHistoryRuns(runs))
      .catch((err) => setHistoryError(err instanceof ApiError ? err.message : "Couldn't load diagnosis history."))
      .finally(() => setHistoryLoading(false));
  }

  const focusedBreaches = focusedMachineId ? (activeAlerts[focusedMachineId] ?? []) : [];
  const focusedFaults = focusedMachineId ? (records[focusedMachineId]?.latest?.motorFaults ?? []) : [];
  const focusedActivity = focusedMachineId ? activeActivity[focusedMachineId] : undefined;
  const hasFocusedTelemetry = focusedMachineId ? records[focusedMachineId]?.latest != null : false;
  const focusedSignature =
    focusedMachineId && hasFocusedTelemetry
      ? buildBreachSignature(focusedBreaches, focusedFaults, focusedActivity?.idle ?? false)
      : null;
  const liveDiagnosis = focusedMachineId ? latestDiagnosis[focusedMachineId] : undefined;
  const liveDiagnosisForView = injectScenario === "nominal" ? liveDiagnosis : undefined;

  /**
   * Triggers the 4-Agent LangGraph APMS pipeline on demand or on edge change.
   */
  const runDiagnosis = useCallback(
    (machineId: string) => {
      if (inFlightRef.current.has(machineId)) return;
      if (variant !== "floating") onRequestOpen();
      inFlightRef.current.add(machineId);

      const loadingKey = `manual_${Date.now()}:loading`;
      setMessagesByMachine((prev) => ({
        ...prev,
        [machineId]: [{ key: loadingKey, loading: true }],
      }));

      apiFetch<FaultDiagnosis>(`/api/machines/${machineId}/fault-assistant`, { method: "POST" })
        .then((diagnosis) => {
          setMessagesByMachine((prev) => ({
            ...prev,
            [machineId]: [{ key: `diag_${Date.now()}:result`, diagnosis }],
          }));
        })
        .catch((err) => {
          const message = err instanceof ApiError ? err.message : "Something went wrong reaching the diagnosis service.";
          setMessagesByMachine((prev) => ({
            ...prev,
            [machineId]: [{ key: `error_${Date.now()}:error`, error: message }],
          }));
          // Remove from notified so retry is allowed
          if (notifiedRef.current[machineId] && focusedSignature) {
            notifiedRef.current[machineId].delete(focusedSignature);
          }
        })
        .finally(() => {
          inFlightRef.current.delete(machineId);
        });
    },
    [focusedSignature, onRequestOpen, variant]
  );

  // A scenario can change while the breach signature remains identical (for example,
  // returning from cable-cut to a nominal stream that is genuinely missing Product A
  // acceleration). Re-run instead of leaving the previous scenario's diagnosis shown.
  useEffect(() => {
    const handleScenarioChange = (event: Event) => {
      const detail = (event as CustomEvent<{ machineId?: string }>).detail;
      if (detail?.machineId) runDiagnosis(detail.machineId);
    };
    window.addEventListener("apms:fault-scenario-changed", handleScenarioChange);
    return () => window.removeEventListener("apms:fault-scenario-changed", handleScenarioChange);
  }, [runDiagnosis]);

  // Live MQTT diagnosis (same tick as gauges). An inject button is an explicit test —
  // do not let the live PF001 stream overwrite the scenario the operator just selected.
  useEffect(() => {
    if (!focusedMachineId || !liveDiagnosisForView) return;
    if (inFlightRef.current.has(focusedMachineId)) return;
    setMessagesByMachine((prev) => ({
      ...prev,
      [focusedMachineId]: [{ key: `live_${focusedMachineId}`, diagnosis: liveDiagnosisForView }],
    }));
  }, [focusedMachineId, liveDiagnosisForView]);

  // Keep history list in step with new agent_snapshot rows.
  useEffect(() => {
    if (view !== "history" || !focusedMachineId || !liveDiagnosis) return;
    let cancelled = false;
    apiFetch<{ machineId: string; runs: DiagnosisRun[] }>(`/api/machines/${focusedMachineId}/diagnosis-runs?limit=20`)
      .then(({ runs }) => {
        if (!cancelled) setHistoryRuns(runs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [view, focusedMachineId, liveDiagnosis?.generatedAt]);

  // Automated edge detection for faults and nominal streams
  useEffect(() => {
    if (!focusedMachineId || focusedSignature === null) return;
    if (liveDiagnosisForView) return;

    // Normal / no-breach case: reset to nominal base
    if (!focusedActivity?.idle && focusedBreaches.length === 0 && focusedFaults.length === 0) {
      setMessagesByMachine((prev) => ({
        ...prev,
        [focusedMachineId]: [
          {
            key: `${focusedSignature}:normal`,
            diagnosis: { ...NORMAL_DIAGNOSIS_BASE, machineId: focusedMachineId, generatedAt: Date.now() },
          },
        ],
      }));
      return;
    }

    // Gate with notifiedRef to prevent spam
    const notified = notifiedRef.current[focusedMachineId] ?? (notifiedRef.current[focusedMachineId] = new Set());
    if (notified.has(focusedSignature)) return;
    if (inFlightRef.current.has(focusedMachineId)) return;
    notified.add(focusedSignature);

    if (focusedActivity?.idle) {
      if (variant !== "floating") onRequestOpen();
      setMessagesByMachine((prev) => ({
        ...prev,
        [focusedMachineId]: [
          ...(prev[focusedMachineId] ?? []),
          { key: `${focusedSignature}:idle`, diagnosis: idleDiagnosis(focusedMachineId, focusedActivity.zeroFields) },
        ],
      }));
      return;
    }

    // Fault detected: run diagnosis
    runDiagnosis(focusedMachineId);
  }, [focusedMachineId, focusedSignature, focusedActivity?.idle, focusedBreaches.length, focusedFaults.length, liveDiagnosisForView, onRequestOpen, runDiagnosis, variant]);

  const messages = focusedMachineId ? (messagesByMachine[focusedMachineId] ?? []) : [];
  const selectedRun = selectedRunId ? (historyRuns?.find((r) => r.id === selectedRunId) ?? null) : null;

  const panelContent = (
    <div className="flex h-full w-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
        {view === "history" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (selectedRunId ? setSelectedRunId(null) : setView("live"))}
              aria-label="Back"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-primary"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>
            <IconHistory className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-primary">Diagnosis History</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <IconSparkle className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-primary">AI Assistant</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {focusedMachineId && view === "live" && (
            <button
              type="button"
              onClick={() => runDiagnosis(focusedMachineId)}
              title="Re-run 4-Agent LangGraph Diagnosis"
              aria-label="Run Diagnosis"
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-primary"
            >
              <IconRefresh className="h-3.5 w-3.5 text-accent" />
              <span>Diagnose</span>
            </button>
          )}
          {focusedMachineId && (
            <button
              type="button"
              onClick={view === "history" ? () => setView("live") : openHistory}
              title={view === "history" ? "Back to Live Feed" : "View Diagnosis History"}
              aria-label="Toggle history view"
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                view === "history"
                  ? "bg-surface-3 text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-primary"
              }`}
            >
              <IconHistory className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Area with min-h-0 and custom-scrollbar */}
      <div className="flex flex-1 min-h-0 flex-col gap-3.5 overflow-y-auto px-4 py-4 custom-scrollbar">
        {view === "history" ? (
          selectedRun ? (
            <DiagnosisRunReport run={selectedRun} />
          ) : (
            <HistoryList
              loading={historyLoading}
              error={historyError}
              runs={historyRuns}
              now={now}
              onSelect={setSelectedRunId}
            />
          )
        ) : (
          <>
            {!focusedMachineId && <FleetRollup />}

            {focusedMachineId && messages.length === 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-2 p-3.5 shadow-sm">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <IconSparkle className="h-3.5 w-3.5 text-accent" />
                  AI Assistant
                </span>
                <p className="text-xs leading-relaxed text-muted">
                  Monitoring {focusedMachineId} sensors in real time. Click below to run a manual diagnostic scan across all 4 agents.
                </p>
                <button
                  type="button"
                  onClick={() => runDiagnosis(focusedMachineId)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-2 text-xs font-semibold text-primary transition-all hover:border-baseline hover:bg-surface-3 shadow-xs"
                >
                  <IconSparkle className="h-3.5 w-3.5 text-accent" />
                  Run 4-Agent Diagnosis
                </button>
              </div>
            )}

            {focusedMachineId &&
              messages.map((m) => (
                <Bubble
                  key={m.key}
                  message={m}
                  telemetry={records[focusedMachineId]?.latest ?? null}
                  onRetry={() => runDiagnosis(focusedMachineId)}
                  onRunDiagnosis={() => runDiagnosis(focusedMachineId)}
                />
              ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-hairline px-3.5 py-2.5 bg-surface-1/40">
        <p className="text-[10px] leading-relaxed text-muted">
          Autonomous 4-agent APMS.
        </p>
      </div>
    </div>
  );

  if (variant === "floating") {
    return (
      <aside
        className={`fixed bottom-24 right-6 z-40 flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl transition-all duration-200 ${
          open ? "pointer-events-auto h-[34rem] w-84 sm:w-96 opacity-100" : "pointer-events-none h-0 w-84 opacity-0"
        }`}
      >
        {panelContent}
      </aside>
    );
  }

  return (
    <aside
      data-assistant="panel"
      style={open ? { width: `${panelWidth}px` } : { width: 0 }}
      className={`relative flex h-full shrink-0 flex-col border-hairline bg-surface transition-[width] ${
        isResizing ? "transition-none select-none" : "duration-200"
      } ${open ? "border-l" : "border-l-0"}`}
    >
      {open && (
        <ResizeDivider
          side="left"
          width={panelWidth}
          minWidth={MIN_ASSISTANT_WIDTH}
          maxWidth={MAX_ASSISTANT_WIDTH}
          defaultWidth={DEFAULT_ASSISTANT_WIDTH}
          onResize={(newWidth) => {
            setIsResizing(true);
            setPanelWidth(newWidth);
          }}
          onResizeEnd={(finalWidth) => {
            setIsResizing(false);
            setPanelWidth(finalWidth);
            try {
              window.localStorage.setItem(ASSISTANT_WIDTH_STORAGE_KEY, String(finalWidth));
            } catch {}
          }}
          onReset={() => {
            setPanelWidth(DEFAULT_ASSISTANT_WIDTH);
            try {
              window.localStorage.setItem(ASSISTANT_WIDTH_STORAGE_KEY, String(DEFAULT_ASSISTANT_WIDTH));
            } catch {}
          }}
        />
      )}
      <div className="flex h-full w-full min-h-0 flex-col overflow-hidden">{panelContent}</div>
    </aside>
  );
}
