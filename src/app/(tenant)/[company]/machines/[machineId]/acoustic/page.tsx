import { AcousticView } from "@/components/views/AcousticView";
import { MachineDashboardGate } from "@/components/dashboardTemplate/MachineDashboardGate";

export default async function AcousticPage({
  params,
}: PageProps<"/[company]/machines/[machineId]/acoustic">) {
  const { machineId } = await params;
  return (
    <MachineDashboardGate machineId={machineId} view="acoustic" fallback={<AcousticView machineId={machineId} />} />
  );
}
