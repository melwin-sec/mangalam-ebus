import {
  ArrowRight,
  BadgeCheck,
  BusFront,
  ClipboardCheck,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: BusFront,
    title: 'Digital Bus Pass',
    description:
      'Give students a simpler way to access transport details and pass information without relying on paper-based handoffs.',
  },
  {
    icon: ClipboardCheck,
    title: 'Simplified Pass Management',
    description:
      'Reduce friction around pass-related tasks by centralising communication and clarity for students and staff in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Transport Verification',
    description:
      'Support a clearer verification flow so staff can check pass and transport access in a more structured, transparent workflow.',
  },
]

const steps = [
  'Sign in through the appropriate student or staff entry point.',
  'Access the transport services and pass information relevant to your role.',
  'Use the prototype workflow to review and manage day-to-day transport touchpoints.',
]

function LandingPage() {
  return (
    <div className="space-y-14 pb-12 sm:space-y-16">
      <section className="overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-md">
        <div className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Prototype access
            </div>

            <h1 className="max-w-xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              Your campus commute, simplified.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Mangalam eBus brings the student and staff transport experience into one clear digital workflow, helping manage bus access and campus mobility with less friction.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/student/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Student Login
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                to="/staff/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface-raised px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Staff Login
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-[1.5rem] border border-border bg-surface-raised p-4 shadow-lg">
              <div className="rounded-[1.25rem] border border-border bg-background-soft p-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">Illustrative preview</p>
                    <p className="mt-1 text-sm font-medium text-foreground">Digital pass concept</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                    Example only
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BusFront className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Pass</p>
                        <p className="text-sm font-medium text-foreground">Digital access</p>
                      </div>
                    </div>
                    <BadgeCheck className="h-4 w-4 text-success" aria-hidden="true" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Route</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">Route details</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Access</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">Pass access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Core features</p>
          <h2 id="features-heading" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            Built for campus transport clarity.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[1.25rem] border border-border bg-surface p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-raised"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="rounded-[1.5rem] border border-border bg-surface p-5 sm:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-success">How it works</p>
          <h2 id="how-it-works-heading" className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            A clearer route for everyday campus movement.
          </h2>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-[1.25rem] border border-border bg-surface-raised p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-surface-raised p-5 shadow-md sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Get started</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
              Ready for student or staff access?
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/student/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Student Login
            </Link>

            <Link
              to="/staff/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border pt-6">
        <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-foreground">Mangalam eBus</div>
            <div className="mt-1 uppercase tracking-[0.18em] text-muted">Digital Bus Pass &amp; Transport</div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            Prototype interface for demonstration purposes only. This project is not an official institutional system or approved service deployment.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
