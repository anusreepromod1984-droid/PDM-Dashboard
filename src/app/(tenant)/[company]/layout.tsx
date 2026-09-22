import { CompanyGate } from "@/components/tenant/CompanyGate";

export default async function CompanyLayout({
  children,
  params,
}: LayoutProps<"/[company]">) {
  const { company } = await params;

  return <CompanyGate slug={company}>{children}</CompanyGate>;
}
