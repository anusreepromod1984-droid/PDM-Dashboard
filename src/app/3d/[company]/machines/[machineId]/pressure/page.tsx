import { PressureView } from "@/components/views/PressureView";

export default async function ThreeDPressurePage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/pressure">) {
  const { machineId } = await params;
  return <PressureView machineId={machineId} />;
}
