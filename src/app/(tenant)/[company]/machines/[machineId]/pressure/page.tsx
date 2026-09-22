import { PressureView } from "@/components/views/PressureView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function PressurePage({
  params,
}: PageProps<"/[company]/machines/[machineId]/pressure">) {
  const { machineId } = await params;
  return <MachineDashboardGate machineId={machineId} view="pressure" fallback={<PressureView machineId={machineId} />} />;
}
