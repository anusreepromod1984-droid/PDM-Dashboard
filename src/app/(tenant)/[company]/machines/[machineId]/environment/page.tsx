import { EnvironmentView } from "@/components/views/EnvironmentView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function EnvironmentPage({
  params,
}: PageProps<"/[company]/machines/[machineId]/environment">) {
  const { machineId } = await params;
  return (
    <MachineDashboardGate machineId={machineId} view="environment" fallback={<EnvironmentView machineId={machineId} />} />
  );
}
