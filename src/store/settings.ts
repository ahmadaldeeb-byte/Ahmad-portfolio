"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sound } from "@/lib/audio";

export interface SettingsState {
  volume: number;
  muted: boolean;
  voice: boolean;
  reducedMotion: boolean;
  numerals: "arabic" | "hindi";
  quality: "auto" | "high" | "low";
  set: (patch: Partial<Omit<SettingsState, "set">>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      volume: 0.7,
      muted: false,
      voice: false,
      reducedMotion: false,
      numerals: "arabic",
      quality: "auto",
      set: (patch) => set(patch),
    }),
    {
      name: "heroes-settings",
      onRehydrateStorage: () => (state) => {
        if (state) sound.configure({ volume: state.volume, muted: state.muted, voice: state.voice });
      },
    },
  ),
);

// Keep the sound engine in sync with the settings.
useSettings.subscribe((s) => sound.configure({ volume: s.volume, muted: s.muted, voice: s.voice }));
