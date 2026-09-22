import { useTheme } from "@/context/ThemeProvider";
import { CHART_COLORS } from "@/lib/constants";

export function useChartPalette() {
  const { theme } = useTheme();
  return CHART_COLORS[theme];
}
