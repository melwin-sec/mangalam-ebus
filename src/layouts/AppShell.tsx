import { NavLink, Outlet } from 'react-router-dom'
import BrandWordmark from '../components/BrandWordmark'

function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            end
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <BrandWordmark />
          </NavLink>

          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-surface-raised/80 p-1"
          >
            {[
              { label: 'Home', to: '/' },
              { label: 'Student login', to: '/student/login' },
              { label: 'Staff login', to: '/staff/login' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'rounded-full px-3 py-2 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted hover:bg-surface hover:text-foreground',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
