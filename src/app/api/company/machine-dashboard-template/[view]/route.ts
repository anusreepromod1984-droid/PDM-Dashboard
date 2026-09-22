import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company/machine-dashboard-template/[view]
 *
 * Returns the saved Liquid dashboard template for the given machine tab view
 * (overview, vibration, faults, energy, environment, pressure, acoustic, super).
 *
 * Returns { template: null } when no custom template has been saved for this view,
 * which causes MachineDashboardGate to fall back to the hardcoded view component.
 * This is the expected default for all views until staff explicitly saves one via
 * the Gbotz dashboard editor.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ view: string }> }
) {
  // view param is available for future DB lookup — currently all views use defaults
  await params;
  return NextResponse.json({ template: null });
}
