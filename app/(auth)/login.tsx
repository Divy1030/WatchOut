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
import { useGoogleLogin, useLogin } from '../../src/lib/queries';

WebBrowser.maybeCompleteAuthSession();

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const login = useLogin();
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
      const idToken = response.authentication?.idToken;
      if (idToken) {
        handleGoogleLogin(idToken);
      }
    }
  }, [response]);

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
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

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login.mutateAsync({ email, password });
      console.log('Login successful');
      
      // The AuthGuard in _layout.tsx will handle the navigation
      // This explicit navigation is a fallback
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 100);
    } catch (error: any) {
      // Handle specific API errors
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('email')) {
          setErrors((prev) => ({ ...prev, email: error.response.data.message }));
        } else if (error.response.data.message.includes('password')) {
          setErrors((prev) => ({ ...prev, password: error.response.data.message }));
        } else {
          // General error
          alert(error.response.data.message);
        }
      } else {
        alert('Login failed. Please try again.');
        console.error('Login error:', error);
      }
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      await googleLogin.mutateAsync({ idToken });
      router.replace('/');
    } catch (error: any) {
      alert('Google login failed. Please try again.');
    }
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your account to continue"
    >
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
        placeholder="Enter your password"
        isPassword
        icon="lock-closed"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </Pressable>

      <FormButton
        title="Sign In"
        onPress={handleLogin}
        isLoading={login.isPending}
        style={styles.button}
      />

      <View style={styles.orContainer}>
        <View style={styles.divider} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.divider} />
      </View>

      <SocialButton
        title="Continue with Google"
        onPress={() => promptAsync()}
        iconName="logo-google"
        iconColor="#DB4437" // Google red color
        isLoading={googleLogin.isPending}
        style={styles.socialButton}
      />

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  signupText: {
    color: Colors.textSecondary,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});