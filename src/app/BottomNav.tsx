import { Dumbbell, House, TrendingUp, User, Utensils } from 'lucide-react'
import { NavLink } from 'react-router'
import { cx } from '../ui/primitives'

const TABS = [
  { to: '/', label: 'Today', icon: House },
  { to: '/food', label: 'Food', icon: Utensils },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-[62px] max-w-[560px] items-stretch px-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-accent-strong' : 'text-faint',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={23} strokeWidth={isActive ? 2.3 : 1.9} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
