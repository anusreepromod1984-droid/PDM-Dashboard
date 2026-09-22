import { FaultsView } from "@/components/views/FaultsView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function FaultsPage({
  params,
}: PageProps<"/[company]/machines/[machineId]/faults">) {
  const { machineId } = await params;
  return <MachineDashboardGate machineId={machineId} view="faults" fallback={<FaultsView machineId={machineId} />} />;
}
