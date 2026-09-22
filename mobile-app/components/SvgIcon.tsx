import { ICONS } from "../assets/Icons";
import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export type SvgIconName = keyof typeof ICONS;

type IconDefinition = (typeof ICONS)[SvgIconName];

const hasPaths = (icon: IconDefinition): icon is IconDefinition & { paths: string[] } =>
  Array.isArray((icon as { paths?: unknown }).paths);

const hasPath = (icon: IconDefinition): icon is IconDefinition & { path: string } =>
  typeof (icon as { path?: unknown }).path === "string";

/**
 * Custom SVG icon component that uses the provided SVG paths for each icon.
 */
export function SvgIcon({
  name,
  size = 24,
  color,
  style,
  stroke,
}: {
  name: SvgIconName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  stroke?: string;
}) {
  const iconData = ICONS[name];

  if (!iconData) {
    return null;
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width="100%" height="100%" viewBox={iconData.viewBox} fill="none">
        {hasPaths(iconData) ? (
          iconData.paths.map((p, i) => (
            <Path
              key={i}
              d={p}
              fillRule="evenodd"
              clipRule="evenodd"
              fill={color}
              stroke={stroke ?? "none"}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        ) : hasPath(iconData) ? (
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d={iconData.path}
            fill={color}
            stroke={stroke ?? "none"}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}
