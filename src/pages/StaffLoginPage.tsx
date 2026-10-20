import { ArrowLeft, BriefcaseBusiness } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoginForm from '../components/LoginForm'

function StaffLoginPage() {
  return (
    <section
      aria-labelledby="page-title"
      className="mx-auto w-full max-w-md"
    >
      <Link
        to="/"
        className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to home
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
          <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
          Staff access
        </p>
        <h1 id="page-title" className="mt-2 text-3xl font-semibold">
          Staff sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use your staff identifier to access the transport tools intended for staff.
        </p>

        <div className="mt-7">
          <LoginForm audience="staff" identifierLabel="Staff identifier" />
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-muted">
        Prototype only. Authentication is not connected and no credentials are transmitted or saved.
      </p>
    </section>
  )
}

export default StaffLoginPage
