import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export const ALLERGY_OPTIONS = [
  "Gluten-Free",
  "Nut-Free",
  "Dairy-Free",
  "Vegan",
  "Vegetarian",
  "Shellfish-Free",
  "Kosher",
  "Halal",
  "Soy-Free",
  "Egg-Free",
] as const;

export const ACCESSIBILITY_OPTIONS = [
  "Wheelchair Accessible",
  "Elevator Access",
  "Accessible Restroom",
  "Hearing Loop",
  "Large Print Menu",
  "Service Animal Friendly",
  "Step-Free Entry",
] as const;

export const RADIUS_OPTIONS = [0.5, 1, 2, 5, 10, 25] as const;

export interface UserPreferences {
  allergies: string[];
  accessibility: string[];
  radiusMiles: number;
  useLocation: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  accessibility: [],
  radiusMiles: 5,
  useLocation: true,
};

interface PreferencesContextValue {
  preferences: UserPreferences;
  setAllergies: (allergies: string[]) => void;
  toggleAllergy: (allergy: string) => void;
  toggleAccessibility: (feature: string) => void;
  setRadiusMiles: (miles: number) => void;
  setUseLocation: (val: boolean) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);
const STORAGE_KEY = "spontaneous_preferences";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
        } catch {}
      }
    });
  }, []);

  const save = useCallback((next: UserPreferences) => {
    setPreferences(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleAllergy = useCallback(
    (allergy: string) => {
      const next = preferences.allergies.includes(allergy)
        ? preferences.allergies.filter((a) => a !== allergy)
        : [...preferences.allergies, allergy];
      save({ ...preferences, allergies: next });
    },
    [preferences, save]
  );

  const toggleAccessibility = useCallback(
    (feature: string) => {
      const next = preferences.accessibility.includes(feature)
        ? preferences.accessibility.filter((a) => a !== feature)
        : [...preferences.accessibility, feature];
      save({ ...preferences, accessibility: next });
    },
    [preferences, save]
  );

  const setRadiusMiles = useCallback(
    (miles: number) => save({ ...preferences, radiusMiles: miles }),
    [preferences, save]
  );

  const setUseLocation = useCallback(
    (val: boolean) => save({ ...preferences, useLocation: val }),
    [preferences, save]
  );

  const setAllergies = useCallback(
    (allergies: string[]) => save({ ...preferences, allergies }),
    [preferences, save]
  );

  const resetPreferences = useCallback(() => {
    save(DEFAULT_PREFERENCES);
  }, [save]);

  return (
    <PreferencesContext.Provider
      value={{ preferences, setAllergies, toggleAllergy, toggleAccessibility, setRadiusMiles, setUseLocation, resetPreferences }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
