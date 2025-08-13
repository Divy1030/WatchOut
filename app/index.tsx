import { Redirect } from "expo-router";
import "expo-router/entry";
import React from "react";
import LoadingScreen from "../components/LoadingScreen";
import { useAuth } from "../src/providers/AuthProvider";

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    // User is authenticated, redirect to main app
    return <Redirect href="/(tabs)/home" />;
  }

  // User is not authenticated, redirect to login
  return <Redirect href="/(auth)/login" />;
}
