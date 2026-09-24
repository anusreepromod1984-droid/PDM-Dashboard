import { faultConfidenceFraction } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { hasTelemetryField } from "@/lib/telemetry";
import type { FaultDiagnosis, FaultEvidence, FaultExplanation, Telemetry } from "@/lib/types";

/** Operator prompt voice: a maintenance person must understand every line, figure,
 *  and graph on one read. Plant words first. If a code is shown, say what it means
 *  in the same sentence. No agent names on the card body. */

const METHOD_LABEL: Record<string, string> = {
  iso11011_gateway_pf: "plant gateway PF leak code",
  iso11011_pressure_decay: "discharge pressure drop vs recent history",
  iso22096_airborne: "microphone leak-band peak (ISO 22096)",
  iso20816_rms_only: "overall vibration RMS (ISO 20816)",
  iso13379_catalog_rules: "vibration harmonics (ISO 13379)",
  imu_absent: "no vibration on this frame",
  imu_absent_electrical: "electrical cues without vibration",
  acoustic_2x_plus_rms: "microphone 2× line frequency plus RMS",
};

type CatalogEntry = {
  means: string;
  notThis?: string;
  why: string;
  rootCause: string;
  riskImpact: string;
  sparePart: string;
};

const CATALOG: Record<string, CatalogEntry> = {
  PF001: {
    means:
      "Compressed air is escaping the discharge circuit — fittings, drain traps, cooler joints, or a passing solenoid. This is a piping / process leak, not a motor bearing.",
    notThis:
      "Healthy or missing vibration does not clear this alert. A leak wastes air and energy while the screw can stay ISO 20816 Zone A.",
    why: "Shown when the plant gateway publishes a PF* leak code, or discharge pressure falls, or the microphone sees a leak-band peak while the package is on.",
    rootCause:
      "Process leakage on the air circuit (ISO 11011). Vibration RMS can stay Zone A while energy and pressure are lost through fittings.",
    riskImpact: "Continuous air loss, extra compressor run hours, and wasted kWh until the leaking joint is found and sealed.",
    sparePart: "Air-circuit fitting / seal kit — not a bearing.",
  },
  MF001: {
    means: "Mechanical looseness — a fastener, foot, or housing is allowing extra movement at 1× shaft speed.",
    why: "Shown when vibration RMS and 1× harmonic energy rise together while the motor is loaded.",
    rootCause: "Loose hold-down bolts, soft foot, or a worn housing fit.",
    riskImpact: "Wear accelerates on bearings and coupling if the machine keeps running loose.",
    sparePart: "M16 foundation bolt / lock-washer kit.",
  },
  MF002: {
    means: "Shaft misalignment — motor and compressor centerlines are not collinear, so the coupling sees a 2× shake.",
    why: "Shown when overall RMS is elevated and a 2× rotational harmonic dominates the vibration spectrum.",
    rootCause: "Thermal growth, soft foot, foundation settle, or a worn elastomeric coupling spider.",
    riskImpact: "Cyclic fatigue on bearings, seals, and the coupling element.",
    sparePart: "Lovejoy L-100 SOX elastomer + motor-foot shims.",
  },
  MF003: {
    means: "Rotor imbalance — mass is uneven around the shaft, producing a strong 1× vibration.",
    why: "Shown when 1× vibration is high relative to other harmonics while the machine is running.",
    rootCause: "Build-up on the rotor, a missing balance weight, or a bent shaft.",
    riskImpact: "Bearing overload and rising housing temperature if left unbalanced.",
    sparePart: "No catalog spare — clean / balance the rotor. Do not order a bearing first.",
  },
  BPFI: {
    means: "Inner-race bearing defect — rolling elements hit a spall on the inner race at ball-pass frequency (BPFI).",
    why: "Shown when vibration RMS is high and a BPFI harmonic (about 5.4× shaft speed) appears with rising motor temperature.",
    rootCause: "Fatigue, contaminated grease, or electrical fluting of the inner raceway.",
    riskImpact: "Spalls grow quickly; remaining life is short once BPFI is clear.",
    sparePart: "SKF 6208-2RS1/C3 drive-end bearing.",
  },
  BPFO: {
    means: "Outer-race bearing defect — rolling elements hit a spall on the outer race (BPFO).",
    why: "Shown when vibration RMS is high and a BPFO harmonic appears.",
    rootCause: "Fatigue or contaminated grease on the outer raceway.",
    riskImpact: "Spalls grow; plan a bearing change in the RUL window.",
    sparePart: "SKF 6208-2RS1/C3 NDE bearing.",
  },
  EF001: {
    means: "Supply voltage unbalance — the three line voltages are unequal, so the motor sees a counter-rotating field.",
    why: "Shown when voltage unbalance (VUF) exceeds the NEMA / IEC warning band on the energy meter.",
    rootCause: "Unequal single-phase loads, a loose feeder lug, or a degraded PF capacitor.",
    riskImpact: "Extra stator heating and winding damage if the unbalance stays high.",
    sparePart: "No mechanical spare — fix the incoming supply / MCC, not the skid.",
  },
  SENSOR: {
    means: "The vibration sensor is not producing a real reading while the motor still looks alive.",
    notThis: "Do not treat 0.0 mm/s as a seized machine. Inspect the transducer lead first.",
    why: "Shown when acceleration is 0 or missing while current / power are live.",
    rootCause: "Cut cable, unplugged M12, or a dead transducer.",
    riskImpact: "A fake machine-down alarm if this is treated as a seized motor.",
    sparePart: "No machine spare — inspect the sensor lead first.",
  },
  HARDWARE_CABLE_FAULT: {
    means: "The vibration sensor is not producing a real reading while the motor still looks alive.",
    notThis: "Do not treat 0.0 mm/s as a seized machine. Inspect the transducer lead first.",
    why: "Agent Alpha halted because IMU vibration is missing or stuck at zero while the package still looks on.",
    rootCause: "Cut cable, loose connector, or lost 24 V loop power on the accelerometer.",
    riskImpact: "Mechanical degradation cannot be detected until the sensor path is restored.",
    sparePart: "No machine spare — inspect the sensor lead first.",
  },
  NORMAL: {
    means: "All monitored parameters are inside the healthy envelope. No defect is named.",
    notThis: "Do not raise a spare or a bearing job from a healthy card.",
    why: "Shown when Agent Gamma reports NORMAL and remaining life is above the skip threshold.",
    rootCause: "No active physical defect.",
    riskImpact: "None — keep the routine lubrication and monitoring schedule.",
    sparePart: "None",
  },
  ANOMALY_UNCLASSIFIED: {
    means: "Live channels show a developing fault, but no single ISO shortcut has locked yet.",
    notThis: "This is not a healthy machine. Do not default to SKF 6208 unless BPFI/BPFO evidence appears.",
    why: "Shown when overall RMS or another live channel is off-nominal without a named harmonic / gateway code.",
    rootCause: "Unlocalized energy — lubrication, early wear, mixed signature, or RMS-only vibration.",
    riskImpact: "A work order is still drafted so the inspection is automated.",
    sparePart: "Walkdown first — spare attached when live evidence names the family.",
  },
  UNKNOWN: {
    means: "This name is not a catalog shortcut. The agents still reason from every live channel and attach a spare when evidence supports one.",
    notThis: "Do not treat unknown as do nothing. The work order is the automation.",
    why: "Shown when the pipeline emitted a code with no shortcut, then scored vibration, voltage, pressure, acoustic, and thermal.",
    rootCause: "No catalog shortcut. Walk the families the evidence ranked.",
    riskImpact: "The draft ticket keeps the job on the board until the part is named.",
    sparePart: "Unknown until evidence names it — inspect first; do not invent a bearing.",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function defectFromDiagnosis(d: FaultDiagnosis): Record<string, unknown> {
  const pipeline = asRecord(d.pipelineDetails);
  return asRecord(pipeline.defect_localization || pipeline.defectLocalization);
}

export function methodLabel(method: string | undefined | null): string {
  if (!method) return "the live rule set";
  return METHOD_LABEL[method] || method.replaceAll("_", " ");
}

export function namedDefectCode(d: FaultDiagnosis): string {
  const halted = d.summary.includes("HALTED") || d.headline.toLowerCase().includes("halt");
  if (halted) return "SENSOR";
  const raw = String(d.archetype || defectFromDiagnosis(d).defect_code || "").toUpperCase();
  if (raw === "SENSOR_HALT" || raw === "HARDWARE_CABLE_FAULT" || raw === "SENSOR_CABLE") return "SENSOR";
  if (["NORMAL", "IDLE", "STANDBY", "STOPPED", "HEALTHY", "NONE"].includes(raw)) return raw;
  if (CATALOG[raw]) return raw;
  const headline = d.headline.toLowerCase();
  if (headline.includes("leak") || headline.includes("pressure leakage")) return "PF001";
  if (headline.includes("bpfo") || headline.includes("outer race")) return "BPFO";
  if (headline.includes("bpfi") || headline.includes("inner race") || headline.includes("bearing")) return "BPFI";
  if (headline.includes("misalignment")) return "MF002";
  if (headline.includes("voltage") || headline.includes("unbalance")) return "EF001";
  if (headline.includes("looseness")) return "MF001";
  if (headline.includes("imbalance")) return "MF003";
  if (headline.includes("halt") || headline.includes("cable") || headline.includes("sensor")) return "SENSOR";
  if (raw && raw !== "NONE") return raw;
  return "UNKNOWN";
}

function catalogFor(d: FaultDiagnosis): CatalogEntry | null {
  const code = namedDefectCode(d);
  if (CATALOG[code]) return CATALOG[code];
  if (code && code !== "NONE") return CATALOG.UNKNOWN!;
  return CATALOG.UNKNOWN!;
}

function confidencePct(raw: number | undefined | null): string {
  const fraction = faultConfidenceFraction(raw ?? 0);
  return `${formatNumber(fraction * 100, 0)}%`;
}

function presentValue(telemetry: Telemetry | null, aliases: string[], value: number | null | undefined, unit: string, digits = 1): string {
  if (!telemetry) return value == null || Number.isNaN(value) ? "n/a" : `${formatNumber(value, digits)} ${unit}`;
  if (!hasTelemetryField(telemetry, ...aliases)) return "not on this frame";
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${formatNumber(value, digits)} ${unit}`;
}

function leakFault(telemetry: Telemetry | null) {
  if (!telemetry) return null;
  return (
    telemetry.motorFaults.find((item) => {
      const code = (item.fault_code || "").toUpperCase();
      const desc = (item.description || "").toLowerCase();
      return code.startsWith("PF") || desc.includes("leak") || desc.includes("pressure");
    }) ?? null
  );
}

function loudestLeakPeak(telemetry: Telemetry | null) {
  if (!telemetry) return null;
  const peaks = telemetry.microphone.harmonics.filter((p) => p.frequency >= 400 && p.frequency <= 8000);
  if (peaks.length === 0) return null;
  return peaks.reduce((best, p) => (p.amplitude > best.amplitude ? p : best));
}

export function operatorCopy(d: FaultDiagnosis): Pick<FaultExplanation, "whatIsIt" | "whyShowing" | "notThis" | "rootCause" | "riskImpact" | "sparePart"> {
  const halted = d.summary.includes("HALTED") || d.headline.toLowerCase().includes("halt");
  const defect = defectFromDiagnosis(d);
  const method = String(defect.diagnosis_method || "");
  const catalog = halted ? CATALOG.SENSOR : catalogFor(d);
  const existing = d.faultExplanation;

  if (halted && catalog) {
    return {
      whatIsIt: catalog.means,
      whyShowing: catalog.why,
      notThis: catalog.notThis,
      sparePart: catalog.sparePart,
      rootCause: existing?.rootCause || catalog.rootCause,
      riskImpact: existing?.riskImpact || catalog.riskImpact,
    };
  }

  if (catalog) {
    const methodBit = method ? ` Trigger method: ${methodLabel(method)}.` : "";
    const code = String(d.archetype || defect.defect_code || "UNKNOWN");
    const name = String(defect.defect_name || "").trim();
    const unknown = catalog === CATALOG.UNKNOWN || catalog === CATALOG.ANOMALY_UNCLASSIFIED;
    if (unknown && existing?.whatIsIt) {
      return {
        whatIsIt: existing.whatIsIt,
        whyShowing: existing.whyShowing || catalog.why,
        notThis: existing.notThis || catalog.notThis,
        sparePart: existing.sparePart || catalog.sparePart,
        rootCause: existing.rootCause || catalog.rootCause,
        riskImpact: existing.riskImpact || catalog.riskImpact,
      };
    }
    const whatIsIt = unknown
      ? `Code ${code}${name ? ` (${name})` : ""} is not a catalog shortcut. The agents scored live vibration, voltage, pressure, acoustic, and thermal channels.`
      : catalog.means;
    const whyShowing = unknown
      ? `Shown because live evidence left the healthy envelope without a named shortcut.${methodBit}`
      : `${catalog.why}${methodBit}`;
    return {
      whatIsIt,
      whyShowing,
      notThis: catalog.notThis,
      sparePart: catalog.sparePart,
      rootCause: existing?.rootCause || catalog.rootCause,
      riskImpact: existing?.riskImpact || catalog.riskImpact,
    };
  }

  const name = String(defect.defect_name || d.headline);
  const code = String(d.archetype || defect.defect_code || "UNKNOWN");
  return {
    whatIsIt: existing?.whatIsIt || `Code ${code} (${name}) is not in the plant catalog. The system will not invent a spare.`,
    whyShowing: existing?.whyShowing || (method ? `Shown because Agent Gamma matched this pattern via ${methodLabel(method)}.` : "Shown because live telemetry crossed a diagnostic rule."),
    notThis: existing?.notThis || "Do not default to SKF 6208. Confirm the fault code before ordering a spare.",
    sparePart: existing?.sparePart || "Unknown — inspect first; do not invent a part.",
    rootCause: existing?.rootCause || "Live sensors are outside the expected operating envelope.",
    riskImpact: existing?.riskImpact || "Continued operation can shorten remaining useful life.",
  };
}

export function buildEvidence(d: FaultDiagnosis, telemetry: Telemetry | null): FaultEvidence[] {
  const code = String(d.archetype || defectFromDiagnosis(d).defect_code || "").toUpperCase();
  const method = String(defectFromDiagnosis(d).diagnosis_method || "");
  const halted = d.summary.includes("HALTED") || d.headline.toLowerCase().includes("halt");
  const rows: FaultEvidence[] = [];

  const imu = presentValue(telemetry, ["imuAcceleration"], telemetry?.imuAcceleration, "mm/s");
  const pressure = presentValue(telemetry, ["pressure"], telemetry?.pressure, "bar");
  const motorT = presentValue(telemetry, ["tempMotor"], telemetry?.temperature.motor, "°C");
  const kw = presentValue(telemetry, ["emPower"], telemetry?.energyMeter.power, "kW");
  const sound = presentValue(telemetry, ["soundLevel"], telemetry?.microphone.soundLevel, "dB");
  const vuf = presentValue(telemetry, ["emVoltageImbalance"], telemetry?.energyMeter.voltageImbalance, "%", 2);
  const iMax = telemetry
    ? Math.max(telemetry.energyMeter.Ir, telemetry.energyMeter.Iy, telemetry.energyMeter.Ib)
    : null;
  const current = presentValue(telemetry, ["emIr", "emIy", "emIb"], iMax, "A");

  if (halted) {
    rows.push({ label: "Vibration RMS", value: imu, note: "Missing or zero while package looks on", role: "trigger" });
    rows.push({ label: "Phase current", value: current, note: "Used to decide if the motor should be spinning", role: "supporting" });
    rows.push({ label: "Electrical power", value: kw, role: "context" });
    return rows;
  }

  if (code === "PF001" || method.startsWith("iso11011") || method.startsWith("iso22096")) {
    const gw = leakFault(telemetry);
    if (gw) {
      rows.push({
        label: `Gateway ${gw.fault_code || "PF*"}`,
        value: confidencePct(gw.confidence),
        note:
          gw.description && !/iso\s*22096|airborne leak signature/i.test(gw.description)
            ? gw.description
            : "Primary leak trigger from the plant gateway",
        role: "trigger",
      });
    } else if (method === "iso11011_pressure_decay") {
      rows.push({ label: "Discharge pressure", value: pressure, note: "Fell vs recent running baseline", role: "trigger" });
    } else if (method === "iso22096_airborne") {
      const peak = loudestLeakPeak(telemetry);
      rows.push({
        label: "Microphone leak-band peak",
        value: peak ? `${formatNumber(peak.frequency, 0)} Hz @ ${formatNumber(peak.amplitude, 1)} dB` : sound,
        note: "Airborne leak cue while the package is on",
        role: "trigger",
      });
    } else {
      rows.push({ label: "Leak rule", value: methodLabel(method), note: "Agent Gamma process-leak overlay", role: "trigger" });
    }
    rows.push({
      label: "Discharge pressure",
      value: pressure,
      note: "≥ 5 bar used as 'package on' when kW is 0",
      role: gw ? "supporting" : "context",
    });
    rows.push({
      label: "Motor temperature",
      value: motorT,
      note: "≥ 38°C used as 'package on' when kW is 0",
      role: "supporting",
    });
    rows.push({
      label: "Electrical power",
      value: kw,
      note: "0 kW does not cancel a piping leak",
      role: "context",
    });
    const peak = loudestLeakPeak(telemetry);
    const soundOk = typeof telemetry?.microphone.soundLevel === "number" && telemetry.microphone.soundLevel > 0;
    rows.push({
      label: "Microphone",
      value: peak
        ? soundOk
          ? `${sound} · peak ${formatNumber(peak.frequency, 0)} Hz`
          : `${formatNumber(peak.frequency, 0)} Hz peak`
        : sound,
      note: "Supporting ISO 22096 cue, not the bearing path",
      role: "supporting",
    });
    rows.push({
      label: "Vibration RMS",
      value: imu,
      note: "Not used to call PF001",
      role: "notUsed",
    });
    return rows;
  }

  if (code === "EF001" || d.headline.toLowerCase().includes("voltage")) {
    rows.push({ label: "Voltage unbalance (VUF)", value: vuf, note: "NEMA / IEC warning band", role: "trigger" });
    if (telemetry) {
      rows.push({
        label: "Line voltages",
        value: `${formatNumber(telemetry.energyMeter.Vr, 0)} / ${formatNumber(telemetry.energyMeter.Vy, 0)} / ${formatNumber(telemetry.energyMeter.Vb, 0)} V`,
        role: "supporting",
      });
    }
    rows.push({ label: "Motor temperature", value: motorT, role: "supporting" });
    rows.push({ label: "Vibration RMS", value: imu, note: "Electrical fault can look quiet mechanically", role: "context" });
    return rows;
  }

  if (code === "BPFI" || code === "MF001" || code === "MF002" || code === "MF003") {
    rows.push({ label: "Vibration RMS", value: imu, note: methodLabel(method), role: "trigger" });
    const harmonics = telemetry?.vibration.harmonics ?? [];
    if (harmonics.length > 0) {
      const loudest = harmonics.reduce((best, p) => (p.amplitude > best.amplitude ? p : best));
      rows.push({
        label: "Loudest vibration peak",
        value: `${formatNumber(loudest.frequency, 1)} Hz`,
        note: `${formatNumber(loudest.amplitude, 1)} dB`,
        role: "supporting",
      });
    }
    rows.push({ label: "Motor temperature", value: motorT, role: "supporting" });
    rows.push({ label: "Electrical power", value: kw, role: "context" });
    return rows;
  }

  if (telemetry) {
    rows.push({ label: "Vibration RMS", value: imu, role: "context" });
    rows.push({ label: "Electrical power", value: kw, role: "context" });
    rows.push({ label: "Motor temperature", value: motorT, role: "context" });
    rows.push({ label: "Discharge pressure", value: pressure, role: "context" });
  }
  return rows;
}

export function enrichExplanation(d: FaultDiagnosis, telemetry: Telemetry | null): FaultExplanation {
  const copy = operatorCopy(d);
  return {
    ...copy,
    evidence: buildEvidence(d, telemetry),
  };
}
