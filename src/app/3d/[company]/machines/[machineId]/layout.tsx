import { TimeRangeProvider } from "@/context/TimeRangeProvider";
import { MachineViewNav } from "@/components/MachineViewNav";
import { ThreeDMachineHeader } from "@/components/three-d/ThreeDMachineHeader";
import { EntranceDiv } from "@/components/EntranceDiv";

/**
 * useMachineSeries (which the view components depend on) requires a TimeRangeProvider
 * ancestor — the regular flow mounts one in MachineHeader alongside a machine name/
 * location header and Super Dashboard button; ThreeDMachineHeader below reproduces just
 * the name/location part (no Super Dashboard button — stays out of scope here). Left
 * half is left empty for the 3D team's per-machine model; the right half holds the
 * machine header + view-switcher tab strip (pinned) above a scrollable column for that
 * view's KPI/gauge/chart content.
 */
export default async function ThreeDMachineLayout({
  children,
  params,
}: LayoutProps<"/3d/[company]/machines/[machineId]">) {
  const { machineId } = await params;

  return (
    <TimeRangeProvider>
      <div className="flex h-full w-full">
        {/* Reserved for the 3D team's per-machine model — pointer-events-none
            (inherited from ThreeDShell's root, restated for clarity) so clicks/drags
            here reach the 3D world instead of stopping on this empty half. */}
        <div className="pointer-events-none h-full w-1/2" />
        {/* pointer-events-auto: opts the tab strip and view content back into being
            clickable/scrollable, since the ancestor chain up to ThreeDShell's root is
            pointer-events-none. min-w-0: flex items default to min-width:auto, which
            refuses to shrink below their content's intrinsic width — without
            overriding it, this half was growing past its actual 50% share (pushing
            into/past the reserved-for-3D left half, or off the viewport) whenever its
            content's natural width exceeded that share, which is exactly what "half
            the viewport" reliably does for content originally sized for a full-width
            page (grids, gauges, charts). This is the actual fix for that; min-w-0
            just lets the width: w-1/2 already declared take effect, with content
            wrapping/scrolling inside it instead of forcing the box wider. */}
        <div className="pointer-events-auto flex h-full w-1/2 min-w-0 flex-col">
          {/* .three-d-panel (globals.css) so the header/tab labels stay legible over
              whatever the 3D scene is rendering behind them — MachineViewNav itself has
              no background of its own, since the regular tenant flow already sits on an
              opaque page. */}
          <EntranceDiv
            staggerIndex={1}
            className="three-d-panel mx-4 mt-4 shrink-0 overflow-hidden rounded-2xl border border-hairline shadow-2xl sm:mx-6 sm:mt-6"
          >
            <ThreeDMachineHeader machineId={machineId} />
            <div className="border-t border-hairline px-2">
              <MachineViewNav machineId={machineId} />
            </div>
          </EntranceDiv>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </TimeRangeProvider>
  );
}
