import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

type Props = {
  progress: number;
  visible: boolean;
  color?: string;
};

export function ProgressBar({
  progress,
  visible,
  color = "#3B82F6",
}: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress, widthAnim]);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }).start(() => widthAnim.setValue(0));
    } else {
      opacityAnim.setValue(1);
    }
  }, [visible, opacityAnim, widthAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 100,
  },
  bar: {
    height: "100%",
  },
});
