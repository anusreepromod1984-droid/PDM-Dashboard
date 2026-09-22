export type TourId = "dashboard" | "machine";
export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  id: string;
  /** Matches a `data-tour="<target>"` attribute in the DOM. */
  target: string;
  title: string;
  body: string;
  placement: TourPlacement;
}

/** Auto-starts on first login while on the Plant Overview page. */
export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: "sidebar-toggle",
    target: "topbar-sidebar-toggle",
    title: "Show or hide the menu",
    body: "This button opens and closes the sidebar, where every machine on your floor is listed.",
    placement: "bottom",
  },
  {
    id: "sidebar-nav",
    target: "sidebar-overview",
    title: "Overview & machines",
    body: '"Overview" brings you back to this plant-wide view. Below it, every machine you have access to is listed — click one to jump straight to its dashboard.',
    placement: "right",
  },
  {
    id: "topbar-assistant",
    target: "topbar-ai-assistant",
    title: "AI fault assistant",
    body: "Opens an AI assistant that can help explain what a machine's current readings mean. A pulsing red dot appears here whenever a machine has an active alert.",
    placement: "bottom",
  },
  {
    id: "plant-map",
    target: "plant-map",
    title: "The plant floor map",
    body: "This map shows every machine placed on your floor plan. Drag to pan, scroll or pinch to zoom, and use the +/− buttons to zoom precisely.",
    placement: "top",
  },
  {
    id: "plant-map-legend",
    target: "plant-map-legend",
    title: "Reading the map's signals",
    body: "Each machine's status dot is green (good), yellow (warning), or red (critical) with a pulsing glow when live. A gray, dimmed dot means the machine is offline or its data is stale.",
    placement: "bottom",
  },
  {
    id: "plant-map-machine",
    target: "plant-map-machine",
    title: "Open a machine",
    body: "Click any machine on the map — or its card below — to open its live dashboard.",
    placement: "top",
  },
  {
    id: "profile-settings",
    target: "topbar-profile",
    title: "Your profile & settings",
    body: "Manage your password and preferences here. That wraps the dashboard tour.",
    placement: "bottom",
  },
];

/** Auto-starts the first time the user opens any machine detail page. */
export const MACHINE_TOUR: TourStep[] = [
  {
    id: "machine-header",
    target: "machine-header",
    title: "Machine overview",
    body: "This is a single machine's dashboard. The dot next to its name is live-online status, same green/gray convention as the floor map.",
    placement: "bottom",
  },
  {
    id: "machine-view-nav",
    target: "machine-view-nav",
    title: "Switch between views",
    body: "Vibration, Motor Faults, Energy, Environment, Pressure, and Acoustic each have their own tab here — only the views your company has enabled are shown.",
    placement: "bottom",
  },
  {
    id: "machine-super-dashboard",
    target: "machine-super-dashboard",
    title: "Super Dashboard",
    body: "Opens a fullscreen view of this machine's live data — handy for a wall-mounted display or a closer look.",
    placement: "left",
  },
];

export function tourSteps(tour: TourId): TourStep[] {
  return tour === "dashboard" ? DASHBOARD_TOUR : MACHINE_TOUR;
}
