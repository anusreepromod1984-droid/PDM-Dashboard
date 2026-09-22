import { MachineHeader } from "@/components/MachineHeader";

export default async function MachineLayout({
  children,
  params,
}: LayoutProps<"/[company]/machines/[machineId]">) {
  const { machineId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <MachineHeader machineId={machineId}>{children}</MachineHeader>
    </div>
  );
}
