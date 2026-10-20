import { ArrowLeft, BusFront, Clock3, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'
import { mockRoute } from '../data/mockStudentData'

function StudentTransportPage() {
  return (
    <section aria-labelledby="transport-title" className="space-y-6">
      <Link
        to="/student"
        className="inline-flex min-h-10 items-center gap-2 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Student transport
        </p>
        <h1 id="transport-title" className="text-3xl font-semibold tracking-[-0.04em]">
          Transport information
        </h1>
        <p className="text-sm leading-6 text-muted">
          Illustrative route assignment and stops from the student portal demo.
        </p>
      </header>

      <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <BusFront className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Assigned bus · sample
              </p>
              <p className="mt-1 break-words text-xl font-semibold text-foreground">
                {mockRoute.bus}
              </p>
            </div>
          </div>
          <p className="rounded-full border border-border bg-background-soft px-3 py-1.5 text-sm text-muted">
            Sample route
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-background-soft p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-foreground">{mockRoute.name}</h2>
          <p className="mt-2 break-words text-sm text-muted">
            {mockRoute.origin} to {mockRoute.destination}
          </p>
          <div className="mt-5 rounded-lg border border-border bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              <MapPinned className="h-4 w-4 text-primary" aria-hidden="true" />
              Student boarding point · sample
            </p>
            <p className="mt-2 break-words text-base font-medium text-foreground">
              {mockRoute.boardingPoint}
            </p>
          </div>
        </div>

        <section aria-labelledby="route-stops-title" className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="route-stops-title" className="text-lg font-semibold text-foreground">
              Illustrative route stops
            </h2>
            <p className="text-xs text-muted">Example details only</p>
          </div>
          <ol className="mt-4 space-y-3">
            {mockRoute.stops.map((stop, index) => (
              <li
                key={stop.name}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background-soft p-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="break-words font-medium text-foreground">{stop.name}</h3>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                      <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
                      Sample time: {stop.eta}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{stop.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div
          role="note"
          className="mt-6 rounded-xl border border-border bg-surface-raised p-4 text-sm leading-6 text-muted"
        >
          <p className="font-semibold text-foreground">Sample schedule — not live operational information</p>
          <p className="mt-1">{mockRoute.schedule}</p>
          <p className="mt-2">
            Bus, route, stop, and time details are fictional prototype data. No live tracking or
            service updates are available.
          </p>
        </div>
      </article>
    </section>
  )
}

export default StudentTransportPage
