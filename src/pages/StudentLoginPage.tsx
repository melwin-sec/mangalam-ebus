import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoginForm from '../components/LoginForm'

function StudentLoginPage() {
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
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Student access
        </p>
        <h1 id="page-title" className="mt-2 text-3xl font-semibold">
          Student sign in
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Use your student identifier to access the transport services intended for students.
        </p>

        <div className="mt-6">
          <Link
            to="/student"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Open student portal demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-background-soft px-3 py-2 text-xs leading-5 text-muted">
          Prototype demo only. This does not authenticate a user or connect to any live student system.
        </div>

        <div className="mt-7">
          <LoginForm audience="student" identifierLabel="Student identifier" />
        </div>
      </div>

      <p className="mt-5 text-center text-xs leading-5 text-muted">
        Prototype only. Authentication is not connected and no credentials are transmitted or saved.
      </p>
    </section>
  )
}

export default StudentLoginPage
