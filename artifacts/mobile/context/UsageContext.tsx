import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/expo";

const USAGE_KEY = "spontaneous_usage_count";
const FREE_LIMIT = 3;

interface UsageContextValue {
  requestsUsed: number;
  isSubscribed: boolean;
  subscriptionStatus: string | null;
  subscriptionInterval: "month" | "year" | null;
  canMakeRequest: boolean;
  incrementUsage: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const UsageContext = createContext<UsageContextValue | null>(null);

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [requestsUsed, setRequestsUsed] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionInterval, setSubscriptionInterval] = useState<"month" | "year" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(USAGE_KEY).then((val) => {
      if (val) setRequestsUsed(parseInt(val, 10) || 0);
    });
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!isSignedIn) {
      setIsSubscribed(false);
      setSubscriptionStatus(null);
      setSubscriptionInterval(null);
      return;
    }
    try {
      const token = await getToken();
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const res = await fetch(`${baseUrl}/api/stripe/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsSubscribed(data.subscribed ?? false);
      setSubscriptionStatus(data.status ?? null);
      const iv = data.interval;
      setSubscriptionInterval(iv === "month" || iv === "year" ? iv : null);
    } catch {
      setIsSubscribed(false);
      setSubscriptionInterval(null);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  const incrementUsage = useCallback(async () => {
    const next = requestsUsed + 1;
    setRequestsUsed(next);
    await AsyncStorage.setItem(USAGE_KEY, String(next));
  }, [requestsUsed]);

  const canMakeRequest = isSubscribed || requestsUsed < FREE_LIMIT;

  return (
    <UsageContext.Provider value={{ requestsUsed, isSubscribed, subscriptionStatus, subscriptionInterval, canMakeRequest, incrementUsage, refreshSubscription }}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error("useUsage must be used within UsageProvider");
  return ctx;
}

export { FREE_LIMIT };
