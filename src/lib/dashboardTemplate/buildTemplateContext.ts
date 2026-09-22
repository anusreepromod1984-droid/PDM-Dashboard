import type { CompanySummary, Freshness } from "@/lib/types";

export interface TemplateMachine {
  id: string;
  name: string;
  location: string;
  ratedRpm: number;
  online: boolean;
  freshness: Freshness;
}

interface TemplateCompany {
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string | null;
}

export interface TemplateContext {
  company: TemplateCompany;
  machines: TemplateMachine[];
  [key: string]: unknown;
}

export interface MachineTemplateContext {
  company: TemplateCompany;
  machine: TemplateMachine;
  [key: string]: unknown;
}

/**
 * Builds the Liquid render context — called identically by the tenant renderer and
 * the Gbotz preview pane so behavior can't drift between what staff previewed and
 * what the client sees.
 *
 * Deliberately excludes live Telemetry values: Liquid only governs structure (which
 * elements, which machine, which field name) and is re-parsed only when template
 * source changes, never on a telemetry tick. Baking a live number in here would go
 * stale the instant it was rendered. Live values are resolved by the mounted React
 * element itself (see components/dashboardTemplate/elements) via useMachineTelemetry.
 */
export function buildTemplateContext(input: {
  company: Pick<CompanySummary, "name" | "slug" | "logoUrl" | "accentColor">;
  machines: TemplateMachine[];
}): TemplateContext {
  return {
    company: {
      name: input.company.name,
      slug: input.company.slug,
      logoUrl: input.company.logoUrl,
      accentColor: input.company.accentColor,
    },
    machines: input.machines.map((m) => ({
      id: m.id,
      name: m.name,
      location: m.location,
      ratedRpm: m.ratedRpm,
      online: m.online,
      freshness: m.freshness,
    })),
  };
}

/**
 * Same idea as buildTemplateContext, singular scope — for the 6 per-machine view
 * templates, where the page already knows which one machine it's about. `machine`
 * resolves the same way whether it's this top-level variable or a fleet-page loop
 * variable, so `{% stat_card machine: machine, ... %}` means the same thing in both.
 */
export function buildMachineTemplateContext(input: {
  company: Pick<CompanySummary, "name" | "slug" | "logoUrl" | "accentColor">;
  machine: TemplateMachine;
}): MachineTemplateContext {
  return {
    company: {
      name: input.company.name,
      slug: input.company.slug,
      logoUrl: input.company.logoUrl,
      accentColor: input.company.accentColor,
    },
    machine: {
      id: input.machine.id,
      name: input.machine.name,
      location: input.machine.location,
      ratedRpm: input.machine.ratedRpm,
      online: input.machine.online,
      freshness: input.machine.freshness,
    },
  };
}
