import { VibrationView } from "@/components/views/VibrationView";

export default async function ThreeDVibrationPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/vibration">) {
  const { machineId } = await params;
  return <VibrationView machineId={machineId} />;
}
