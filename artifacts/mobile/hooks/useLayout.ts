import { useWindowDimensions } from "react-native";

const TABLET_BP = 600;
const MAX_CONTENT = 700;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BP;
  const isLandscape = width > height;
  const isWide = width >= 720;

  const hPad = isTablet ? Math.max(32, (width - MAX_CONTENT) / 2) : 24;

  const contentStyle = isTablet
    ? ({ maxWidth: MAX_CONTENT, alignSelf: "center" as const, width: "100%" as const })
    : {};

  const scale = (() => {
    if (width < 360) return Math.max(0.82, width / 390);
    if (width >= TABLET_BP) return Math.min(1.15, 1 + (width - TABLET_BP) / 2500);
    return 1;
  })();

  const fs = (base: number) => Math.round(base * scale);

  return { width, height, isTablet, isLandscape, isWide, hPad, contentStyle, fs };
}
