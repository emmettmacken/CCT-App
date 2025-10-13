// src/hooks/useTabRefresh.ts
import { useCallback } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export const useTabRefresh = (onRefresh: () => void) => {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener("tabPress", (e) => {
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
