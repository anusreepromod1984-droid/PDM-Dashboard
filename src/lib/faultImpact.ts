import { namedDefectCode } from "@/lib/faultGuide";
import type { FaultDiagnosis } from "@/lib/types";

/** Pictograms, bars, and short labels on the assistant card. A fitter should get
 *  the picture without knowing ISO clause numbers or agent names. */

export type ImpactLevel = "none" | "low" | "moderate" | "high" | "severe";
export type ImpactIcon =
  | "leak"
  | "bearing"
  | "align"
  | "electrical"
  | "sensor"
  | "thermal"
  | "time"
  | "energy"
  | "stop"
  | "ok"
  | "fitting"
  | "pipe"
  | "walk"
  | "soap"
  | "seal"
  | "part";

export interface ImpactStep {
  icon: ImpactIcon;
  label: string;
}

export interface FaultImpact {
  code: string;
  score: number;
  level: ImpactLevel;
  label: string;
  shortName: string;
  assetLine: string;
  assetScore: number;
  means: string;
  howHappened: string;
  rootCause: string;
  consequence: string;
  ifRunning: string;
  steps: ImpactStep[];
  what: ImpactStep;
  where: ImpactStep;
  notThis: ImpactStep;
  how: ImpactStep[];
  cause: ImpactStep[];
  doThis: ImpactStep[];
  spareShort: string | null;
  timeLeft: string | null;
}

const ASSET: Record<string, { score: number; line: string }> = {
  compressor_unit_01: { score: 5, line: "Air header" },
  motor_unit_01: { score: 4, line: "Drive motor" },
  chiller_unit_01: { score: 5, line: "Process cooling" },
};

type CatalogRow = {
  score: number;
  shortName: string;
  means: string;
  howHappened: string;
  rootCause: string;
  consequence: string;
  ifRunning: string;
  steps: ImpactStep[];
  what: ImpactStep;
  where: ImpactStep;
  notThis: ImpactStep;
  how: ImpactStep[];
  cause: ImpactStep[];
  doThis: ImpactStep[];
  spareShort: string | null;
};

