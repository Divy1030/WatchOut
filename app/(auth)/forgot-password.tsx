import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import AuthLayout from '../../components/auth/AuthLayout';
import FormButton from '../../components/auth/FormButton';
import FormInput from '../../components/auth/FormInput';
import { Colors } from '../../constants/Colors';
import { useForgotPassword } from '../../src/lib/queries';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const forgotPassword = useForgotPassword();

  const validateForm = () => {
    try {
      emailSchema.parse({ email });
      setError('');
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await forgotPassword.mutateAsync(email);
      setSuccess(true);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email to receive a password reset code"
    >
      {!success ? (
        <>
          <FormInput
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <FormButton
            title="Send Reset Code"
            onPress={handleSubmit}
            isLoading={forgotPassword.isPending}
            style={styles.button}
          />
        </>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={60} color={Colors.primary} />
          </View>
          
          <Text style={styles.successTitle}>Check Your Email</Text>
          
          <Text style={styles.successText}>
            We've sent a password reset code to {email}
          </Text>
          
          <FormButton
            title="Verify Code"
            onPress={() => router.push({
              pathname: '/(auth)/reset-password' as any,
              params: { email }
            })}
            style={styles.verifyButton}
          />
          
          <Pressable style={styles.resendContainer} onPress={handleSubmit}>
            <Text style={styles.resendText}>Didn't receive an email? Resend</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.backContainer} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color={Colors.primary} />
        <Text style={styles.backText}>Back to Sign In</Text>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  verifyButton: {
    width: '100%',
  },
  resendContainer: {
    marginTop: 20,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
  },
});