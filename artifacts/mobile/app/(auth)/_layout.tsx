import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import type { Href } from "expo-router";

export default function AuthLayout() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <Redirect href={"/(tabs)" as Href} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
