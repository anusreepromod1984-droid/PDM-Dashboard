import {
  IconActivity,
  IconAlertTriangle,
  IconAlignment,
  IconCpu,
  IconDroplet,
  IconGauge,
  IconThermometer,
  IconVolume,
  IconWrench,
  IconZap,
  type IconComponent,
} from "@/components/icons";

/** Names a template author can pass as `icon: "..."` to stat_card/fleet_stat — the
 *  small decorative icon several hardcoded StatCards carry (IconGauge/IconActivity/
 *  etc). Not every icon in the library, just the ones the 6 view components use. */
export const STAT_ICONS: Record<string, IconComponent> = {
  gauge: IconGauge,
  activity: IconActivity,
  thermometer: IconThermometer,
  zap: IconZap,
  droplet: IconDroplet,
  volume: IconVolume,
  cpu: IconCpu,
  "alert-triangle": IconAlertTriangle,
  wrench: IconWrench,
  alignment: IconAlignment,
};

export function resolveStatIcon(name: string | undefined): IconComponent | undefined {
  return name ? STAT_ICONS[name] : undefined;
}
