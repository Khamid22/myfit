import { useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, ScrollRestoration } from 'react-router'
import { useProfile } from '../hooks/data'
import { Onboarding } from '../features/onboarding/Onboarding'
import { TodayScreen } from '../features/today/TodayScreen'
import { FoodScreen } from '../features/food/FoodScreen'
import { WorkoutScreen } from '../features/workout/WorkoutScreen'
import { SessionScreen } from '../features/workout/SessionScreen'
import { ProgressScreen } from '../features/progress/ProgressScreen'
import { WeeklyScreen } from '../features/progress/WeeklyScreen'
import { PhotosScreen } from '../features/photos/PhotosScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { HabitsSettings } from '../features/profile/HabitsSettings'
import { TemplatesSettings } from '../features/workout/TemplatesSettings'
import { MyFoodsScreen } from '../features/food/MyFoodsScreen'
import { StrengthScreen } from '../features/progress/StrengthScreen'
import { MeasurementsScreen } from '../features/progress/MeasurementsScreen'
import { BottomNav } from './BottomNav'
import { ProfileProvider } from './context'
import { SheetsProvider } from './sheets'
import { applyTheme } from './theme'
import { requestPersistence } from '../storage/db'

function Root() {
  const profile = useProfile()

  useEffect(() => {
    if (profile) applyTheme(profile.theme)
  }, [profile?.theme]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile) void requestPersistence()
  }, [!!profile]) // eslint-disable-line react-hooks/exhaustive-deps

  if (profile === undefined) return <div className="min-h-dvh bg-bg" />
  if (profile === null) return <Onboarding />

  return (
    <ProfileProvider profile={profile}>
      <SheetsProvider>
        <Outlet />
        <BottomNav />
        <ScrollRestoration />
      </SheetsProvider>
    </ProfileProvider>
  )
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <TodayScreen /> },
      { path: '/food', element: <FoodScreen /> },
      { path: '/food/library', element: <MyFoodsScreen /> },
      { path: '/workout', element: <WorkoutScreen /> },
      { path: '/workout/session/:id', element: <SessionScreen /> },
      { path: '/workout/templates', element: <TemplatesSettings /> },
      { path: '/progress', element: <ProgressScreen /> },
      { path: '/progress/week', element: <WeeklyScreen /> },
      { path: '/progress/photos', element: <PhotosScreen /> },
      { path: '/progress/strength', element: <StrengthScreen /> },
      { path: '/progress/measurements', element: <MeasurementsScreen /> },
      { path: '/settings', element: <ProfileScreen /> },
      { path: '/settings/habits', element: <HabitsSettings /> },
      { path: '/profile', element: <Navigate to="/settings" replace /> },
      { path: '/profile/habits', element: <Navigate to="/settings/habits" replace /> },
      { path: '*', element: <TodayScreen /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
