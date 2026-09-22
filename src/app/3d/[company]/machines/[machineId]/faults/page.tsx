import { FaultsView } from "@/components/views/FaultsView";

export default async function ThreeDFaultsPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/faults">) {
  const { machineId } = await params;
  return <FaultsView machineId={machineId} />;
}
