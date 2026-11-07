import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { StudentStatus } from '../../student/types'
import { getPassDateStatus } from '../../student/lib/demoStorage'
import { useStudentApplications } from '../../student/context/useStudentApplications'
import { demoStaff, mockStaffBuses, mockStaffStudents } from '../data/mockStaffData'
import type { StaffStudent } from '../types'

const passStatuses = ['active', 'pending', 'review', 'not_yet_valid', 'expired', 'invalid'] as const
type PassStatusFilter = (typeof passStatuses)[number] | 'all'

function formatStatus(status: StaffStudent['passStatus']) {
  const formatted = status.replace(/_/g, ' ')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function StaffRosterPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PassStatusFilter>('all')
  const { applications, issuedPasses } = useStudentApplications()
  const requestedBusId = searchParams.get('bus')
  const selectedBusId = requestedBusId ?? demoStaff.assignedBusId
  const selectedBus = mockStaffBuses.find((bus) => bus.id === selectedBusId)

  const rosterStudents = useMemo<StaffStudent[]>(() => {
    const knownStudentIds = new Set(mockStaffStudents.map((student) => student.studentId))
    const issuedStudents: StaffStudent[] = issuedPasses
      .filter((pass) => !knownStudentIds.has(pass.studentId))
      .map((pass) => ({
        studentId: pass.studentId,
        name: pass.studentName,
        busId: pass.busId,
        passStatus: getPassDateStatus(pass),
      }))
    return [...mockStaffStudents, ...issuedStudents]
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
      .filter((student) => student.busId === selectedBusId)
  }, [applications, issuedPasses, selectedBusId])

  if (!selectedBus) {
    return (
      <section aria-labelledby="roster-error-title" className="space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Staff transport
          </p>
          <h1 id="roster-error-title" className="text-3xl font-semibold">
            Bus not found
          </h1>
          <p className="text-sm leading-6 text-muted">
            No demonstration bus matches the selected bus identifier.
          </p>
        </header>
        <Link
          to="/staff/buses"
          className="inline-flex min-h-10 items-center rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Return to buses
        </Link>
      </section>
    )
  }

  const busStudents = rosterStudents
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const visibleStudents = busStudents.filter((student) => {
    const matchesSearch =
      student.studentId.toLocaleLowerCase().includes(normalizedSearch) ||
      student.name.toLocaleLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all' || student.passStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <section aria-labelledby="staff-roster-title" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {selectedBus.id === demoStaff.assignedBusId
            ? 'Assigned-bus roster'
            : 'Coordinator-style roster demo'}
        </p>
        <h1 id="staff-roster-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Roster · {selectedBus.identifier}
        </h1>
        <p className="text-sm leading-6 text-muted">
          {selectedBus.routeName} · {selectedBus.origin} to {selectedBus.destination}. Student
          records and pass statuses are fictional examples only.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-5">
        <div>
          <label htmlFor="roster-search" className="mb-2 block text-sm font-medium text-foreground">
            Search by student name or ID
          </label>
          <input
            id="roster-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Enter a name or student ID"
          />
        </div>
        <div>
          <label htmlFor="roster-status" className="mb-2 block text-sm font-medium text-foreground">
            Filter by pass status
          </label>
          <select
            id="roster-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value as PassStatusFilter)}
          >
            <option value="all">All statuses</option>
            {passStatuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        Showing {visibleStudents.length} of {busStudents.length} students
      </p>

      {visibleStudents.length > 0 ? (
        <ul aria-label={`${selectedBus.identifier} student roster`} className="space-y-3">
          {visibleStudents.map((student) => (
            <li
              key={student.studentId}
              className="rounded-xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-semibold text-foreground">
                    {student.name}
                  </h2>
                  <p className="mt-1 break-all font-mono text-sm text-muted">
                    Student ID: {student.studentId}
                  </p>
                </div>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {formatStatus(student.passStatus)}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">Bus assignment</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {selectedBus.identifier}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Route</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {selectedBus.routeName}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-border bg-surface p-6 text-center"
        >
          <h2 className="text-lg font-semibold text-foreground">No students found</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Try another name or student ID, or change the pass-status filter.
          </p>
        </div>
      )}
    </section>
  )
}

export default StaffRosterPage
