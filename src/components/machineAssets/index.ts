import type { SVGProps } from "react";
import { CompressorAsset } from "@/components/machineAssets/CompressorAsset";

export type MachineAssetComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

/**
 * One illustrated asset per physical machine type (compressor, pump, motor, ...),
 * replacing the old generic chassis-tile icon so the floor map reads as real
 * equipment rather than an abstract diagram. There is no `Machine.type` column yet, so
 * this only has one entry — every machine renders it for now. Once a real `type` field
 * exists, add its asset here and look it up by `MACHINE_ASSETS[m.type] ?? MACHINE_ASSETS[DEFAULT_MACHINE_ASSET_KEY]`
 * instead of always reading the default key. A plain object lookup (not a function
 * call) is required here — React's rules-of-hooks lint flags a function that *returns*
 * a component reference as "creating a component during render", since it can't prove
 * the same reference comes back every time; indexing a stable module-level object does
 * not have that problem.
 */
export const DEFAULT_MACHINE_ASSET_KEY = "compressor";

export const MACHINE_ASSETS: Record<string, MachineAssetComponent> = {
  [DEFAULT_MACHINE_ASSET_KEY]: CompressorAsset,
};

export { CompressorAsset };
