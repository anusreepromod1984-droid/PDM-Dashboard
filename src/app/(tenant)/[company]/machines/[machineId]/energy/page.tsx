import { EnergyView } from "@/components/views/EnergyView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function EnergyPage({
  params,
}: PageProps<"/[company]/machines/[machineId]/energy">) {
  const { machineId } = await params;
  return <MachineDashboardGate machineId={machineId} view="energy" fallback={<EnergyView machineId={machineId} />} />;
}
