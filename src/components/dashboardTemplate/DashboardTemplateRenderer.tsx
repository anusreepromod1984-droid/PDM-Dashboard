"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCompany } from "@/context/CompanyProvider";
import { useMachines } from "@/context/RealtimeProvider";
import { StaticRealtimeProvider } from "@/lib/dashboardTemplate/StaticRealtimeProvider";
import { StaticCompanyProvider } from "@/lib/dashboardTemplate/StaticCompanyProvider";
import { getLiquidEngine } from "@/lib/dashboardTemplate/liquidEngine";
import { buildMachineTemplateContext, buildTemplateContext } from "@/lib/dashboardTemplate/buildTemplateContext";
import { parseToReactTree } from "@/lib/dashboardTemplate/parseToReactTree";
import type { CompanySummary, MachineMeta, MachineRecord } from "@/lib/types";

interface DashboardTemplateRendererProps {
  source: string;
  /** Present for one of the 6 per-machine view templates; omitted for the fleet page. */
  machineId?: string;
  /**
   * Only passed by the Gbotz preview pane, which has no CompanyProvider/
   * RealtimeProvider in its tree (no authenticated tenant user, no per-company
   * socket). Omit on the tenant side — it already has both mounted higher up
   * (CompanyGate -> CompanyProvider -> RealtimeProvider), and this component reads
   * from them directly via the same hooks every other tenant component uses.
   */
  preview?: {
    company: CompanySummary;
    machines: MachineMeta[];
    records: Record<string, MachineRecord>;
  };
}

export function DashboardTemplateRenderer({ source, machineId, preview }: DashboardTemplateRendererProps) {
  if (preview) {
    return (
      <StaticCompanyProvider company={preview.company}>
        <StaticRealtimeProvider machines={preview.machines} records={preview.records}>
          <RenderedTemplate source={source} machineId={machineId} />
        </StaticRealtimeProvider>
      </StaticCompanyProvider>
    );
  }
  return <RenderedTemplate source={source} machineId={machineId} />;
}

function RenderedTemplate({ source, machineId }: { source: string; machineId?: string }) {
  const { company } = useCompany();
  const machines = useMachines();
  const machine = machineId ? machines.find((m) => m.id === machineId) : undefined;

  // Recomputes when the relevant machine's structural facts change (added/removed/
  // renamed) but NOT on every freshness/online tick (those come from a 1s clock in
  // useMachines() and would otherwise force a re-parse every second for no reason —
  // per-machine live values are never baked into the Liquid output anyway, see
  // buildTemplateContext's doc comment).
  const rosterKey = useMemo(
    () =>
      machineId
        ? machine
          ? `${machine.id}:${machine.name}:${machine.location}:${machine.ratedRpm}`
          : ""
        : machines.map((m) => `${m.id}:${m.name}:${m.location}:${m.ratedRpm}`).join("|"),
    [machineId, machine, machines]
  );

  const [tree, setTree] = useState<ReactNode>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (machineId && !machine) return; // machine not loaded yet — keep last render
    try {
      const engine = getLiquidEngine();
      const context =
        machineId && machine
          ? buildMachineTemplateContext({ company, machine })
          : buildTemplateContext({ company, machines });
      const html = engine.parseAndRenderSync(source, context);
      setTree(parseToReactTree(html));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to render template");
    }
    // machine(s)/company are intentionally summarized via rosterKey + the primitive
    // company fields below, not passed in whole — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, machineId, rosterKey, company.name, company.slug, company.logoUrl, company.accentColor]);

  if (error) {
    return (
      <p className="rounded-lg border border-hairline bg-surface p-4 text-sm" style={{ color: "var(--status-critical)" }}>
        Template error: {error}
      </p>
    );
  }

  return <>{tree}</>;
}
