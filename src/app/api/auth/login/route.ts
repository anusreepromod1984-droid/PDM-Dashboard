import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    user: {
      id: "usr_apms_engineer",
      email: "engineer@gbotz.ai",
      name: "Plant Reliability Engineer",
      role: "admin",
      mustChangePassword: false,
      canEditDashboard: true,
      hasSeenTour: true,
      company: {
        id: "cmp_line_1",
        slug: "factory-floor-1",
        name: "GBotz Industrial APMS (Line 1)",
        branding: null,
        dashboardViews: null,
      },
    },
  });
}
