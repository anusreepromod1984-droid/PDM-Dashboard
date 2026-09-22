import { AcousticView } from "@/components/views/AcousticView";

export default async function ThreeDAcousticPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/acoustic">) {
  const { machineId } = await params;
  return <AcousticView machineId={machineId} />;
}
