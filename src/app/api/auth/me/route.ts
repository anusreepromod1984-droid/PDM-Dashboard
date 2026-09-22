import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    user: {
      id: "usr_apms_engineer",
      email: "engineer@gbotz.ai",
      name: "Plant Reliability Engineer",
      role: "COMPANY_ADMIN",
      mustChangePassword: false,
      canEditDashboard: true,
      hasSeenTour: true,
      company: {
        id: "cmp_line_1",
        slug: "factory-floor-1",
        name: "GBotz Industrial APMS (Line 1)",
        active: true,
        logoUrl: null,
        accentColor: "#38bdf8",
        floorPlanImageUrl: null,
        updatedAt: new Date().toISOString(),
        enabledViews: ["overview", "vibration", "faults", "energy", "environment", "pressure", "acoustic"],
      },
    },
  });
}

