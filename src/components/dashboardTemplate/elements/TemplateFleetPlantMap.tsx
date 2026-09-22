"use client";

import { useMachines, useRealtime } from "@/context/RealtimeProvider";
import { Card } from "@/components/Card";
import { PlantMap } from "@/components/PlantMap";
import { faultSeverity, motorTempSeverity, vibrationSeverity, worstSeverity } from "@/lib/constants";

export interface TemplateFleetPlantMapProps {
  title?: string;
  subtitle?: string;
}

/** Reproduces the hardcoded Plant Overview's floor-map section verbatim — same
 *  per-machine severity computation (worst of fault/vibration/motor-temp), same
 *  "nothing to show" gate (no machines at all → render nothing). PlantMap itself
 *  already handles the "machines exist but none are placed on the floor" case. */
export function TemplateFleetPlantMap({ title, subtitle }: TemplateFleetPlantMapProps) {
  const { records } = useRealtime();
  const machines = useMachines();

  if (machines.length === 0) return null;

  const mapMachines = machines.map((m) => {
    const t = records[m.id]?.latest;
    const worstFault = t && t.motorFaults.length > 0 ? t.motorFaults.reduce((a, b) => (a.confidence > b.confidence ? a : b)) : null;
    const severity = t
      ? worstSeverity([
          worstFault ? faultSeverity(worstFault.confidence) : "good",
          vibrationSeverity(t.imuAcceleration),
          motorTempSeverity(t.temperature.motor),
        ])
      : "good";
    return {
      id: m.id,
      label: m.name,
      mapX: m.mapX,
      mapY: m.mapY,
      severity,
      online: m.online,
      freshness: m.freshness,
      lastSeen: m.lastSeen,
    };
  });

  return (
    <Card title={title ?? "Plant floor map"} subtitle={subtitle ?? "Machines placed on the floor — colored by live health"}>
      <PlantMap machines={mapMachines} />
    </Card>
  );
}
