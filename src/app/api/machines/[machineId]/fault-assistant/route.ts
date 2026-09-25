import { NextRequest, NextResponse } from "next/server";
import { getFaultState } from "@/lib/faultStore";

const FASTAPI_URL = process.env.BACKEND_FASTAPI_URL || (process.env.NODE_ENV === "production" ? "https://predictivemaintenance-production-e27a.up.railway.app" : "http://localhost:8004");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  return handleAssistantRequest(req, await params);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  return handleAssistantRequest(req, await params);
}

async function handleAssistantRequest(
  req: NextRequest,
  { machineId }: { machineId: string }
) {

  try {
    // 1. Fetch live telemetry from FastAPI backend
    const telemRes = await fetch(`${FASTAPI_URL}/api/v1/assets/${encodeURIComponent(machineId)}/telemetry`, {
      cache: "no-store",
    });
    const telemetry = telemRes.ok ? await telemRes.json() : { machineId };
    const faultState = getFaultState(machineId);
    if (faultState.scenario === "cable_cut") {
      telemetry.imuAcceleration = 0.0;
      telemetry.emIr = 14.5;
      telemetry.emIy = 14.2;
      telemetry.emIb = 14.4;
      telemetry.emPower = 8.6;
      telemetry.emMachineLoad = 42;
      telemetry.vibrationHarmonics = [];
      telemetry.motorFaults = [
        { fault_code: "HARDWARE_CABLE_FAULT", description: "Sensor cable disconnect", confidence: 1, active: true },
      ];
    } else if (faultState.scenario === "misalignment") {
      telemetry.imuAcceleration = 6.2;
      telemetry.rpm = telemetry.rpm || 1480;
      const f1 = +(telemetry.rpm / 60).toFixed(1);
      telemetry.vibrationHarmonics = [
        { frequency: f1, amplitude: -22.0 },
        { frequency: +(2 * f1).toFixed(1), amplitude: -2.0 },
      ];
      telemetry.waveform = null;
      telemetry.waveformX = null;
      telemetry.waveformY = null;
      telemetry.waveformZ = null;
      telemetry.rawWaveform = null;
      telemetry.motorFaults = [
        { fault_code: "MF002", description: "Shaft Angular Misalignment (2X)", confidence: 0.94, active: true },
      ];
      if ((telemetry.emPower ?? 0) < 0.5) {
        telemetry.emIr = 14.5;
        telemetry.emIy = 14.2;
        telemetry.emIb = 14.4;
        telemetry.emPower = 8.6;
        telemetry.emMachineLoad = 42;
      }
    } else if (faultState.scenario === "bearing_bpfi") {
      telemetry.imuAcceleration = 8.5;
      telemetry.tempMotor = 74.0;
      telemetry.rpm = telemetry.rpm || 2950;
      const f1 = +(telemetry.rpm / 60).toFixed(1);
      const bpfiHz = +(5.43 * f1).toFixed(1);
      telemetry.vibrationHarmonics = [
        { frequency: f1, amplitude: -18.0 },
        { frequency: bpfiHz, amplitude: -4.0 },
      ];
      telemetry.waveform = null;
      telemetry.waveformX = null;
      telemetry.waveformY = null;
      telemetry.waveformZ = null;
      telemetry.rawWaveform = null;
      telemetry.motorFaults = [
        { fault_code: "BPFI", description: "Bearing Inner Race Flaw (BPFI)", confidence: 0.96, active: true },
      ];
      if ((telemetry.emPower ?? 0) < 0.5) {
        telemetry.emIr = 14.5;
        telemetry.emIy = 14.2;
        telemetry.emIb = 14.4;
        telemetry.emPower = 8.6;
        telemetry.emMachineLoad = 42;
      }
    } else if (faultState.scenario === "voltage_unbalance") {
      telemetry.imuAcceleration = 1.8 + ((Date.now() % 7) * 0.01);
      telemetry.rpm = telemetry.rpm || 2950;
      telemetry.emVr = 432.0;
      telemetry.emVy = 368.0;
      telemetry.emVb = 401.0;
      telemetry.emVoltageImbalance = 4.8;
      telemetry.tempMotor = 66.5;
      telemetry.emIr = 14.5;
      telemetry.emIy = 13.1;
      telemetry.emIb = 14.0;
      telemetry.emPower = 8.6;
      telemetry.emMachineLoad = 42;
      telemetry.vibrationHarmonics = [];
      telemetry.waveform = null;
      telemetry.waveformX = null;
      telemetry.waveformY = null;
      telemetry.waveformZ = null;
      telemetry.rawWaveform = null;
      telemetry.motorFaults = [
        { fault_code: "EF001", description: "3-Phase Voltage Unbalance (VUF 4.8%)", confidence: 0.93, active: true },
      ];
    }

    // Fault-injection buttons are explicit synthetic tests. Mark only the fields the
    // selected scenario deliberately supplies; nominal mode keeps the MQTT presence
    // metadata untouched and therefore halts when Product A acceleration is absent.
    if (faultState.scenario !== "nominal") {
      const supplied = new Set<string>(Array.isArray(telemetry.sourceKeys) ? telemetry.sourceKeys : []);
      ["imuAcceleration", "rpm", "tempMotor", "vibrationHarmonics"].forEach((key) => supplied.add(key));
      if ((telemetry.emPower ?? 0) >= 0) {
        ["emIr", "emIy", "emIb", "emVr", "emVy", "emVb", "emMachineLoad", "emVoltageImbalance", "emPower"]
          .forEach((key) => supplied.add(key));
      }
      telemetry.sourceKeys = [...supplied];
    }

    // 2. Call the 4-Agent LangGraph AI pipeline
    const predRes = await fetch(`${FASTAPI_URL}/api/v1/predict_rul`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetry),
      cache: "no-store",
    });

    if (!predRes.ok) {
      return NextResponse.json({
        machineId,
        archetype: "UNKNOWN",
        generatedAt: Date.now(),
        headline: "Diagnosis Service Temporarily Unavailable",
        severity: "warning",
        summary: `FastAPI 4-Agent pipeline returned HTTP ${predRes.status}.`,
        recommendedActions: ["Check connection to FastAPI backend on port 8004."],
      });
    }

    const apms = await predRes.json();
    const isHalt = apms.cable_check?.status !== "VALID";
    const injectKeepsPipeline = ["misalignment", "bearing_bpfi", "voltage_unbalance"].includes(faultState.scenario);
    const showSensorHalt = faultState.scenario === "cable_cut" || (isHalt && !injectKeepsPipeline);
    const isFieldMissing = apms.cable_check?.status === "FIELD_NOT_PRESENT";
    const missingFields = Array.isArray(telemetry.missingBlocks)
      ? telemetry.missingBlocks.map(String)
      : [];
    const defect = apms.defect_localization;
    const rul = apms.rul_prediction;
    const isDefect = defect && defect.defect_code !== "NORMAL";
    const cmms = apms.cmms_work_order;
    const elec = apms.electrical_health;
    const thermal = apms.thermal_de_weathering;

    let headline = "All Monitored Parameters Operating Nominally";
    let severity: "good" | "warning" | "critical" = "good";
    let archetype = defect?.defect_code || "NORMAL";

    if (showSensorHalt) {
      headline = `Sensor Anomaly Halted: ${apms.cable_check?.status || "SENSOR_HALT"}`;
      severity = isFieldMissing ? "warning" : "critical";
      archetype = apms.cable_check?.status || "SENSOR_HALT";
    } else if (faultState.scenario === "bearing_bpfi") {
      headline = "Bearing Inner Race (BPFI) Spalling Defect Identified";
      severity = "critical";
      archetype = "BPFI";
    } else if (faultState.scenario === "voltage_unbalance") {
      headline = "3-Phase Voltage Imbalance (VUF 4.8%) Identified";
      severity = "critical";
      archetype = "EF001";
    } else if (faultState.scenario === "misalignment") {
      headline = "Shaft Angular & Parallel Misalignment (MF002) Identified";
      severity = "critical";
      archetype = "MF002";
    } else if (isDefect) {
      headline = defect.defect_code === "PF001"
        ? "Compressed-air leak (PF001) Identified"
        : `${defect.defect_name} (${defect.defect_code}) Identified`;
      severity = rul && rul.rul_days < 14 ? "critical" : "warning";
      archetype = defect.defect_code;
    }

    const summaryParts: string[] = [];
    summaryParts.push(`• Agent Alpha (Gatekeeper): ${showSensorHalt ? `HALTED (${apms.cable_check.fault_reason})` : `Validated sensor integrity across 11 checks (Pattern: ${apms.cable_check.pattern_recognition_status || "STABLE"}).`}`);
    if (elec) {
      const riseC = thermal?.delta_temperature_c ?? thermal?.true_thermal_rise_c;
      const riseLabel = typeof riseC === "number" ? `${riseC >= 0 ? "+" : ""}${riseC.toFixed(1)}` : "n/a";
      summaryParts.push(`• Agent Beta (De-Weathering & PQ): Domain: ${elec.isolated_failure_domain} | VUF: ${elec.voltage_unbalance_pct?.toFixed(2) ?? "1.12"}% | True Thermal Rise: ${riseLabel}°C.`);
    }
    if (defect && rul) {
      summaryParts.push(`• Agent Gamma (Prognostics): Diagnosed ${defect.defect_name} via ${defect.diagnosis_method}. Estimated RUL is ${rul.rul_days?.toFixed(1)} days (${rul.rul_operating_hours?.toFixed(0)} operating hours).`);
    }
    if (cmms && cmms.work_order_id) {
      const reservedPart = cmms.reserved_spare_part_bom
        || cmms.sourcing_intelligence?.oem_part_number
        || (Array.isArray(cmms.required_spare_parts) ? cmms.required_spare_parts.join(", ") : "")
        || "unconfirmed BOM";
      const sourcing = cmms.sourcing_intelligence?.sourcing_recommendation || cmms.sourcing_status || "ADVISORY";
      const win = cmms.sourcing_intelligence?.winning_source;
      const optN = Array.isArray(cmms.sourcing_intelligence?.purchase_options)
        ? cmms.sourcing_intelligence.purchase_options.length
        : 0;
      const buy = optN > 0 ? ` ${optN} buy options attached.` : "";
      summaryParts.push(`• Agent Delta (Prescriptive Maintenance): CMMS Work Order ${cmms.work_order_id} drafted. Parts: ${reservedPart} at ${cmms.reserved_warehouse_bin}. Ladder: ${win || sourcing}.${buy}`);
    }

    const recommendedActions: string[] = [];
    if (isFieldMissing) {
      recommendedActions.push(`Restore the missing MQTT fields: ${missingFields.join(", ") || "Product A telemetry"}.`);
      recommendedActions.push("Verify the Product A publisher and gateway topic mapping; do not infer missing values as zero.");
    } else if (showSensorHalt) {
      recommendedActions.push("Inspect accelerometer sensor cable and transducer connection.");
      recommendedActions.push("Verify NAMUR NE43 4–20 mA loop current with multimeter.");
    } else if (faultState.scenario === "misalignment") {
      recommendedActions.push("Field Triage: Inspect flexible coupling spider/elastomer for rubber dust; check motor feet for soft-foot with a feeler gauge before laser alignment.");
      if (cmms?.recommended_action) {
        recommendedActions.push(`CMMS Action: ${cmms.recommended_action}`);
      }
      if (cmms?.scheduled_repair_window || cmms?.scheduled_downtime_window) {
        recommendedActions.push(`Scheduled window: ${cmms.scheduled_repair_window || cmms.scheduled_downtime_window}${cmms.pm_due_date ? ` · due ${cmms.pm_due_date}` : ""}`);
      }
    } else if (faultState.scenario === "bearing_bpfi") {
      recommendedActions.push("Field Triage: Inject 15 g of SKF LGHP 2 polyurea grease at the drive-end housing; do not wait for a planned window if temperature stays above 65°C.");
      if (cmms?.recommended_action) {
        recommendedActions.push(`CMMS Action: ${cmms.recommended_action}`);
      }
      if (cmms?.scheduled_repair_window || cmms?.scheduled_downtime_window) {
        recommendedActions.push(`Scheduled window: ${cmms.scheduled_repair_window || cmms.scheduled_downtime_window}${cmms.pm_due_date ? ` · due ${cmms.pm_due_date}` : ""}`);
      }
    } else if (faultState.scenario === "voltage_unbalance") {
      recommendedActions.push("Field Triage: IR-scan MCC feeder lugs for a >15°C phase-to-phase hot spot; re-torque loose Y-phase connections before a winding burn.");
      if (cmms?.recommended_action) {
        recommendedActions.push(`CMMS Action: ${cmms.recommended_action}`);
      }
      if (cmms?.scheduled_repair_window || cmms?.scheduled_downtime_window) {
        recommendedActions.push(`Scheduled window: ${cmms.scheduled_repair_window || cmms.scheduled_downtime_window}${cmms.pm_due_date ? ` · due ${cmms.pm_due_date}` : ""}`);
      }
    } else if (isDefect) {
      if (defect.expert_repair_guidance?.immediate_field_triage) {
        recommendedActions.push(`Field Triage: ${defect.expert_repair_guidance.immediate_field_triage}`);
      }
      if (cmms?.recommended_action) {
        recommendedActions.push(`CMMS Action: ${cmms.recommended_action}`);
      }
      if (cmms?.scheduled_repair_window || cmms?.scheduled_downtime_window) {
        recommendedActions.push(`Scheduled window: ${cmms.scheduled_repair_window || cmms.scheduled_downtime_window}${cmms.pm_due_date ? ` · due ${cmms.pm_due_date}` : ""}`);
      }
    } else {
      recommendedActions.push("Continue 24/7 continuous autonomous telemetry monitoring.");
      recommendedActions.push("Maintain standard lubrication schedule according to OEM guidelines.");
    }

    const buyOptions = cmms?.sourcing_intelligence?.purchase_options;
    if (Array.isArray(buyOptions) && buyOptions.length > 0) {
      recommendedActions.push(
        `Stores and tagged vendors do not have ${cmms?.sourcing_intelligence?.oem_part_number || "the part"}. Open the ${buyOptions.length} OEM / India B2B / global MRO buy options on the AI tab.`,
      );
    }

    // Build comprehensive fault explanation and options to fix it
    let faultExplanation: {
      whatIsIt: string;
      whyShowing?: string;
      notThis?: string;
      sparePart?: string;
      rootCause: string;
      riskImpact: string;
    } | undefined = undefined;
    let repairOptions: Array<{
      title: string;
      category: "Immediate Triage" | "Precision Repair" | "Parts & CMMS";
      urgency: "Immediate" | "Scheduled" | "Preventive";
      steps: string[];
      partsOrTools?: string;
      estDowntime?: string;
    }> = [];

    if (isFieldMissing) {
      const names = missingFields.join(", ") || "Product A fields";
      faultExplanation = {
        whatIsIt: `The gateway is online, but the current aggregate does not contain ${names}. These values are unavailable—not measured zero.`,
        whyShowing: "The AI Assistant is showing this because Product A vibration/RPM fields are absent from the live MQTT aggregate, so Agent Alpha cannot validate the sensor path.",
        notThis: "Do not treat missing fields as a healthy zero, and do not order a bearing.",
        sparePart: "No machine spare — restore the MQTT publisher first.",
        rootCause: "The corresponding Product A publisher/topic is absent, stopped, or not included by the upstream integrated-data gateway.",
        riskImpact: "Mechanical vibration and RUL diagnosis cannot be validated. Agents Beta, Gamma and Delta are safely halted to prevent false defects and work orders.",
      };
      repairOptions = [
        {
          title: "Restore Product A MQTT Fields",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            "Verify that the Product A acceleration/orientation device is powered and publishing.",
            "Confirm X/Y/Z acceleration and machine RPM are present on the configured pdm/* topics.",
            "Do not substitute zero or catalog defaults; rerun diagnosis after real fields appear.",
          ],
          partsOrTools: "MQTT topic monitor and Product A gateway diagnostics",
          estDowntime: "No machine shutdown required",
        },
      ];
    } else if (showSensorHalt) {
      faultExplanation = {
        whatIsIt: "Sensor cable disconnect. The 3-axis accelerometer is reading 0.0 mm/s while the motor is still drawing current — this is a dead sensor, not a healthy machine.",
        whyShowing: "Shown because Agent Alpha halted: vibration is stuck at zero while phase current / power still look loaded.",
        notThis: "Do not treat 0.0 mm/s as a healthy machine or a seized motor.",
        sparePart: "No machine spare — inspect the sensor lead first.",
        rootCause: "Physical vibration transducer cable severed, disconnected BNC connector, loose terminal block, or degraded NAMUR NE43 loop power supply.",
        riskImpact: "Blinds supervisory monitoring — if a genuine mechanical breakdown occurs, the system cannot detect it. Downstream AI agents are safe-halted to prevent false alarms.",
      };
      repairOptions = [
        {
          title: "Inspect Physical Cable & Transducer",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            "Visually trace accelerometer cable from motor bearing housing to junction box for pinching, cuts, or heat melting.",
            "Inspect coaxial BNC / MIL-C-5015 bayonet connector for pin oxidation or loose coupling sleeve.",
            "Ensure accelerometer mounting stud is torqued to 3.5 Nm.",
          ],
          partsOrTools: "Flashlight, 10mm wrench, connector contact cleaner",
          estDowntime: "15 minutes",
        },
        {
          title: "Verify NAMUR NE43 4–20 mA Loop Current",
          category: "Precision Repair",
          urgency: "Immediate",
          steps: [
            "Connect digital multimeter in series with 4–20 mA analog input loop at PLC panel terminal.",
            "Verify current: Valid range is 4.0–20.0 mA. If reading < 3.6 mA, circuit is open/broken.",
            "Check 24V DC auxiliary power supply voltage stability.",
          ],
          partsOrTools: "Digital Multimeter (Fluke 87V or equivalent)",
          estDowntime: "20 minutes",
        },
        {
          title: "Replace Transducer & Restore Telemetry",
          category: "Parts & CMMS",
          urgency: "Scheduled",
          steps: [
            "If cable is severed beyond repair, replace with reserve stock accelerometer (PCB 603C01 or IMI 608A11).",
            "Update sensor calibration constants in data acquisition node.",
            "Trigger manual AI Assistant verification scan to clear Sensor Halt state.",
          ],
          partsOrTools: "Reserve Accelerometer (Bin: SENS-E14), RG-58 shielded cable",
          estDowntime: "45 minutes",
        },
      ];
    } else if (faultState.scenario === "bearing_bpfi" || (defect && (defect.defect_code === "BPFI" || defect.defect_code === "BPFO" || defect.defect_name?.toLowerCase().includes("bpfi") || defect.defect_name?.toLowerCase().includes("bpfo")))) {
      const outer = defect?.defect_code === "BPFO" || defect?.defect_name?.toLowerCase().includes("bpfo");
      faultExplanation = {
        whatIsIt: outer
          ? "Outer-race bearing defect — rolling elements hit a spall on the outer race (BPFO)."
          : `Bearing Ball Pass Frequency Inner Race (BPFI) Spalling Defect. Fatigue micro-spalling on the inner raceway of motor bearing SKF 6208, generating shock pulses at 5.43× shaft speed and elevated housing temperature (74°C).`,
        notThis: "This is a bearing race job, not an air leak, cable cut, or voltage unbalance.",
        sparePart: outer
          ? "SKF 6208-2RS1/C3 NDE bearing (SKF-6208)."
          : "SKF 6208-2RS1/C3 drive-end bearing (SKF-6208).",
        rootCause: "Excess dynamic radial loads, contaminated lubricant, or electrical discharge machining (EDM fluting) from high-frequency VFD inverter switching currents.",
        riskImpact: "Spall craters expand along the raceway, increasing vibration to > 11.2 mm/s (ISO Danger Zone). Complete bearing cage seizure risk within 9.8 days.",
      };
      repairOptions = [
        {
          title: outer ? "Stabilize the NDE bearing" : "Stabilize the drive-end bearing",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            "Clean grease purge plug and grease fitting on motor DE (Drive End) bearing housing.",
            "Inject 15 grams of high-temperature polyurea grease (SKF LGHP 2) using calibrated manual grease gun.",
            "Monitor housing temperature for 30 minutes: if temperature drops below 65°C and stabilizes, proceed to scheduled replacement.",
          ],
          partsOrTools: "SKF LGHP 2/1 Grease, Grease Gun with pressure gauge",
          estDowntime: "15 minutes (online)",
        },
        {
          title: "Bearing Pull & Induction Fitment Replacement",
          category: "Precision Repair",
          urgency: "Scheduled",
          steps: [
            "De-energize motor (LOTO lock-out tag-out) and decouple driven load.",
            "Extract damaged bearing using mechanical 3-jaw puller (SKF TMHP) without scoring the shaft journal.",
            "Inspect bearing seat with micrometer for ovality (< 0.012 mm tolerance).",
            "Heat new SKF 6208 bearing on induction heater (SKF TIH 030M) to exactly 110°C; slide onto shaft until firmly seated against shoulder.",
          ],
          partsOrTools: "Bearing Puller TMHP, Induction Heater TIH 030M, Infrared Thermometer",
          estDowntime: "3.5 hours",
        },
        {
          title: "VFD Shaft Grounding Ring & CMMS Closeout",
          category: "Parts & CMMS",
          urgency: "Scheduled",
          steps: [
            `Execute CMMS Work Order ${cmms?.work_order_id || "ADVISORY-DRAFT-compressor_unit_01"}.`,
            "Install AEGIS SGR shaft grounding ring to divert harmful VFD shaft voltages to ground and prevent future raceway fluting.",
            `Reserved Part: ${cmms?.required_spare_parts?.join(", ") || "SKF 6208 C3 Deep Groove Ball Bearing"} at ${cmms?.reserved_warehouse_bin || "BIN-A12"}.`,
            "Perform baseline vibration recording and sign off work order in ERP.",
          ],
          partsOrTools: "SKF 6208 C3 Bearing, AEGIS Shaft Grounding Ring SGR-1.875",
          estDowntime: "4 hours",
        },
      ];
    } else if (faultState.scenario === "voltage_unbalance" || (defect && (defect.defect_code === "EF001" || (faultState.scenario !== "misalignment" && (defect.defect_name?.toLowerCase().includes("voltage") || defect.defect_name?.toLowerCase().includes("unbalance")))))) {
      faultExplanation = {
        whatIsIt: "Severe 3-Phase Voltage Imbalance (VUF 4.8%). Unequal line-to-line voltages (V_R=432V, V_Y=368V, V_B=401V) creating negative-sequence magnetic fields that counter motor rotation.",
        notThis: "No mechanical spare — fix the incoming supply / MCC, not the skid.",
        sparePart: "No mechanical spare — do not order SKF 6208.",
        rootCause: "Unbalanced single-phase utility supply, high-resistance connection on Phase Y feeder busbar, or degraded capacitor in local Power Factor Correction (PFC) bank.",
        riskImpact: "Causes exponential stator coil heating (NEMA MG-1 formula: 2 × VUF² = 46% thermal rise). Reduces motor life by 50% and causes premature winding insulation burnout.",
      };
      repairOptions = [
        {
          title: "Thermal IR Scan of Feeder MCC Breakers",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            "Perform thermal infrared imaging scan across incoming feeder breaker lugs, contactors, and disconnect switches.",
            "Check for thermal hot spots (> 15°C delta between phases indicates loose connection or pitted contactor tips).",
            "Torque all feeder busbar bolted connections to specified manufacturer ratings (35 Nm for M10).",
          ],
          partsOrTools: "FLIR Thermal Camera, Insulated Torque Screwdriver",
          estDowntime: "20 minutes",
        },
        {
          title: "Single-Phase Load Redistribution & Power Quality Audit",
          category: "Precision Repair",
          urgency: "Scheduled",
          steps: [
            "Measure individual phase currents at main sub-distribution board with true-RMS clamp meter.",
            "Shift single-phase auxiliary lighting and 230V control loads off heavily loaded Phase Y onto Phase B.",
            "Target Voltage Unbalance Factor (VUF) below 1.0% in accordance with IEC 61000-2-4 Class 2 standard.",
          ],
          partsOrTools: "Fluke 435 Series II Power Quality Analyzer",
          estDowntime: "1 hour",
        },
        {
          title: "Inspect Power Factor Capacitor Bank & Relay Setpoints",
          category: "Parts & CMMS",
          urgency: "Scheduled",
          steps: [
            `Execute CMMS Work Order ${cmms?.work_order_id || "ADVISORY-DRAFT-compressor_unit_01"}.`,
            "Test PFC capacitor cells on local MCC bank: replace blown HRC fuses or swollen capacitor cans.",
            "Verify electronic motor overload relay (ANSI 47/46) is enabled with 3.0% negative sequence trip threshold.",
            `Reserved Part: ${cmms?.required_spare_parts?.join(", ") || "Schneider 25kVAR PFC Capacitor Unit"}.`,
          ],
          partsOrTools: "Capacitance meter, 25kVAR PFC Capacitor Module",
          estDowntime: "2 hours",
        },
      ];
    } else if (faultState.scenario === "misalignment" || (defect && (defect.defect_code === "MF002" || defect.defect_name?.toLowerCase().includes("misalignment")))) {
      faultExplanation = {
        whatIsIt: "Shaft Angular & Parallel Coupling Misalignment. The driving motor shaft and the driven compressor shaft centerlines are not collinear, causing 2X rotational harmonic vibration spikes (6.2 mm/s).",
        notThis: "This is a coupling / shim job, not an SKF 6208 replacement.",
        sparePart: "Lovejoy L-100 SOX elastomer + motor-foot shims (COUPLING-L100).",
        rootCause: "Thermal growth differential between motor and compressor, loose foundation hold-down bolts ('soft foot'), foundation settling, or degraded elastomeric jaw insert in flexible coupling.",
        riskImpact: "Cyclic bending and fatigue on motor bearings and shafts. Causes accelerated seal leakage, coupling element shredding, and bearing race fatigue within ~20 days.",
      };
      repairOptions = [
        {
          title: "Immediate Field Triage & Soft Foot Inspection",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            "Remove coupling guard and inspect for black rubber dust or shredded elastomer particles.",
            "Check motor hold-down bolts for loose foot: loosen one bolt at a time with feeler gauge under foot.",
            "If any foot has gap > 0.05 mm, correct soft foot before proceeding to alignment.",
          ],
          partsOrTools: "Torque wrench, feeler gauge set, coupling inspection light",
          estDowntime: "30 minutes (non-destructive)",
        },
        {
          title: "Precision 4-Point Laser Shaft Alignment",
          category: "Precision Repair",
          urgency: "Scheduled",
          steps: [
            "Mount dual-laser alignment heads (SKF Shaft Alignment Tool TKSA or Easy-Laser) across motor and compressor shafts.",
            "Rotate shafts through 90° or 180° sweep to measure horizontal and vertical offset and angularity.",
            "Add precision stainless steel shims (0.05 mm – 0.50 mm) under motor feet to bring angularity < 0.05 mm/100mm and parallel offset < 0.05 mm.",
            "Re-torque hold-down bolts in diagonal cross-pattern to 125 Nm and perform final verification check.",
          ],
          partsOrTools: "Laser Alignment Kit (TKSA 41), Pre-cut Stainless Steel Shims (Bin: BIN-SHIM-04)",
          estDowntime: "2 hours during planned shift window",
        },
        {
          title: "Replace Worn Flexible Coupling Spider & Execute CMMS",
          category: "Parts & CMMS",
          urgency: "Scheduled",
          steps: [
            `Execute CMMS Work Order ${cmms?.work_order_id || "ADVISORY-DRAFT-compressor_unit_01"}.`,
            "Disengage hubs and replace worn polyurethane spider insert with OEM SKF / Lovejoy Jaw Coupling Insert.",
            `Reserved Part: ${cmms?.reserved_spare_part_bom || cmms?.sourcing_intelligence?.oem_part_number || cmms?.required_spare_parts?.join(", ") || "Lovejoy L-100 SOX Elastomer / precision shims"} from ${cmms?.reserved_warehouse_bin || "Warehouse Bin BIN-SHIM-04"}.`,
            "Reinstall safety guard and log alignment certificate in maintenance ERP.",
          ],
          partsOrTools: "OEM Spider Insert, Jaw Puller",
          estDowntime: "1.5 hours",
        },
      ];
    } else if (isDefect && (defect.defect_code === "PF001" || String(defect.defect_name || "").toLowerCase().includes("leak"))) {
      faultExplanation = {
        whatIsIt:
          "Compressed air is escaping the discharge circuit — fittings, drain traps, cooler joints, or a passing solenoid. This is a piping / process leak, not a motor bearing.",
        whyShowing:
          `Shown when the plant gateway publishes a PF* leak code, or discharge pressure falls, or the microphone sees a leak-band peak while the package is on.${
            defect.diagnosis_method ? ` Trigger method: ${String(defect.diagnosis_method).replaceAll("_", " ")}.` : ""
          }`,
        notThis:
          "Healthy or missing vibration does not clear this alert. A leak wastes air and energy while the screw can stay ISO 20816 Zone A.",
        sparePart: "Air-circuit fitting / seal kit (AIR-LEAK-KIT) — not a bearing.",
        rootCause:
          defect.expert_repair_guidance?.root_cause_mechanism
          || "Process leakage on the air circuit (ISO 11011). Vibration RMS can stay Zone A while energy and pressure are lost through fittings.",
        riskImpact: `Estimated remaining useful life is ${rul?.rul_days?.toFixed(1) || "2"} days before a potential unplanned outage.`,
      };
      repairOptions = [
        {
          title: "Find and seal the air leak",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            defect?.expert_repair_guidance?.immediate_field_triage
              || "Walk the discharge line with an ultrasonic leak detector; soap-test unions, drain traps, and the safety valve.",
            "Do not treat this as a bearing failure — vibration can stay healthy while air is leaking.",
          ],
          partsOrTools: "Ultrasonic leak detector, soap spray, calibrated pressure gauge",
          estDowntime: "30–60 minutes",
        },
      ];
    } else if (isDefect) {
      faultExplanation = {
        whatIsIt: `${defect.defect_name || "Mechanical Anomaly"} detected on the live machine.`,
        whyShowing: defect.diagnosis_method
          ? `Shown because Agent Gamma matched this pattern via ${String(defect.diagnosis_method).replaceAll("_", " ")}.`
          : "Shown because live telemetry crossed a diagnostic rule.",
        notThis: "Do not default to SKF 6208. Confirm the fault code before ordering a spare.",
        sparePart: "Inspect first — do not invent a part.",
        rootCause: defect.expert_repair_guidance?.root_cause_mechanism
          || "Mechanical degradation or abnormal dynamic load operating outside OEM baselines.",
        riskImpact: `Estimated remaining useful life is ${rul?.rul_days?.toFixed(1) || "14"} days before potential unplanned outage.`,
      };
      repairOptions = [
        {
          title: "Field Diagnostic Triage",
          category: "Immediate Triage",
          urgency: "Immediate",
          steps: [
            defect?.expert_repair_guidance?.immediate_field_triage || "Inspect motor and mechanical coupling for physical abnormal vibration or noise.",
            "Verify operating temperatures on bearings and motor stator frame with handheld pyrometer.",
          ],
          partsOrTools: "Infrared thermometer, vibration pen",
          estDowntime: "15 minutes",
        },
        {
          title: "Planned Maintenance & Alignment Check",
          category: "Precision Repair",
          urgency: "Scheduled",
          steps: [
            "Inspect mechanical tolerances, shaft runout, and mounting bolt torque.",
            "Adhere to ISO-13379 maintenance standards for industrial rotating equipment.",
          ],
          partsOrTools: "Dial indicators, feeler gauges",
          estDowntime: "1-2 hours",
        },
      ];
    }

    return NextResponse.json({
      machineId,
      archetype,
      generatedAt: Date.now(),
      headline,
      severity,
      summary: summaryParts.join("\n"),
      recommendedActions,
      faultExplanation,
      repairOptions,
      pipelineDetails: apms,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute diagnosis" },
      { status: 500 }
    );
  }
}
