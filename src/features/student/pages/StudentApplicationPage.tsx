import { ArrowLeft, CalendarClock, ClipboardList, FileText, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudentApplications } from '../context/useStudentApplications'

const emptyDraft = {
  routeName: '',
  boardingPoint: '',
  notes: '',
}

function StudentApplicationPage() {
  const { createApplication, resubmitApplication, studentApplication } = useStudentApplications()
  const [draftOverride, setDraftOverride] = useState<typeof emptyDraft | null>(null)
  const [errors, setErrors] = useState<Partial<Record<'routeName' | 'boardingPoint', string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const isCorrectionsEdit = studentApplication?.reviewStatus === 'corrections_requested'
  const shouldShowForm = showForm || studentApplication === null
  const draft = draftOverride ?? {
    routeName: studentApplication?.routeName ?? '',
    boardingPoint: studentApplication?.boardingPoint ?? '',
    notes: studentApplication?.notes ?? '',
  }

  const handleChange = (
    field: 'routeName' | 'boardingPoint' | 'notes',
    value: string,
  ) => {
    setDraftOverride((current) => ({ ...(current ?? draft), [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedDraft = {
      routeName: draft.routeName.trim(),
      boardingPoint: draft.boardingPoint.trim(),
      notes: draft.notes.trim(),
    }
    const nextErrors: Partial<Record<'routeName' | 'boardingPoint', string>> = {}

    if (!normalizedDraft.routeName) {
      nextErrors.routeName = 'Please enter the route you want to request.'
    }

    if (!normalizedDraft.boardingPoint) {
      nextErrors.boardingPoint = 'Please enter your boarding point.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (studentApplication && studentApplication.reviewStatus === 'corrections_requested') {
      const result = resubmitApplication(studentApplication.reference, normalizedDraft)
      if (!result.ok) {
        setFormError(
          result.reason === 'persistence'
            ? 'The application was not resubmitted because it could not be saved. Your existing saved data was preserved; please resolve the storage warning and retry.'
            : 'The application could not be resubmitted. Check the route and boarding point.',
        )
        return
      }

      setDraftOverride(null)
      setErrors({})
      setFormError(null)
      setShowForm(false)
      return
    }

    const result = createApplication(normalizedDraft)
    if (!result.ok) {
      setFormError(
        result.reason === 'persistence'
          ? 'The application was not submitted because it could not be saved. Your existing saved data was preserved; please resolve the storage warning and retry.'
          : 'An application already exists for this student. Reload the page to view the current record.',
      )
      return
    }

    setDraftOverride(null)
    setErrors({})
    setFormError(null)
    setShowForm(false)
  }

  if (shouldShowForm) {
    return (
      <section aria-labelledby="application-form-title" className="space-y-6">
        <Link
          to="/student"
          className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
            Student application
          </p>
          <h1 id="application-form-title" className="text-3xl font-semibold tracking-[-0.04em]">
            {isCorrectionsEdit ? 'Update your demonstration application' : 'Submit a demonstration application'}
          </h1>
          <p className="text-sm leading-6 text-muted">
            Use only fictional details for the prototype workflow. This does not submit a real request.
          </p>
          {!studentApplication ? (
            <p role="status" className="text-sm text-muted">
              No application exists yet. Complete this form to create your first demo application.
            </p>
          ) : null}
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-6"
        >
          <div className="space-y-2">
            <label htmlFor="routeName" className="text-sm font-medium text-foreground">
              Preferred route
            </label>
            <input
              id="routeName"
              name="routeName"
              value={draft.routeName}
              onChange={(event) => handleChange('routeName', event.target.value)}
              aria-invalid={Boolean(errors.routeName)}
              aria-describedby={errors.routeName ? 'routeName-error' : undefined}
              placeholder="North Campus Loop"
            />
            {errors.routeName ? (
              <p id="routeName-error" className="text-sm text-danger">
                {errors.routeName}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="boardingPoint" className="text-sm font-medium text-foreground">
              Boarding point
            </label>
            <input
              id="boardingPoint"
              name="boardingPoint"
              value={draft.boardingPoint}
              onChange={(event) => handleChange('boardingPoint', event.target.value)}
              aria-invalid={Boolean(errors.boardingPoint)}
              aria-describedby={errors.boardingPoint ? 'boardingPoint-error' : undefined}
              placeholder="Gate 2, Near Main Cycle Stand"
            />
            {errors.boardingPoint ? (
              <p id="boardingPoint-error" className="text-sm text-danger">
                {errors.boardingPoint}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes for the demo review team (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={draft.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              placeholder="Add any demo notes for the review workflow."
            />
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {isCorrectionsEdit ? 'Resubmit demo application' : 'Submit demo application'}
            </button>
            {studentApplication ? (
              <button
                type="button"
                onClick={() => {
                  setDraftOverride(null)
                  setErrors({})
                  setFormError(null)
                  setShowForm(false)
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>
    )
  }

  if (!studentApplication) {
    return null
  }

  const statusLabel = studentApplication.reviewStatus
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return (
    <section aria-labelledby="application-title" className="space-y-6">
      <Link
        to="/student"
        className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">
          Student application
        </p>
        <h1 id="application-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Application status
        </h1>
        <p className="text-sm leading-6 text-muted">
          The current demo application status for your student transport request.
        </p>
      </header>

      <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Application reference
              </p>
              <p className="mt-1 break-all text-xl font-semibold text-foreground">
                {studentApplication.reference}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-background-soft px-3 py-1.5 text-sm font-semibold text-foreground">
            Status: {statusLabel}
          </span>
        </div>

        {isCorrectionsEdit ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Edit and resubmit
            </button>
          </div>
        ) : null}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Submitted on
            </dt>
            <dd className="mt-2 text-base font-medium text-foreground">
              {studentApplication.submittedOn}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-background-soft p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
              Next step
            </dt>
            <dd className="mt-2 text-sm leading-6 text-muted">{studentApplication.nextAction}</dd>
          </div>
        </dl>

        <section aria-labelledby="application-history-title" className="mt-7">
          <h2 id="application-history-title" className="text-lg font-semibold text-foreground">
            Status timeline
          </h2>
          <ol className="mt-4 space-y-3">
            {studentApplication.statusHistory.map((entry, index) => (
              <li
                key={`${entry.label}-${entry.date}-${index}`}
                className="rounded-xl border border-border bg-background-soft p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium text-foreground">{entry.label}</h3>
                  <time className="text-sm text-muted">{entry.date}</time>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{entry.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <div
          role="note"
          className="mt-6 rounded-xl border border-border bg-surface-raised p-4 text-sm leading-6 text-muted"
        >
          <p className="font-semibold text-foreground">Demonstration data only</p>
          <p className="mt-1">
            This application record is fictional and is not a real approval or travel authorization.
          </p>
        </div>
      </article>
    </section>
  )
}

export default StudentApplicationPage
