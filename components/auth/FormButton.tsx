import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    PressableProps,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface FormButtonProps extends PressableProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function FormButton({
  title,
  onPress,
  isLoading,
  variant = 'primary',
  style,
  textStyle,
  ...props
}: FormButtonProps) {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryButton;
      case 'outline':
        return styles.outlineButton;
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return styles.outlineButtonText;
      default:
        return styles.buttonText;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        pressed && styles.buttonPressed,
        isLoading && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.text} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceLight,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});