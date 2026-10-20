import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../../student/context/useStudentApplications'
import type { ApplicationReviewStatus } from '../../student/types'

const statusOptions: Array<'all' | ApplicationReviewStatus> = [
  'all',
  'submitted',
  'under_review',
  'corrections_requested',
  'approved',
]

function formatApplicationStatus(status: ApplicationReviewStatus | undefined) {
  if (!status) {
    return 'Submitted'
  }

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StaffApplicationsPage() {
  const { applications } = useStudentApplications()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationReviewStatus>('all')

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return applications.filter((application) => {
      const matchStatus =
        statusFilter === 'all' || application.reviewStatus === statusFilter
      const searchableText = [
        application.reference,
        application.studentName ?? 'Demo student',
        application.routeName ?? '',
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return matchStatus && matchesSearch
    })
  }, [applications, search, statusFilter])

  return (
    <section aria-labelledby="staff-applications-title" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Review queue
        </p>
        <h1 id="staff-applications-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Applications for review
        </h1>
        <p className="text-sm leading-6 text-muted">
          Demo-only application review queue for the fictional student transport program.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
        <div>
          <label htmlFor="application-search" className="mb-2 block text-sm font-medium text-foreground">
            Search by applicant or reference
          </label>
          <input
            id="application-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or application reference"
          />
        </div>

        <div>
          <label htmlFor="application-status" className="mb-2 block text-sm font-medium text-foreground">
            Filter by application status
          </label>
          <select
            id="application-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'all' | ApplicationReviewStatus)
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All statuses' : formatApplicationStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredApplications.length > 0 ? (
        <ul aria-label="Demo application review queue" className="space-y-3">
          {filteredApplications.map((application) => (
            <li
              key={application.reference}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {application.reference}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {application.studentName ?? 'Aarav Nair'}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {application.routeName ?? 'North Campus Loop'} ·{' '}
                    {application.boardingPoint ?? 'Gate 2, Near Main Cycle Stand'}
                  </p>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {formatApplicationStatus(application.reviewStatus)}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted">Submitted {application.submittedOn}</p>
                <Link
                  to={`/staff/applications/${encodeURIComponent(application.reference)}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  View application
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="rounded-xl border border-border bg-surface p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">No applications found</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Try another name or reference, or change the application-status filter.
          </p>
        </div>
      )}
    </section>
  )
}

export default StaffApplicationsPage
