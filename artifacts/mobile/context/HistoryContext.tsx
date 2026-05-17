import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type HistoryItemType = "restaurant" | "activity";

export interface RestaurantSuggestion {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  address: string;
  neighborhood: string;
  attire: string;
  attireDescription: string;
  estimatedCostPerPerson: number;
  costRange: string;
  rating: number;
  ambiance: string;
  specialtyDish: string;
  reservationTime: string;
  waitTime: string;
}

export interface ActivityEvent {
  time: string;
  title: string;
  description: string;
  location: string;
  estimatedCost: number;
  duration: string;
  category: string;
}

export interface ActivityPlan {
  id: string;
  theme: string;
  tagline: string;
  totalEstimatedCost: number;
  events: ActivityEvent[];
}

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  data: RestaurantSuggestion | ActivityPlan;
  savedAt: string;
}

interface HistoryContextValue {
  history: HistoryItem[];
  addToHistory: (type: HistoryItemType, data: RestaurantSuggestion | ActivityPlan) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);
const STORAGE_KEY = "spontaneous_history";

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setHistory(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const addToHistory = useCallback(async (type: HistoryItemType, data: RestaurantSuggestion | ActivityPlan) => {
    const item: HistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      type,
      data,
      savedAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <HistoryContext.Provider value={{ history, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within HistoryProvider");
  return ctx;
}
