import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { RestaurantSuggestion, ActivityPlan } from "./HistoryContext";

export type FavoriteType = "restaurant" | "activity";

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  data: RestaurantSuggestion | ActivityPlan;
  savedAt: string;
}

interface FavoritesContextValue {
  favorites: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (type: FavoriteType, data: RestaurantSuggestion | ActivityPlan) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);
const STORAGE_KEY = "spontaneous_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setFavorites(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const persist = (next: FavoriteItem[]) => {
    setFavorites(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => (f.data as RestaurantSuggestion).id === id || (f.data as ActivityPlan).id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (type: FavoriteType, data: RestaurantSuggestion | ActivityPlan) => {
      const dataId = (data as RestaurantSuggestion).id ?? (data as ActivityPlan).id;
      const exists = favorites.some(
        (f) => (f.data as RestaurantSuggestion).id === dataId || (f.data as ActivityPlan).id === dataId
      );
      if (exists) {
        persist(favorites.filter(
          (f) => (f.data as RestaurantSuggestion).id !== dataId && (f.data as ActivityPlan).id !== dataId
        ));
      } else {
        persist([
          { id: Date.now().toString(), type, data, savedAt: new Date().toISOString() },
          ...favorites,
        ]);
      }
    },
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
