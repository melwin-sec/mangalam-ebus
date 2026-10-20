import { BusFront, UserRound } from 'lucide-react'
import type { StudentProfile, StudentRoute } from '../types'

type StudentProfileDetailsProps = {
  student: StudentProfile
  route: StudentRoute
}

function StudentProfileDetails({ student, route }: StudentProfileDetailsProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-md sm:p-6">
      <div className="flex min-w-0 items-center gap-4 border-b border-border pb-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <UserRound className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-semibold text-foreground">{student.name}</h2>
          <p className="break-words font-mono text-sm text-muted">{student.studentId}</p>
        </div>
      </div>

      <dl className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Program</dt>
          <dd className="mt-2 break-words text-base font-medium text-foreground">{student.program}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Academic year</dt>
          <dd className="mt-2 break-words text-base font-medium text-foreground">{student.year}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Residence</dt>
          <dd className="mt-2 break-words text-base font-medium text-foreground">{student.hostel}</dd>
        </div>
        {student.emergencyContact && (
          <div className="min-w-0 rounded-xl border border-border bg-background-soft p-4">
            <dt className="text-xs uppercase tracking-[0.12em] text-muted">
              Emergency contact · sample
            </dt>
            <dd className="mt-2 break-words text-base font-medium text-foreground">
              {student.emergencyContact}
            </dd>
          </div>
        )}
      </dl>

      <section
        aria-labelledby="profile-transport-title"
        className="mt-6 rounded-xl border border-border bg-background-soft p-4"
      >
        <h3
          id="profile-transport-title"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
        >
          <BusFront className="h-4 w-4 text-primary" aria-hidden="true" />
          Assigned transport · sample
        </h3>
        <p className="mt-3 break-words text-sm font-medium text-foreground">
          {route.bus} · {route.name}
        </p>
        <p className="mt-1 break-words text-sm text-muted">
          Boarding point: {route.boardingPoint}
        </p>
      </section>
    </article>
  )
}

export default StudentProfileDetails
