import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: LayoutProps<"/[company]/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
