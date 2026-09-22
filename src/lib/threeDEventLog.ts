/**
 * Console-logs a UI interaction from the /3d flow, for Unreal Engine to pick up via
 * its Web Browser widget's CEF console-message callback. No-ops outside /3d: gated on
 * the html[data-flow="3d"] attribute app/3d/layout.tsx stamps, since some callers
 * (MachineCard, MachineViewNav) are components shared with the regular tenant flow.
 */
export function logThreeDEvent(name: string): void {
  if (document.documentElement.dataset.flow !== "3d") return;
  console.log(name);
}
