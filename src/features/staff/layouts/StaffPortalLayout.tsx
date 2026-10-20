import { Link, NavLink, Outlet } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', to: '/staff', end: true },
  { label: 'Applications', to: '/staff/applications', end: false },
  { label: 'Assigned-bus roster', to: '/staff/roster', end: false },
  { label: 'Buses', to: '/staff/buses', end: false },
]

function StaffPortalLayout() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside
          className="rounded-2xl border border-border bg-surface p-2 shadow-md sm:p-4"
          aria-label="Staff portal navigation"
        >
          <nav
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col"
            aria-label="Staff portal sections"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
          <Link
            to="/"
            className="mt-3 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Back to main site
          </Link>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      <p
        role="note"
        className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm leading-6 text-muted"
      >
        Staff portal prototype. All student and bus records are fictional examples; this is not an
        official or live institutional system.
      </p>
    </div>
  )
}

export default StaffPortalLayout
