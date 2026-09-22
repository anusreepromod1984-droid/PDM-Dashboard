import { MachineOverviewView } from "@/components/views/MachineOverviewView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function ThreeDMachineOverviewPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]">) {
  const { machineId } = await params;
  return (
    <MachineDashboardGate machineId={machineId} view="overview" fallback={<MachineOverviewView machineId={machineId} />} />
  );
}
