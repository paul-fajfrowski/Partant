import React from "react";
import { View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
export default function AppleSignInButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View
      pointerEvents={disabled ? "none" : "auto"}
      accessibilityState={{ disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={28}
        style={{ height: 56, width: "100%" }}
        onPress={onPress}
      />
    </View>
  );
}
