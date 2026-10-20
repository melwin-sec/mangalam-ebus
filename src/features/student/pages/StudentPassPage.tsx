import {
  ArrowLeft,
  BadgeCheck,
  BusFront,
  CalendarDays,
  GraduationCap,
  MapPinned,
  TicketCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../context/useStudentApplications'
import { mockStudent } from '../data/mockStudentData'

function StudentPassPage() {
  const { studentPass } = useStudentApplications()
  const statusLabel = studentPass ? 'Active' : 'Not issued'

  return (
    <section aria-labelledby="pass-title" className="mx-auto w-full max-w-3xl space-y-5">
      <Link
        to="/student"
        className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
          Student credential
        </p>
        <h1 id="pass-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Digital bus pass
        </h1>
        <p className="text-sm leading-6 text-muted">
          A read-only preview of the issued pass associated with this demo student.
        </p>
      </header>

      <article
        aria-label="Prototype digital bus pass"
        className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-4 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <BusFront className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Mangalam eBus</p>
            <p className="text-xs text-muted">Digital Bus Pass &amp; Transport</p>
          </div>
          <div
            className={`ml-auto flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              studentPass
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-warning/50 bg-warning/10 text-warning'
            }`}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            <span>{statusLabel}</span>
          </div>
        </div>

        <div className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Pass reference
              </p>
              <p className="mt-2 break-all font-mono text-xl font-semibold tracking-wide text-foreground sm:text-2xl">
                {studentPass?.reference ?? 'Not yet issued'}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <TicketCheck className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          <div
            role="note"
            aria-label="PROTOTYPE — NOT VALID FOR TRAVEL"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-danger/60 bg-danger/10 px-3 py-3 text-center text-sm font-bold tracking-[0.08em] text-danger sm:px-4 sm:text-base"
          >
            PROTOTYPE — NOT VALID FOR TRAVEL
          </div>

          {studentPass ? (
            <>
              <div className="rounded-xl border border-border bg-background-soft p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  Student details
                </div>
                <h2 className="mt-3 break-words text-2xl font-semibold text-foreground">
                  {studentPass.studentName}
                </h2>
                <p className="mt-1 break-words font-mono text-sm text-muted">
                  Student ID: {studentPass.studentId}
                </p>
                <p className="mt-3 break-words text-sm font-medium text-foreground">
                  {mockStudent.program} · {mockStudent.year}
                </p>
              </div>

              <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    Valid from
                  </dt>
                  <dd className="mt-2 text-base font-semibold text-foreground">
                    {studentPass.validFrom}
                  </dd>
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.1em] text-muted">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                    Valid to
                  </dt>
                  <dd className="mt-2 text-base font-semibold text-foreground">
                    {studentPass.validTo}
                  </dd>
                </div>
              </dl>

              <div className="rounded-xl border border-border bg-background-soft p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <BusFront className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Assigned bus
                    </p>
                    <p className="mt-1 break-words text-lg font-semibold text-foreground">
                      {studentPass.busIdentifier}
                    </p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Route
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-foreground">
                      {studentPass.routeName}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted">
                      {studentPass.boardingPoint}
                    </p>
                    <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
                      <MapPinned className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Boarding point: {studentPass.boardingPoint}
                    </p>
                  </div>
                </div>
              </div>

              <p className="rounded-lg border border-border bg-surface-raised px-4 py-3 text-sm leading-6 text-muted">
                {studentPass.note}
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-background-soft p-5 text-sm leading-6 text-muted">
              No issued pass exists yet for this student. An approved application must be issued by staff before a digital pass is created.
            </div>
          )}
        </div>
      </article>
    </section>
  )
}

export default StudentPassPage
