"use client";

import { use } from "react";
import { Card } from "@/components/Card";
import { PlantMapEditor } from "@/components/gbotz/PlantMapEditor";

export default function GbotzCompanyFloorMapPage({
  params,
}: PageProps<"/gbotz/companies/[companyId]/floor-map">) {
  const { companyId } = use(params);

  return (
    <Card
      title="Floor map"
      subtitle="Drag a machine onto the floor to place it, or drag a placed machine to move it."
    >
      <PlantMapEditor companyId={companyId} />
    </Card>
  );
}
