/**
 * Purely visual grid-line spacing for FloorCanvas's floor surface (see
 * components/FloorCanvas.tsx) — decorative divider lines only, drawn both on the plain
 * grid background and as a faint overlay on top of an uploaded floor-plan photo.
 * Machine placement (mapX/mapY) is a freeform percentage independent of these — there
 * is no longer a bay/row coordinate system a machine's position is bucketed onto.
 */
export const FLOOR_BAYS = 6;
export const FLOOR_ROWS = 4;
