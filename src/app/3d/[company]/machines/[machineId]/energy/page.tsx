import { EnergyView } from "@/components/views/EnergyView";

export default async function ThreeDEnergyPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/energy">) {
  const { machineId } = await params;
  return <EnergyView machineId={machineId} />;
}