const BY_CODE: Record<string, CatalogRow> = {
  PF001: {
    score: 4,
    shortName: "Air leak",
    means: "Compressed air is leaving the discharge circuit through a fitting, drain trap, cooler joint, or a passing solenoid. This is a piping leak, not a motor bearing.",
    howHappened: "A joint started passing air while the package was loaded. The plant gateway raised PF001; discharge pressure and the microphone leak-band peak confirm it. Vibration can stay healthy the whole time.",
    rootCause: "Process leakage on the air circuit (ISO 11011). Energy and pressure are lost at fittings while ISO 20816 vibration can stay Zone A.",
    consequence: "Wasted air and extra kWh",
    ifRunning: "The leak grows. The compressor runs longer to hold header pressure. Energy cost rises until the joint is sealed.",
    steps: [
      { icon: "leak", label: "Air escapes" },
      { icon: "time", label: "Extra hours" },
      { icon: "energy", label: "kWh wasted" },
    ],
    what: { icon: "pipe", label: "Air leak" },
    where: { icon: "fitting", label: "Fittings" },
    notThis: { icon: "bearing", label: "Not bearing" },
    how: [
      { icon: "fitting", label: "Joint opens" },
      { icon: "leak", label: "Air leaves" },
      { icon: "pipe", label: "Header still on" },
    ],
    cause: [
      { icon: "fitting", label: "Fitting / trap" },
      { icon: "pipe", label: "Process leak" },
      { icon: "bearing", label: "Not the race" },
    ],
    doThis: [
      { icon: "walk", label: "Walk line" },
      { icon: "soap", label: "Soap test" },
      { icon: "seal", label: "Seal joint" },
    ],
    spareShort: "QSL fitting",
  },
  PF002: {
    score: 3,
    shortName: "Cooler loss",
    means: "Discharge air is not being cooled as designed. Heat stays in the air line and ages oil and seals.",
    howHappened: "Cooler flow dropped or a cooler core started bypassing while the package was loaded, so discharge temperature stayed high.",
    rootCause: "Blocked, bypassing, or failed aftercooler / cooler circuit — not a motor bearing.",
    consequence: "Lost cooling on the air line",
    ifRunning: "Discharge stays hot. Oil and seals age faster until the cooler is restored.",
    steps: [
      { icon: "thermal", label: "Air stays hot" },
      { icon: "time", label: "Oil ages" },
      { icon: "stop", label: "Seal wear" },
    ],
    what: { icon: "thermal", label: "Hot air" },
    where: { icon: "pipe", label: "Cooler" },
    notThis: { icon: "bearing", label: "Not bearing" },
    how: [
      { icon: "pipe", label: "Cooler loss" },
      { icon: "thermal", label: "Heat stays" },
      { icon: "time", label: "Oil ages" },
    ],
    cause: [
      { icon: "pipe", label: "Cooler core" },
      { icon: "thermal", label: "No heat dump" },
      { icon: "bearing", label: "Not the race" },
    ],
    doThis: [
      { icon: "walk", label: "Check cooler" },
      { icon: "thermal", label: "Feel discharge" },
      { icon: "seal", label: "Restore flow" },
    ],
    spareShort: "Cooler kit",
  },
  MF001: {
    score: 3,
    shortName: "Looseness",
    means: "A fastener, foot, or housing is allowing extra movement at 1× shaft speed.",
    howHappened: "Hold-down hardware walked under load. Vibration RMS and 1× energy rose together while the motor was loaded.",
    rootCause: "Loose hold-down bolts, soft foot, or a worn housing fit.",
    consequence: "Looseness and mounting wear",
    ifRunning: "Bolts walk. Vibration rises. A trip or broken mount becomes likely.",
    steps: [
      { icon: "align", label: "Bolts walk" },
      { icon: "bearing", label: "Shake grows" },
      { icon: "stop", label: "Mount risk" },
    ],
    what: { icon: "align", label: "Loose mount" },
    where: { icon: "fitting", label: "Feet / bolts" },
    notThis: { icon: "electrical", label: "Not supply" },
    how: [
      { icon: "fitting", label: "Bolt walks" },
      { icon: "align", label: "Foot lifts" },
      { icon: "bearing", label: "1× shake" },
    ],
    cause: [
      { icon: "fitting", label: "Hold-downs" },
      { icon: "align", label: "Soft foot" },
      { icon: "electrical", label: "Not MCC" },
    ],
    doThis: [
      { icon: "walk", label: "Feel feet" },
      { icon: "seal", label: "Re-torque" },
      { icon: "align", label: "Soft-foot" },
    ],
    spareShort: "M16 bolts",
  },
  MF002: {
    score: 4,
    shortName: "Misalignment",
    means: "Motor and compressor centerlines are not collinear, so the coupling sees a 2× shake.",
    howHappened: "Thermal growth, soft foot, or a worn spider let the shafts drift. A 2× rotational harmonic then dominated the vibration spectrum.",
    rootCause: "Thermal growth, soft foot, foundation settle, or a worn elastomeric coupling spider.",
    consequence: "Coupling and bearing fatigue",
    ifRunning: "Shafts keep fighting each other. Coupling and bearings wear out in weeks if not realigned.",
    steps: [
      { icon: "align", label: "Shafts fight" },
      { icon: "bearing", label: "Fatigue" },
      { icon: "stop", label: "Coupling fail" },
    ],
    what: { icon: "align", label: "Shafts off" },
    where: { icon: "fitting", label: "Coupling" },
    notThis: { icon: "electrical", label: "Not electrical" },
    how: [
      { icon: "align", label: "Shafts drift" },
      { icon: "fitting", label: "Spider wears" },
      { icon: "bearing", label: "2× shake" },
    ],
    cause: [
      { icon: "align", label: "Soft foot" },
      { icon: "fitting", label: "Worn spider" },
      { icon: "time", label: "Thermal growth" },
    ],
    doThis: [
      { icon: "walk", label: "Open guard" },
      { icon: "align", label: "Laser align" },
      { icon: "seal", label: "New spider" },
    ],
    spareShort: "L-100 spider",
  },
  MF003: {
    score: 3,
    shortName: "Unbalance",
    means: "Mass is uneven around the shaft, producing a strong 1× vibration.",
    howHappened: "Build-up, a missing balance weight, or a bent shaft raised 1× vibration while the machine was running.",
    rootCause: "Build-up on the rotor, a missing balance weight, or a bent shaft.",
    consequence: "Unbalance wear on bearings",
    ifRunning: "Vibration keeps beating the bearings. Life shortens until the rotor is balanced.",
    steps: [
      { icon: "bearing", label: "1× shake" },
      { icon: "time", label: "Wear" },
      { icon: "stop", label: "Bearing load" },
    ],
    what: { icon: "bearing", label: "Uneven mass" },
    where: { icon: "pipe", label: "Rotor" },
    notThis: { icon: "electrical", label: "Not supply" },
    how: [
      { icon: "pipe", label: "Mass shifts" },
      { icon: "bearing", label: "1× grows" },
      { icon: "thermal", label: "Housing heats" },
    ],
    cause: [
      { icon: "pipe", label: "Build-up" },
      { icon: "align", label: "Lost weight" },
      { icon: "bearing", label: "Not BPFI first" },
    ],
    doThis: [
      { icon: "walk", label: "Clean rotor" },
      { icon: "align", label: "Balance" },
      { icon: "bearing", label: "Check DE" },
    ],
    spareShort: null,
  },
  BPFI: {
    score: 5,
    shortName: "Inner race",
    means: "Rolling elements are hitting a spall on the inner race at ball-pass frequency (BPFI). This is a drive-end bearing job.",
    howHappened: "A pit opened on the inner raceway. Each revolution the balls strike it; grease film is breaking down and housing temperature is rising.",
    rootCause: "Fatigue, contaminated grease, or electrical fluting of the inner raceway on SKF 6208.",
    consequence: "Inner-race seizure risk",
    ifRunning: "Spall grows with every revolution. The bearing can lock and take the shaft with it inside the remaining-life window.",
    steps: [
      { icon: "bearing", label: "Spall grows" },
      { icon: "time", label: "Race cracks" },
      { icon: "stop", label: "Seizure" },
    ],
    what: { icon: "bearing", label: "Inner race" },
    where: { icon: "bearing", label: "Drive end" },
    notThis: { icon: "pipe", label: "Not a leak" },
    how: [
      { icon: "bearing", label: "Ball hits pit" },
      { icon: "time", label: "Every rev" },
      { icon: "thermal", label: "Housing heats" },
    ],
    cause: [
      { icon: "bearing", label: "Inner race" },
      { icon: "seal", label: "Grease / fatigue" },
      { icon: "electrical", label: "Or VFD fluting" },
    ],
    doThis: [
      { icon: "thermal", label: "Feel housing" },
      { icon: "seal", label: "Grease now" },
      { icon: "part", label: "Swap 6208" },
    ],
    spareShort: "SKF 6208",
  },
  BPFO: {
    score: 4,
    shortName: "Outer race",
    means: "Rolling elements are hitting a spall on the outer race (BPFO). This is an NDE bearing job.",
    howHappened: "A pit opened on the outer raceway. BPFO harmonics rose while the motor was loaded.",
    rootCause: "Fatigue or contaminated grease on the outer raceway of SKF 6208.",
    consequence: "Outer-race seizure risk",
    ifRunning: "Spalls grow. Plan a bearing change inside the remaining-life window or the race can lock.",
    steps: [
      { icon: "bearing", label: "Outer spall" },
      { icon: "time", label: "Grows" },
      { icon: "stop", label: "Lock-up" },
    ],
    what: { icon: "bearing", label: "Outer race" },
    where: { icon: "bearing", label: "NDE" },
    notThis: { icon: "pipe", label: "Not a leak" },
    how: [
      { icon: "bearing", label: "Ball hits pit" },
      { icon: "time", label: "Every rev" },
      { icon: "thermal", label: "Housing heats" },
    ],
    cause: [
      { icon: "bearing", label: "Outer race" },
      { icon: "seal", label: "Grease / fatigue" },
      { icon: "pipe", label: "Not a leak" },
    ],
    doThis: [
      { icon: "thermal", label: "Feel housing" },
      { icon: "seal", label: "Grease now" },
      { icon: "part", label: "Swap 6208" },
    ],
    spareShort: "SKF 6208",
  },
  EF001: {
    score: 5,
    shortName: "Voltage unbalance",
    means: "The three line voltages are unequal, so the motor sees a counter-rotating field. This is a supply problem, not a skid spare.",
    howHappened: "A loose lug, unequal single-phase load, or a weak PF capacitor let VUF climb on the energy meter. Windings then heat with no mechanical warning.",
    rootCause: "Unequal single-phase loads, a loose feeder lug, or a degraded PF capacitor at the MCC.",
    consequence: "Winding heat and burnout",
    ifRunning: "Unbalance current keeps cooking the windings. A burn-out stops the air header with no mechanical warning.",
    steps: [
      { icon: "electrical", label: "Unequal V" },
      { icon: "thermal", label: "Windings heat" },
      { icon: "stop", label: "Burnout" },
    ],
    what: { icon: "electrical", label: "Unequal V" },
    where: { icon: "electrical", label: "MCC / feed" },
    notThis: { icon: "bearing", label: "Not bearing" },
    how: [
      { icon: "electrical", label: "Lines unequal" },
      { icon: "thermal", label: "Stator heats" },
      { icon: "time", label: "Insulation ages" },
    ],
    cause: [
      { icon: "electrical", label: "Loose lug" },
      { icon: "energy", label: "Unequal load" },
      { icon: "bearing", label: "Not the race" },
    ],
    doThis: [
      { icon: "thermal", label: "IR on lugs" },
      { icon: "electrical", label: "Torque feed" },
      { icon: "walk", label: "Fix supply" },
    ],
    spareShort: null,
  },
  SENSOR: {
    score: 4,
    shortName: "Cable cut",
    means: "The vibration sensor is not producing a real reading while the motor still looks alive. Do not treat 0.0 mm/s as a seized machine.",
    howHappened: "Acceleration went to zero or missing while current or power still say the package is on. Agent Alpha halted so a fake machine-down is not diagnosed.",
    rootCause: "Cut cable, unplugged M12, or a dead transducer / lost 24 V loop power.",
    consequence: "Blind to the next fault",
    ifRunning: "The machine may still be running, but the plant cannot see a leak, bearing, or voltage fault until the cable is restored.",
    steps: [
      { icon: "sensor", label: "No signal" },
      { icon: "time", label: "Blind watch" },
      { icon: "stop", label: "Missed fault" },
    ],
    what: { icon: "sensor", label: "No signal" },
    where: { icon: "sensor", label: "IMU cable" },
    notThis: { icon: "stop", label: "Not seized" },
    how: [
      { icon: "sensor", label: "Lead opens" },
      { icon: "electrical", label: "Loop drops" },
      { icon: "ok", label: "Motor still on" },
    ],
    cause: [
      { icon: "sensor", label: "Cut / unplug" },
      { icon: "electrical", label: "24 V lost" },
      { icon: "stop", label: "Not seized" },
    ],
    doThis: [
      { icon: "walk", label: "Trace lead" },
      { icon: "electrical", label: "Check 24 V" },
      { icon: "seal", label: "Re-seat M12" },
    ],
    spareShort: null,
  },
  ANOMALY_UNCLASSIFIED: {
    score: 3,
    shortName: "Unnamed wear",
    means: "Live channels are off-nominal, but no single ISO shortcut has locked yet. This is not a healthy machine.",
    howHappened: "Overall RMS or another live channel left the healthy envelope without a named harmonic or gateway code.",
    rootCause: "Unlocalized energy — lubrication, early wear, mixed signature, or RMS-only vibration.",
    consequence: "Unnamed wear is developing",
    ifRunning: "The machine is off-nominal. Walk it down before the signature becomes a named failure.",
    steps: [
      { icon: "bearing", label: "Off-nominal" },
      { icon: "time", label: "Grows" },
      { icon: "stop", label: "Named fault" },
    ],
    what: { icon: "stop", label: "Off-nominal" },
    where: { icon: "walk", label: "Walkdown" },
    notThis: { icon: "ok", label: "Not healthy" },
    how: [
      { icon: "bearing", label: "Envelope left" },
      { icon: "time", label: "No name yet" },
      { icon: "walk", label: "Inspect first" },
    ],
    cause: [
      { icon: "stop", label: "Unlocalized" },
      { icon: "seal", label: "Lube / wear" },
      { icon: "bearing", label: "Not 6208 yet" },
    ],
    doThis: [
      { icon: "walk", label: "Walk machine" },
      { icon: "thermal", label: "Feel / listen" },
      { icon: "seal", label: "Draft WO" },
    ],
    spareShort: null,
  },
};

