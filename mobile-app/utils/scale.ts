import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 430; // your Figma frame width

export const scaleFont = (px: number) => {
  const calpx = (px * SCREEN_WIDTH) / BASE_WIDTH;
  return calpx;
};
