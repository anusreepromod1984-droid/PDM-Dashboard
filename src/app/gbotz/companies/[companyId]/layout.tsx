import { GbotzCompanyTabs } from "@/components/gbotz/GbotzCompanyTabs";

export default async function GbotzCompanyLayout({
  children,
  params,
}: LayoutProps<"/gbotz/companies/[companyId]">) {
  const { companyId } = await params;
  return <GbotzCompanyTabs companyId={companyId}>{children}</GbotzCompanyTabs>;
}
