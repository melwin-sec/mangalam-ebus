import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BusFront,
  CalendarDays,
  MapPinned,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../context/useStudentApplications'
import { mockRoute, mockStudent } from '../data/mockStudentData'
import { getPassDateStatus } from '../lib/demoStorage'
import { mockStaffBuses } from '../../staff/data/mockStaffData'

const quickLinks = [
  { icon: BadgeCheck, label: 'View digital pass', to: '/student/pass' },
  { icon: BusFront, label: 'View transport details', to: '/student/transport' },
  { icon: Activity, label: 'View application status', to: '/student/application' },
  { icon: UserRound, label: 'View student profile', to: '/student/profile' },
]

const sampleNotices = [
  {
    title: 'Route schedule sample',
    description: 'The route and times shown in this portal are illustrative and are not live service information.',
  },
  {
    title: 'Prototype reminder',
    description: 'Student, pass and application details on this dashboard are synthetic demo records.',
  },
]

function formatStatus(status: string) {
  const formatted = status.replace(/_/g, ' ')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatApplicationStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StudentDashboardPage() {
  const { studentApplication, studentPass } = useStudentApplications()
  const currentApplication = studentApplication
  const reviewStatus = currentApplication?.reviewStatus ?? 'not_started'
  const passDateStatus = getPassDateStatus(studentPass)
  const passStatus = passDateStatus
  const assignedBus = studentPass
    ? mockStaffBuses.find((bus) => bus.id === studentPass.busId)
    : undefined
  const requestedRoute = currentApplication?.routeName
    ? mockStaffBuses.find(
        (bus) => bus.routeName.toLocaleLowerCase() === currentApplication.routeName.trim().toLocaleLowerCase(),
      )
    : undefined
  const transportBus = studentPass?.busIdentifier ?? (currentApplication ? 'Not assigned yet' : mockRoute.bus)
  const transportRoute = studentPass?.routeName ?? currentApplication?.routeName ?? mockRoute.name
  const transportBoardingPoint =
    studentPass?.boardingPoint ?? currentApplication?.boardingPoint ?? mockRoute.boardingPoint
  const transportOrigin = assignedBus?.origin ?? requestedRoute?.origin ?? mockRoute.origin
  const transportDestination = assignedBus?.destination ?? requestedRoute?.destination ?? mockRoute.destination
  const passReference = studentPass?.reference ?? 'Not issued yet'
  const passValidFrom = studentPass?.validFrom ?? 'Not issued'
  const passValidTo = studentPass?.validTo ?? 'Not issued'

  return (
    <section aria-labelledby="dashboard-title" className="space-y-6">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Student portal
        </p>
        <h1 id="dashboard-title" className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
          Welcome, {mockStudent.name}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Here is a summary of your campus transport demo information.
        </p>
      </header>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success/10 text-success">
                <BadgeCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground">Digital bus pass</h2>
                <p className="mt-1 break-words text-sm text-muted">{passReference}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                passDateStatus === 'active'
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-warning/50 bg-warning/10 text-warning'
              }`}
            >
              {formatStatus(passStatus)}
            </span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted">Valid from</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{passValidFrom}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Valid to</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{passValidTo}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-lg border border-border bg-background-soft px-3 py-2 text-xs leading-5 text-muted">
            {studentPass
              ? passDateStatus === 'active'
                ? 'Prototype pass only. This is not an official or valid travel pass.'
                : `Prototype pass status: ${formatStatus(passStatus)}. This pass is not valid for travel.`
              : 'No issued pass exists yet. Approval is separate from pass issuance.'}
          </p>
          <Link
            to="/student/pass"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View pass details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <BusFront className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Assigned transport</h2>
              <p className="text-sm text-muted">{transportBus}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-3">
            <div>
              <dt className="text-xs text-muted">Route</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{transportRoute}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
                Boarding point
              </dt>
              <dd className="mt-1 break-words text-sm font-medium text-foreground">
                {transportBoardingPoint}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Route</dt>
              <dd className="mt-1 break-words text-sm text-foreground">
                {transportOrigin} to {transportDestination}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted">
            {currentApplication || studentPass
              ? 'Transport details reflect this application or issued demo pass; schedules are not live.'
              : 'Illustrative route details; schedules are not live.'}
          </p>
          <Link
            to="/student/transport"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View transport details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Pass application</h2>
              <p className="text-sm text-muted">
                {currentApplication ? currentApplication.reference : 'No application submitted yet'}
              </p>
            </div>
          </div>
          {currentApplication ? (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted">Status</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatApplicationStatus(reviewStatus)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Submitted</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {currentApplication.submittedOn}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted">
              No application has been submitted for this student yet. Complete the form to start the demo review flow.
            </p>
          )}
          <Link
            to="/student/application"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {currentApplication ? 'View application status' : 'Submit a demo application'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>

        <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Student</h2>
              <p className="text-sm text-muted">{mockStudent.studentId}</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-foreground">{mockStudent.program}</p>
          <p className="mt-1 text-sm text-muted">{mockStudent.year}</p>
          <Link
            to="/student/profile"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            View profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </article>
      </div>

      <section aria-labelledby="notices-title" className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="notices-title" className="text-xl font-semibold text-foreground">
            Notices
          </h2>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Sample prototype content · not official announcements
          </p>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {sampleNotices.map((notice) => (
            <li key={notice.title} className="rounded-xl border border-border bg-background-soft p-4">
              <h3 className="font-medium text-foreground">{notice.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{notice.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Student dashboard quick links" className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-foreground">Quick links</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {quickLinks.map(({ icon: Icon, label, to }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-background-soft px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{label}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}

export default StudentDashboardPage
