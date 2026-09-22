import { redirect } from "next/navigation";
import { DOC_SECTIONS } from "@/components/gbotz/docs/docsContent";
import { GBOTZ } from "@/lib/routes";

export default function GbotzDocsPage() {
  redirect(GBOTZ.docsSection(DOC_SECTIONS[0]!.id));
}