const LEVEL: Record<ImpactLevel, string> = {
  none: "None",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
};

function levelFor(score: number): ImpactLevel {
  if (score <= 1) return "none";
  if (score === 2) return "low";
  if (score === 3) return "moderate";
  if (score === 4) return "high";
  return "severe";
}

function timeLeft(d: FaultDiagnosis): string | null {
  const days = d.pipelineDetails?.rul_prediction?.rul_days;
  if (typeof days !== "number" || !Number.isFinite(days)) return null;
  if (days > 21) return null;
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} h left`;
  return `${days.toFixed(days < 10 ? 1 : 0)} d left`;
}

export function faultImpact(d: FaultDiagnosis): FaultImpact {
  const asset = ASSET[d.machineId] || { score: 3, line: "Plant asset" };
  const code = namedDefectCode(d);
  const row = BY_CODE[code];

  if ((d.severity === "good" && (code === "NORMAL" || code === "IDLE")) || (!row && d.severity === "good")) {
    return {
      code,
      score: 1,
      level: "none",
      label: LEVEL.none,
      shortName: "Healthy",
      assetLine: asset.line,
      assetScore: asset.score,
      consequence: "No active defect",
      ifRunning: "Keep running. No extra wear from this diagnosis.",
      means: "All monitored parameters are inside the healthy envelope. No defect is named.",
      howHappened: "No live channel left the healthy band, so Agent Gamma reports NORMAL.",
      rootCause: "No active physical defect.",
      steps: [
        { icon: "ok", label: "Healthy" },
        { icon: "time", label: "Keep watch" },
        { icon: "ok", label: "Stay online" },
      ],
      what: { icon: "ok", label: "Healthy" },
      where: { icon: "ok", label: asset.line },
      notThis: { icon: "stop", label: "No defect" },
      how: [
        { icon: "ok", label: "In band" },
        { icon: "time", label: "Keep watch" },
        { icon: "ok", label: "Stay online" },
      ],
      cause: [{ icon: "ok", label: "No defect" }],
      doThis: [{ icon: "ok", label: "Keep running" }],
      spareShort: null,
      timeLeft: timeLeft(d),
    };
  }

  let score = row?.score ?? (d.severity === "critical" ? 5 : d.severity === "warning" ? 3 : 2);
  const days = d.pipelineDetails?.rul_prediction?.rul_days;
  if (typeof days === "number") {
    if (days <= 3) score = Math.max(score, 5);
    else if (days <= 7) score = Math.max(score, 4);
  }
  if (d.severity === "critical") score = Math.max(score, 4);
  score = Math.min(5, Math.max(1, score));

  const level = levelFor(score);
  return {
    code,
    score,
    level,
    label: LEVEL[level],
    shortName: row?.shortName ?? code,
    assetLine: asset.line,
    assetScore: asset.score,
    means: row?.means ?? d.faultExplanation?.whatIsIt ?? "Live sensors are outside the expected envelope.",
    howHappened:
      row?.howHappened ??
      d.faultExplanation?.whyShowing ??
      "A live channel left the healthy envelope and the agents named this code.",
    rootCause: row?.rootCause ?? d.faultExplanation?.rootCause ?? "Live sensors are outside the expected operating envelope.",
    consequence: row?.consequence ?? "Condition will worsen",
    ifRunning:
      row?.ifRunning ??
      d.faultExplanation?.riskImpact ??
      "Keep running and the defect grows until a stop or a repair.",
    steps: row?.steps ?? [
      { icon: "stop", label: "Defect stays" },
      { icon: "time", label: "Grows" },
      { icon: "stop", label: "Outage" },
    ],
    what: row?.what ?? { icon: "stop", label: row?.shortName ?? "Defect" },
    where: row?.where ?? { icon: "walk", label: asset.line },
    notThis: row?.notThis ?? { icon: "ok", label: "Not healthy" },
    how: row?.how ?? [
      { icon: "stop", label: "Envelope left" },
      { icon: "time", label: "Grows" },
      { icon: "walk", label: "Inspect" },
    ],
    cause: row?.cause ?? [
      { icon: "stop", label: "Unconfirmed" },
      { icon: "walk", label: "Walkdown" },
    ],
    doThis: row?.doThis ?? [
      { icon: "walk", label: "Walkdown" },
      { icon: "seal", label: "Repair" },
    ],
    spareShort: row?.spareShort ?? null,
    timeLeft: timeLeft(d),
  };
}

export function pictogramForStep(step: string): ImpactStep {
  const s = step.toLowerCase();
  if (s.includes("soap") || s.includes("ultrasonic") || s.includes("leak detector")) return { icon: "soap", label: "Find leak" };
  if (s.includes("walk") || s.includes("discharge line") || s.includes("unions")) return { icon: "walk", label: "Walk line" };
  if (s.includes("not treat") || s.includes("not a bearing") || s.includes("do not treat")) return { icon: "bearing", label: "Not bearing" };
  if (s.includes("grease")) return { icon: "seal", label: "Grease" };
  if (s.includes("cable") || s.includes("transducer") || s.includes("accelerometer") || s.includes("bnc")) return { icon: "sensor", label: "Check cable" };
  if (s.includes("laser") || s.includes("align") || s.includes("shim") || s.includes("soft foot")) return { icon: "align", label: "Align" };
  if (s.includes("spider") || s.includes("coupling")) return { icon: "fitting", label: "Coupling" };
  if (s.includes("bearing") || s.includes("puller") || s.includes("induction")) return { icon: "bearing", label: "Swap race" };
  if (s.includes("infrared") || s.includes("thermal") || s.includes("temperature") || s.includes("hot spot")) return { icon: "thermal", label: "IR scan" };
  if (s.includes("torque") || s.includes("lug") || s.includes("feeder") || s.includes("multimeter") || s.includes("loop")) return { icon: "electrical", label: "Check feed" };
  if (s.includes("replace") || s.includes("seal") || s.includes("fitting")) return { icon: "seal", label: "Seal / fit" };
  const words = step.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2).join(" ");
  return { icon: "part", label: words || "Do this" };
}
