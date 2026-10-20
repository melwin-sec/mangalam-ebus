import { BusFront, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../../student/context/useStudentApplications'
import { mockStaffBuses, mockStaffStudents } from '../data/mockStaffData'

function StaffBusesPage() {
  const { applications, issuedPasses } = useStudentApplications()

  return (
    <section aria-labelledby="staff-buses-title" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Coordinator-style demonstration
        </p>
        <h1 id="staff-buses-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Buses and route summaries
        </h1>
        <p className="text-sm leading-6 text-muted">
          Explore fictional buses and open each example roster. This screen does not represent
          real coordinator permissions or access restrictions.
        </p>
      </header>

      <ul aria-label="Demonstration buses" className="space-y-4">
        {mockStaffBuses.map((bus) => {
          const busStudents = mockStaffStudents
            .filter((student) => student.busId === bus.id)
            .map((student) => {
              const issuedPass = issuedPasses.find((pass) => pass.studentId === student.studentId)
              const studentApplication = applications.find(
                (application) => application.studentId === student.studentId,
              )

              let passStatus: 'pending' | 'active' | 'review' = 'pending'
              if (issuedPass) {
                passStatus = 'active'
              } else if (
                studentApplication &&
                ['submitted', 'under_review', 'corrections_requested'].includes(studentApplication.reviewStatus)
              ) {
                passStatus = 'review'
              }

              return { ...student, passStatus }
            })

          const statusCounts = busStudents.reduce(
            (counts, student) => {
              counts[student.passStatus] += 1
              return counts
            },
            { active: 0, pending: 0, review: 0 },
          )

          return (
            <li
              key={bus.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                    <BusFront className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="break-words text-xl font-semibold text-foreground">
                      {bus.identifier}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">{bus.routeName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {bus.origin} to {bus.destination}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/staff/roster?bus=${encodeURIComponent(bus.id)}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  View {bus.identifier} roster
                </Link>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <dt className="flex items-center gap-2 text-xs text-muted">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    Assigned students
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">
                    {busStudents.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Active passes</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">
                    {statusCounts.active}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Pending passes</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">
                    {statusCounts.pending}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Under review</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">
                    {statusCounts.review}
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default StaffBusesPage
