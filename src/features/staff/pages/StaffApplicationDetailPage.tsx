import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mockStaffBuses } from '../data/mockStaffData'
import { useStudentApplications } from '../../student/context/useStudentApplications'
import type { ApplicationReviewStatus } from '../../student/types'

function formatApplicationStatus(status: ApplicationReviewStatus | undefined) {
  if (!status) {
    return 'Submitted'
  }

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function StaffApplicationDetailPage() {
  const { reference } = useParams()
  const { applications, updateApplicationStatus, issuePass, issuedPasses } = useStudentApplications()
  const application = useMemo(
    () => applications.find((item) => item.reference === decodeURIComponent(reference ?? '')),
    [applications, reference],
  )
  const [note, setNote] = useState('')
  const [decisionError, setDecisionError] = useState<string | null>(null)
  const [issueMessage, setIssueMessage] = useState<string | null>(null)
  const currentPass = issuedPasses.find(
    (pass) =>
      pass.applicationReference === application?.reference || pass.studentId === application?.studentId,
  )

  if (!application) {
    return (
      <section aria-labelledby="application-missing-title" className="space-y-4">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Review queue
          </p>
          <h1 id="application-missing-title" className="text-3xl font-semibold">
            Application not found
          </h1>
          <p className="text-sm leading-6 text-muted">
            The requested application reference is not present in the demonstration queue.
          </p>
        </header>
        <Link
          to="/staff/applications"
          className="inline-flex min-h-10 items-center rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Return to applications
        </Link>
      </section>
    )
  }

  const currentStatus = application.reviewStatus

  const handleDecision = (status: ApplicationReviewStatus) => {
    if (status === 'corrections_requested') {
      const trimmedNote = note.trim()

      if (!trimmedNote) {
        setDecisionError('Please explain what needs to be corrected before requesting changes.')
        return
      }

      setDecisionError(null)
    } else {
      setDecisionError(null)
    }

    const nextNote = note.trim() || `Updated in the demo workflow to ${formatApplicationStatus(status)}.`
    const result = updateApplicationStatus(application.reference, status, nextNote)

    if (!result.ok) {
      setDecisionError(
        result.reason === 'persistence'
          ? 'The review decision was not saved. Existing saved data was preserved; please resolve the storage warning and retry.'
          : 'This status change is not allowed for the current application state.',
      )
      return
    }

    setNote('')
  }

  const handleIssuePass = () => {
    if (!application) {
      return
    }

    const matchingBus =
      application.routeName
        ? mockStaffBuses.find(
            (bus) => bus.routeName.toLocaleLowerCase() === application.routeName!.trim().toLocaleLowerCase(),
          )
        : undefined

    const result = issuePass(application.reference, matchingBus?.id ?? '')

    if (!result.ok) {
      setIssueMessage(
        result.reason === 'persistence'
          ? 'The demo pass was not issued because it could not be saved. Existing saved data was preserved; please resolve the storage warning and retry.'
          : 'This application cannot be issued yet. It must be approved, use a supported bus, match the route, and use a valid boarding point for that route.',
      )
      return
    }

    setIssueMessage(`Demo pass ${result.value.reference} issued for ${result.value.studentName}.`)
  }

  return (
    <section aria-labelledby="staff-application-detail-title" className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Application review
        </p>
        <h1 id="staff-application-detail-title" className="text-3xl font-semibold tracking-[-0.04em]">
          {application.reference}
        </h1>
        <p className="text-sm leading-6 text-muted">
          Demo-only application workflow; no real authorization or travel permission is granted.
        </p>
      </header>

      <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Applicant
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {application.studentName ?? 'Aarav Nair'}
            </h2>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {formatApplicationStatus(currentStatus)}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Route request
            </dt>
            <dd className="mt-2 text-base font-medium text-foreground">
              {application.routeName ?? 'North Campus Loop'}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Boarding point
            </dt>
            <dd className="mt-2 text-base font-medium text-foreground">
              {application.boardingPoint ?? 'Gate 2, Near Main Cycle Stand'}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Submitted on
            </dt>
            <dd className="mt-2 text-base font-medium text-foreground">
              {application.submittedOn}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Student ID
            </dt>
            <dd className="mt-2 break-all font-mono text-base font-medium text-foreground">
              {application.studentId ?? 'STU-2041'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Current note
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{application.nextAction}</p>
        </div>
      </article>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Review decision</h2>
        <label htmlFor="decision-note" className="mt-4 mb-2 block text-sm font-medium text-foreground">
          Review note
        </label>
        <textarea
          id="decision-note"
          value={note}
          onChange={(event) => {
            setDecisionError(null)
            setNote(event.target.value)
          }}
          aria-invalid={Boolean(decisionError)}
          aria-describedby={decisionError ? 'decision-note-error' : undefined}
          placeholder="Add a demo review note for the student or staff queue."
        />
        {decisionError ? (
          <p id="decision-note-error" role="alert" className="mt-2 text-sm text-danger">
            {decisionError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleDecision('under_review')}
            disabled={currentStatus !== 'submitted'}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Start review
          </button>
          <button
            type="button"
            onClick={() => handleDecision('approved')}
            disabled={currentStatus !== 'under_review'}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Approve demo application
          </button>
          <button
            type="button"
            onClick={() => handleDecision('corrections_requested')}
            disabled={currentStatus !== 'under_review'}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:border-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
          >
            Request corrections
          </button>
        </div>
      </section>

      <section aria-labelledby="application-history-title" className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 id="application-history-title" className="text-lg font-semibold text-foreground">
          Timeline
        </h2>
        <ol className="mt-4 space-y-3">
          {application.statusHistory.map((entry, index) => (
            <li key={`${entry.label}-${entry.date}-${index}`} className="rounded-xl border border-border bg-background-soft p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium text-foreground">{entry.label}</h3>
                <time className="text-sm text-muted">{entry.date}</time>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{entry.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {currentStatus === 'approved' && !currentPass ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Issue demo pass</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Approval is separate from pass issuance. A demo pass can be created only after approval.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleIssuePass}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Issue demo pass
            </button>
          </div>
          {issueMessage ? (
            <p role="status" className="mt-3 text-sm text-muted">
              {issueMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {currentPass ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Issued pass</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {currentPass.reference} · {currentPass.busIdentifier} · {currentPass.routeName}
          </p>
        </div>
      ) : null}

      <Link
        to="/staff/applications"
        className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Back to applications
      </Link>
    </section>
  )
}

export default StaffApplicationDetailPage
