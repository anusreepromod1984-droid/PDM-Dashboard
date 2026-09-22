/**
 * Pure path builders, no hooks. Tenant routes take `slug` explicitly here; components
 * don't call these directly — they use `useCompany().routes`, which pre-binds every
 * one of these to the session's own slug (see context/CompanyProvider.tsx). Keeping
 * the slug an explicit parameter here (rather than reading it from somewhere global)
 * is what makes that binding trivial and keeps this module framework-free.
 */

export const routes = {
  login: () => "/login",
  company: (slug: string) => `/${slug}`,
  companySettings: (slug: string) => `/${slug}/settings`,
  companyProfile: (slug: string) => `/${slug}/profile`,
  companyMachine: (slug: string, machineId: string) => `/${slug}/machines/${machineId}`,
  companyMachineView: (slug: string, machineId: string, viewSlug: string) =>
    viewSlug ? `/${slug}/machines/${machineId}/${viewSlug}` : `/${slug}/machines/${machineId}`,
  companyAdmin: (slug: string, section?: string) => (section ? `/${slug}/admin/${section}` : `/${slug}/admin`),
  companyCrm: (slug: string) => `/${slug}/crm`,
  companyCalendar: (slug: string) => `/${slug}/calendar`,
  /** Deliberately NOT under /<slug>/admin/ — these two are full-screen tools (see
   *  CompanyGate's isFullScreenPath), and staying out of that layout's subtree is what
   *  lets a dashboard-edit-granted non-admin employee reach them without also gaining
   *  access to Users/Branding/Views, which stay admin-only. Mirrors GBOTZ's identical
   *  routes below. */
  companyDashboardEditor: (slug: string) => `/${slug}/dashboard-editor`,
  companyDashboardPreview: (slug: string) => `/${slug}/dashboard-preview`,
};

/**
 * Every one of these would collide with a real frontend route if a company were
 * created with it as a slug. Mirrors backend/src/domain/slug.ts's RESERVED_SLUGS
 * exactly — this copy is UX-only (instant feedback in the Gbotz create-company form);
 * the backend is the enforced copy.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "gbotz",
  "3d",
  "api",
  "login",
  "logout",
  "admin",
  "static",
  "public",
  "assets",
  "_next",
  "favicon.ico",
  "robots.txt",
  "health",
  "profile",
  "settings",
  "crm",
  "calendar",
  "machines",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug);
}

/** Swaps URL segment 0 for a different slug, keeping the rest of the path intact. */
export function remapSlug(pathname: string, newSlug: string): string {
  const segments = pathname.split("/").filter(Boolean);
  segments[0] = newSlug;
  return `/${segments.join("/")}`;
}

/**
 * usePathname() reflects however the URL was actually requested, trailing slash and
 * all — but every route builder here (and every exact-string comparison against their
 * output, e.g. ThreeDGate's PUBLIC_PATHS check) assumes the no-trailing-slash form.
 * Normally Next.js's own trailing-slash redirect would paper over this before the app
 * ever sees a mismatched URL, but next.config.ts sets skipTrailingSlashRedirect (needed
 * for the Socket.IO proxy), which turns it off app-wide — so a URL requested with a
 * trailing slash (e.g. the /3d flow's embedding widget was configured with one) now
 * reaches this code exactly as typed. Strip it before comparing.
 */
export function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * The /3d immersive flow — a completely separate route tree (own login, own gate, no
 * sidebar/topbar; see components/three-d/) built for the Unreal Engine 3D team to layer
 * their environment on top of ("frame 1" is this site, "frame 2" is their overlay). It
 * reuses the same backend session cookie as the regular tenant flow, just with every
 * link bound to a /3d/<slug>/... path instead of /<slug>/... — see
 * context/Company3DProvider.tsx, which feeds the same CompanyContext everything else
 * already reads `routes` from, just pointed at these builders instead.
 */
export const ROUTES_3D = {
  login: () => "/3d/login",
  company: (slug: string) => `/3d/${slug}`,
  companyMachine: (slug: string, machineId: string) => `/3d/${slug}/machines/${machineId}`,
  companyMachineView: (slug: string, machineId: string, viewSlug: string) =>
    viewSlug ? `/3d/${slug}/machines/${machineId}/${viewSlug}` : `/3d/${slug}/machines/${machineId}`,
};

/** Same idea as remapSlug, but segment 0 is the fixed "3d" prefix — the slug is segment 1. */
export function remap3dSlug(pathname: string, newSlug: string): string {
  const segments = pathname.split("/").filter(Boolean);
  segments[1] = newSlug;
  return `/${segments.join("/")}`;
}

export const GBOTZ = {
  login: () => "/gbotz/login",
  home: () => "/gbotz",
  profile: () => "/gbotz/profile",
  companies: () => "/gbotz/companies",
  companyNew: () => "/gbotz/companies/new",
  company: (companyId: string) => `/gbotz/companies/${companyId}`,
  companyUsers: (companyId: string) => `/gbotz/companies/${companyId}/users`,
  companyMachines: (companyId: string) => `/gbotz/companies/${companyId}/machines`,
  companyFloorMap: (companyId: string) => `/gbotz/companies/${companyId}/floor-map`,
  machines: () => "/gbotz/machines",
  machine: (machineId: string) => `/gbotz/machines/${machineId}`,
  docs: () => "/gbotz/docs",
  docsSection: (id: string) => `/gbotz/docs/${id}`,
  /** Deliberately NOT under /gbotz/companies/[companyId]/ — these two are full-screen
   *  tools (see GbotzGate's isFullScreenPath), and staying out of that layout's
   *  subtree is what lets them skip GbotzCompanyTabs' tab bar entirely, not just
   *  GbotzShell's sidebar/topbar. */
  companyDashboardEditor: (companyId: string) => `/gbotz/dashboard-editor/${companyId}`,
  companyDashboardPreview: (companyId: string) => `/gbotz/dashboard-preview/${companyId}`,
};
