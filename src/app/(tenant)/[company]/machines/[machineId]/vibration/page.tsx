import { VibrationView } from "@/components/views/VibrationView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function VibrationPage({
  params,
}: PageProps<"/[company]/machines/[machineId]/vibration">) {
  const { machineId } = await params;
  return (
    <MachineDashboardGate machineId={machineId} view="vibration" fallback={<VibrationView machineId={machineId} />} />
  );
}
