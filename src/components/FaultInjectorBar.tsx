"use client";

import { useState, useEffect } from "react";
import type { FaultScenario } from "@/lib/faultStore";

interface FaultInjectorBarProps {
  machineId: string;
}

export function FaultInjectorBar({ machineId }: FaultInjectorBarProps) {
  const [activeScenario, setActiveScenario] = useState<FaultScenario>("nominal");
  const [vibThreshold, setVibThreshold] = useState<number>(4.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    fetch(`/api/machines/${encodeURIComponent(machineId)}/inject-fault`)
      .then((res) => res.json())
      .then((data) => {
        if (data.scenario) setActiveScenario(data.scenario);
        if (data.vibrationThreshold) setVibThreshold(data.vibrationThreshold);
      })
      .catch(() => {});
  }, [machineId]);

  const handleInject = async (scenario: FaultScenario) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/machines/${encodeURIComponent(machineId)}/inject-fault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, vibrationThreshold: vibThreshold }),
      });
      const data = await res.json();
      setActiveScenario(data.scenario);
      window.dispatchEvent(new CustomEvent("apms:fault-scenario-changed", {
        detail: { machineId, scenario: data.scenario },
      }));
      setFeedback(`Applied: ${scenario.toUpperCase().replace("_", " ")}`);
      setTimeout(() => setFeedback(""), 3000);
    } catch {
      setFeedback("Failed to inject scenario");
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = async (val: number) => {
    setVibThreshold(val);
    try {
      await fetch(`/api/machines/${encodeURIComponent(machineId)}/inject-fault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: activeScenario, vibrationThreshold: val }),
      });
    } catch {}
  };

  const scenarios: { key: FaultScenario; label: string; desc: string; color: string; border: string }[] = [
    {
      key: "nominal",
      label: "Nominal Stream",
      desc: "Live MQTT stream (Agent Alpha pass, 0 faults, healthy RUL)",
      color: "bg-emerald-950/60 text-emerald-400",
      border: "border-emerald-700/60 hover:border-emerald-500",
    },
    {
      key: "cable_cut",
      label: "Sensor cable cut",
      desc: "Vibration 0.0 while motor runs (Agent Alpha HALT / cable fault)",
      color: "bg-red-950/60 text-red-400",
      border: "border-red-700/60 hover:border-red-500",
    },
    {
      key: "misalignment",
      label: "2X Misalignment",
      desc: "Angular coupling flaw (6.2 mm/s vibration, 2X harmonic spike)",
      color: "bg-amber-950/60 text-amber-400",
      border: "border-amber-700/60 hover:border-amber-500",
    },
    {
      key: "bearing_bpfi",
      label: "Bearing BPFI",
      desc: "Inner race spalling (8.5 mm/s, 74°C, CMMS Work Order)",
      color: "bg-blue-950/60 text-blue-400",
      border: "border-blue-700/60 hover:border-blue-500",
    },
    {
      key: "voltage_unbalance",
      label: "Voltage Imbalance",
      desc: "Power quality VUF 4.8% (Agent Beta PQ root-cause isolation)",
      color: "bg-purple-950/60 text-purple-400",
      border: "border-purple-700/60 hover:border-purple-500",
    },
  ];

  return (
    <div className="rounded-xl border border-hairline bg-surface p-3 transition-colors shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-hairline/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Live Test Scenarios
          </span>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-mono text-primary border border-hairline">
            Active: <strong className="text-accent">{activeScenario.toUpperCase()}</strong>
          </span>
          {feedback && <span className="text-xs text-emerald-400 font-medium animate-pulse">{feedback}</span>}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <span>ISO Vib Alert Limit:</span>
          <input
            type="range"
            min="2.0"
            max="10.0"
            step="0.5"
            value={vibThreshold}
            onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
            className="w-20 cursor-pointer accent-accent"
          />
          <span className="font-mono text-primary font-bold">{vibThreshold.toFixed(1)} mm/s</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.key;
          return (
            <button
              key={sc.key}
              type="button"
              disabled={loading}
              onClick={() => handleInject(sc.key)}
              title={sc.desc}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                isActive
                  ? `${sc.color} ring-1 ring-accent border-accent font-semibold shadow-md`
                  : `bg-surface-2 text-secondary ${sc.border}`
              }`}
            >
              {sc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
