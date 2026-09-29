import { createContext, useContext, type ReactNode } from 'react'
import type { Profile } from '../domain/models'
import { useUnits } from '../hooks/data'

const ProfileCtx = createContext<Profile | null>(null)

export function ProfileProvider({ profile, children }: { profile: Profile; children: ReactNode }) {
  return <ProfileCtx.Provider value={profile}>{children}</ProfileCtx.Provider>
}

/** The signed-in (local) user's profile and unit formatters. Only used after onboarding. */
export function useApp() {
  const profile = useContext(ProfileCtx)
  if (!profile) throw new Error('useApp outside ProfileProvider')
  const units = useUnits(profile)
  return { profile, units }
}
