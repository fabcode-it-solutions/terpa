import { ThemeText } from "@/components/primitives";
import { useColors } from "@/theme";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
} from "react-native";

interface TabSelectorProps {
  tabs: string[];
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ tabs, activeTab, onTabPress }) => {
  const colors = useColors();
  const screenWidth = Dimensions.get("window").width;

  const [tabsWidth, setTabsWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  const [scrollX, setScrollX] = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  const showMore = tabsWidth > containerWidth && scrollX + containerWidth < tabsWidth - 1; // small epsilon for float

  const handleTabsLayout = (event: LayoutChangeEvent) => {
    setTabsWidth(event.nativeEvent.layout.width);
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(event.nativeEvent.contentOffset.x);
  };

  return (
    <View style={styles.container} onLayout={handleContainerLayout}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row",
          borderRadius: 5,
          gap: 4,
          paddingRight: 0, // extra space for "•••"
        }}
        style={{
          borderRadius: 5,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16} // smooth scroll tracking
      >
        <View
          style={[
            styles.tabsRow,
            {
              backgroundColor: colors.gray[200],
            },
          ]}
          onLayout={handleTabsLayout}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                { backgroundColor: activeTab === tab ? colors.text.primary : "transparent" },
                activeTab === tab && {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                },
              ]}
              onPress={() => onTabPress(tab)}
            >
              <ThemeText
                variant="body2"
                fontWeight={500}
                color={activeTab === tab ? colors.background.paper : colors.text.primary}
                style={{ fontSize: 14 }}
              >
                {tab}
              </ThemeText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {showMore && (
        <View style={[styles.moreTabContainer, { backgroundColor: colors.gray[200] }]}>
          <TouchableOpacity>
            <ThemeText variant="body2" color={colors.text.primary}>
              •••
            </ThemeText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 16,
    position: "relative",
    borderRadius: 5,
    overflow: "hidden",
  },
  tabsRow: {
    flexDirection: "row",
    // background set via theme in component
    borderRadius: 5,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  moreTabContainer: {
    position: "absolute",
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
