import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import AuthLayout from '../../components/auth/AuthLayout';
import FormButton from '../../components/auth/FormButton';
import FormInput from '../../components/auth/FormInput';
import SocialButton from '../../components/auth/SocialButton';
import { Colors } from '../../constants/Colors';
import { useGoogleLogin, useRegister } from '../../src/lib/queries';

WebBrowser.maybeCompleteAuthSession();

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});

  const register = useRegister();
  const googleLogin = useGoogleLogin();

  // Google Authentication
  const [_, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_CLIENT_ID_HERE',
    iosClientId: 'YOUR_IOS_CLIENT_ID_HERE',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID_HERE',
    webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const authentication = response.authentication as any;
      const id_token = authentication?.id_token;
      if (id_token) {
        handleGoogleLogin(id_token);
      }
    }
  }, [response]);

  const validateForm = () => {
    try {
      registerSchema.parse({ username, email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register.mutateAsync({ username, email, password });
      // Show OTP verification screen
      router.navigate({
        pathname: '/(auth)/verify-otp',
        params: { email },
      });
    } catch (error: any) {
      // Handle specific API errors
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('email')) {
          setErrors((prev) => ({ ...prev, email: error.response.data.message }));
        } else if (error.response.data.message.includes('username')) {
          setErrors((prev) => ({ ...prev, username: error.response.data.message }));
        } else {
          // General error
          alert(error.response.data.message);
        }
      } else {
        alert('Registration failed. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      await googleLogin.mutateAsync(idToken);
      router.replace('/');
    } catch (error: any) {
      alert('Google login failed. Please try again.');
    }
  };

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Sign up to get started"
    >
      <FormInput
        label="Username"
        placeholder="Choose a username"
        autoCapitalize="none"
        icon="person"
        value={username}
        onChangeText={setUsername}
        error={errors.username}
      />

      <FormInput
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />

      <FormInput
        label="Password"
        placeholder="Choose a password"
        isPassword
        icon="lock-closed"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <FormButton
        title="Create Account"
        onPress={handleRegister}
        isLoading={register.isPending}
        style={styles.button}
      />

      <View style={styles.terms}>
        <Text style={styles.termsText}>
          By signing up, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      <View style={styles.orContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <SocialButton
        title="Sign up with Google"
        onPress={() => promptAsync()}
        iconName="logo-google" 
        iconColor="#DB4437"
        isLoading={googleLogin.isPending}
        style={styles.socialButton}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Sign In</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
  terms: {
    marginTop: 16,
    alignItems: 'center',
  },
  termsText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surface,
  },
  orText: {
    color: Colors.textMuted,
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  loginText: {
    color: Colors.textSecondary,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});