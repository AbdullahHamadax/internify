"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import ProfileViewModal from "./ProfileViewModal";

interface ProfileModalContextType {
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

const ProfileModalCtx = createContext<ProfileModalContextType>({
  openProfile: () => {},
  closeProfile: () => {},
});

export function useProfileModal() {
  return useContext(ProfileModalCtx);
}

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  const openProfile = useCallback((userId: string) => {
    setViewingUserId(userId);
  }, []);

  const closeProfile = useCallback(() => {
    setViewingUserId(null);
  }, []);

  return (
    <ProfileModalCtx.Provider value={{ openProfile, closeProfile }}>
      {children}
      {viewingUserId && (
        <ProfileViewModal
          userId={viewingUserId as Id<"users">}
          onClose={closeProfile}
        />
      )}
    </ProfileModalCtx.Provider>
  );
}
