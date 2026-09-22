import { MachineOverviewView } from "@/components/views/MachineOverviewView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function MachineOverviewPage({
  params,
}: PageProps<"/[company]/machines/[machineId]">) {
  const { machineId } = await params;
  return (
    <MachineDashboardGate machineId={machineId} view="overview" fallback={<MachineOverviewView machineId={machineId} />} />
  );
}
