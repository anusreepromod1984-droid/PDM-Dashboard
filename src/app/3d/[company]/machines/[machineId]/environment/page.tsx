import { EnvironmentView } from "@/components/views/EnvironmentView";

export default async function ThreeDEnvironmentPage({
  params,
}: PageProps<"/3d/[company]/machines/[machineId]/environment">) {
  const { machineId } = await params;
  return <EnvironmentView machineId={machineId} />;
}
