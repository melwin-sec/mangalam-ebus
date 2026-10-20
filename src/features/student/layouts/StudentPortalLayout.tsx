import { NavLink, Outlet } from 'react-router-dom'
import { useStudentApplications } from '../context/useStudentApplications'

const navigationItems = [
  { label: 'Dashboard', to: '/student' },
  { label: 'Digital pass', to: '/student/pass' },
  { label: 'Transport', to: '/student/transport' },
  { label: 'Application status', to: '/student/application' },
  { label: 'Profile', to: '/student/profile' },
]

function StudentPortalLayout() {
  const { persistenceMessage, persistenceStatus } = useStudentApplications()

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-surface p-2 shadow-md sm:p-4 lg:p-4" aria-label="Student portal navigation">
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col" aria-label="Student portal sections">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/student'}
              className={({ isActive }) =>
                [
                  'flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                  isActive
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted hover:bg-surface-raised hover:text-foreground',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {persistenceStatus !== 'ready' ? (
          <div role="status" className="mb-5 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
            {persistenceMessage ?? 'Browser storage is unavailable, so changes are not guaranteed to persist.'}
          </div>
        ) : null}
        <Outlet />
      </div>
    </div>
  )
}

export default StudentPortalLayout
