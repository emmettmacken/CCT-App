import { useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export const useTabRefresh = (onRefresh: () => void) => {
  const navigation = useNavigation<BottomTabNavigationProp<any>>();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener("tabPress", (e: any) => {
        const isFocused = navigation.isFocused?.();
        if (isFocused) {
          e.preventDefault(); // Prevent default scroll-to-top
          onRefresh(); // Trigger passed refresh function
        }
      });

      return unsubscribe;
    }, [navigation, onRefresh])
  );
};
