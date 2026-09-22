import { ThreeDCompanyGate } from "@/components/three-d/ThreeDCompanyGate";

export default async function ThreeDCompanyLayout({
  children,
  params,
}: LayoutProps<"/3d/[company]">) {
  const { company } = await params;

  return <ThreeDCompanyGate slug={company}>{children}</ThreeDCompanyGate>;
}
