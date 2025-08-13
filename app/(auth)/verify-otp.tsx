import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AuthLayout from '../../components/auth/AuthLayout';
import FormButton from '../../components/auth/FormButton';
import { Colors } from '../../constants/Colors';
import { useVerifyRegisterOtp } from '../../src/lib/queries';

export default function VerifyOtp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const verifyOtp = useVerifyRegisterOtp();

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    try {
      await verifyOtp.mutateAsync({
        email: email || '',
        otp: otpString,
      });

      // Show success message first
      alert('Email verified successfully! Please login with your credentials.');
      
      // Then navigate to login - add a slight delay to ensure the alert is seen
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Invalid or expired verification code');
      }
    }
  };

  const handleResendOtp = () => {
    // Here you would call the resend OTP API
    // For now we'll just reset the timer
    setTimer(60);
    setError('');
    // You'd call the API endpoint to resend the OTP here
  };

  return (
    <AuthLayout title="Verify Email" subtitle={`Enter the 6-digit code sent to ${email || 'your email'}`}>
      <View style={styles.otpContainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.otpInput, otp[index] && styles.otpInputFilled]}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[index]}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FormButton
        title="Verify"
        onPress={handleVerify}
        isLoading={verifyOtp.isPending}
        style={styles.button}
      />

      <View style={styles.resendContainer}>
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend code in {timer}s</Text>
        ) : (
          <Pressable onPress={handleResendOtp} disabled={timer > 0}>
            <Text style={styles.resendText}>Resend Code</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.backContainer} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color={Colors.primary} />
        <Text style={styles.backText}>Go Back</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    marginLeft: 8,
    fontSize: 14,
  },
  button: {
    marginTop: 16,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  timerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  backText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});