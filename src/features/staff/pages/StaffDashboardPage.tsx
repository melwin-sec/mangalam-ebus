import { ArrowRight, BusFront, RefreshCcw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../../student/context/useStudentApplications'
import { getPassDateStatus } from '../../student/lib/demoStorage'
import type { StudentStatus } from '../../student/types'
import { demoStaff, mockStaffBuses, mockStaffStudents } from '../data/mockStaffData'

const statusLabels = {
  active: 'Active passes',
  pending: 'Pending passes',
  review: 'Under review',
  expired: 'Expired passes',
  not_yet_valid: 'Not yet valid passes',
  invalid: 'Invalid passes',
} as const

function StaffDashboardPage() {
  const { applications, issuedPasses, persistenceMessage, persistenceStatus, resetPrototypeState } =
    useStudentApplications()
  const assignedBus = mockStaffBuses.find((bus) => bus.id === demoStaff.assignedBusId)

  if (!assignedBus) {
    throw new Error(`Assigned demonstration bus "${demoStaff.assignedBusId}" is missing.`)
  }

  const knownStudentIds = new Set(mockStaffStudents.map((student) => student.studentId))
  const issuedStudents = issuedPasses
    .filter((pass) => !knownStudentIds.has(pass.studentId))
    .map((pass) => ({
      studentId: pass.studentId,
      name: pass.studentName,
      busId: pass.busId,
      passStatus: getPassDateStatus(pass),
    }))
  const assignedStudents = [...mockStaffStudents, ...issuedStudents]
    .map((student) => {
      const issuedPass = issuedPasses.find((pass) => pass.studentId === student.studentId)
      const studentApplication = applications.find((application) => application.studentId === student.studentId)

      let passStatus: StudentStatus = student.passStatus
      if (issuedPass) {
        passStatus = getPassDateStatus(issuedPass)
      } else if (studentApplication) {
        passStatus = ['submitted', 'under_review', 'corrections_requested'].includes(studentApplication.reviewStatus)
          ? 'review'
          : 'pending'
      }

      return { ...student, passStatus, busId: issuedPass?.busId ?? student.busId }
    })
    .filter((student) => student.busId === assignedBus.id)

  const statusCounts = assignedStudents.reduce(
    (counts, student) => {
      counts[student.passStatus] += 1
      return counts
    },
    { active: 0, pending: 0, review: 0, expired: 0, not_yet_valid: 0, invalid: 0 },
  )

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset the fictional prototype state back to the original demo data? This clears all saved applications and issued passes.',
    )

    if (!confirmed) {
      return
    }

    resetPrototypeState()
  }

  return (
    <section aria-labelledby="staff-dashboard-title" className="space-y-6">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Staff transport portal
        </p>
        <h1 id="staff-dashboard-title" className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Staff transport dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          An illustrative overview for {demoStaff.name.toLowerCase()}; the information below is
          fictional and not operational.
        </p>
      </header>

      {persistenceStatus !== 'ready' ? (
        <div role="status" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
          {persistenceMessage ?? 'Browser storage is unavailable, so changes are not guaranteed to persist.'}
        </div>
      ) : null}
      {persistenceStatus === 'ready' &&
      persistenceMessage === 'Prototype data was reset to the initial fictional state.' ? (
        <div role="status" className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          Prototype data was reset successfully.
        </div>
      ) : null}

      <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <BusFront className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Assigned demonstration bus
            </p>
            <h2 className="mt-1 break-words text-xl font-semibold text-foreground">
              {assignedBus.identifier} · {assignedBus.routeName}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {assignedBus.origin} to {assignedBus.destination}
            </p>
          </div>
        </div>
      </article>

      <section aria-labelledby="staff-overview-title" className="space-y-3">
        <h2 id="staff-overview-title" className="text-lg font-semibold text-foreground">
          Assigned-bus overview
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <dt className="flex items-center gap-2 text-sm text-muted">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Assigned students
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-foreground">
              {assignedStudents.length}
            </dd>
          </div>
          {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => (
            <div key={status} className="rounded-xl border border-border bg-surface p-4">
              <dt className="text-sm text-muted">{statusLabels[status]}</dt>
              <dd className="mt-2 text-2xl font-semibold text-foreground">
                {statusCounts[status]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Prototype reset
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Restore the original fictional student and staff demo data. This prototype has no real authentication or authorization boundary.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reset demo data
          </button>
        </div>
      </div>

      <nav aria-label="Staff dashboard quick links" className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/staff/roster"
          className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View assigned-bus roster
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        </Link>
        <Link
          to="/staff/buses"
          className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View coordinator bus demo
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        </Link>
      </nav>
    </section>
  )
}

export default StaffDashboardPage
