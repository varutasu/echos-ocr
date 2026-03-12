"use client";

import * as React from "react";
import type { AuthentikUser } from "@/app/api/auth/me/route";

export type UserProfile = {
  displayName: string;
  email: string;
  jobTitle: string;
  company: string;
  bio: string;
  avatarUrl: string;
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  email: "",
  jobTitle: "",
  company: "",
  bio: "",
  avatarUrl: "",
};

const STORAGE_KEY = "echo-ocr-user-profile";

type UserProfileContextValue = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  initials: string;
  authentikUser: AuthentikUser | null;
  isAuthenticated: boolean;
  loading: boolean;
};

const UserProfileContext = React.createContext<UserProfileContextValue | null>(null);

function getInitials(name: string): string {
  if (!name.trim()) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function loadLocalProfile(): Partial<UserProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocalProfile(profile: Partial<UserProfile>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [authentikUser, setAuthentikUser] = React.useState<AuthentikUser | null>(null);
  const [localOverrides, setLocalOverrides] = React.useState<Partial<UserProfile>>({});
  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setLocalOverrides(loadLocalProfile());

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setAuthentikUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const profile = React.useMemo<UserProfile>(() => {
    const base: UserProfile = { ...DEFAULT_PROFILE };

    if (authentikUser) {
      base.displayName = authentikUser.name || authentikUser.username || "";
      base.email = authentikUser.email || "";
      base.avatarUrl = authentikUser.avatar || "";
    }

    return {
      ...base,
      ...localOverrides,
      // Authentik-sourced fields take priority for name/email/avatar when present
      ...(authentikUser?.name ? { displayName: authentikUser.name } : {}),
      ...(authentikUser?.email ? { email: authentikUser.email } : {}),
      ...(authentikUser?.avatar ? { avatarUrl: authentikUser.avatar } : {}),
    };
  }, [authentikUser, localOverrides]);

  const updateProfile = React.useCallback((updates: Partial<UserProfile>) => {
    setLocalOverrides((prev) => {
      const next = { ...prev, ...updates };
      saveLocalProfile(next);
      return next;
    });
  }, []);

  const initials = React.useMemo(() => getInitials(profile.displayName), [profile.displayName]);

  const isAuthenticated = !!authentikUser;

  const value = React.useMemo(
    () => ({ profile, updateProfile, initials, authentikUser, isAuthenticated, loading }),
    [profile, updateProfile, initials, authentikUser, isAuthenticated, loading]
  );

  if (!mounted) return <>{children}</>;

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = React.useContext(UserProfileContext);
  if (!ctx) {
    return {
      profile: DEFAULT_PROFILE,
      updateProfile: () => {},
      initials: "",
      authentikUser: null,
      isAuthenticated: false,
      loading: false,
    };
  }
  return ctx;
}
