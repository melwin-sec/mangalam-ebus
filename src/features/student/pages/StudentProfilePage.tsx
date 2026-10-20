import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import StudentProfileDetails from '../components/StudentProfileDetails'
import { mockRoute, mockStudent } from '../data/mockStudentData'

function StudentProfilePage() {
  return (
    <section aria-labelledby="profile-title" className="space-y-6">
      <Link
        to="/student"
        className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Student profile
        </p>
        <h1 id="profile-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Profile details
        </h1>
        <p className="text-sm leading-6 text-muted">
          Read-only profile information for this fictional student portal demonstration.
        </p>
      </header>

      <StudentProfileDetails student={mockStudent} route={mockRoute} />

      <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
        Demonstration data only. This profile does not connect to institutional records and cannot
        be edited or saved.
      </p>
    </section>
  )
}

export default StudentProfilePage
