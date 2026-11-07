export type StudentStatus = 'active' | 'pending' | 'review' | 'expired' | 'not_yet_valid' | 'invalid'
export type ApplicationReviewStatus =
  | 'submitted'
  | 'under_review'
  | 'corrections_requested'
  | 'approved'

export type IssuedBusPass = {
  reference: string
  applicationReference: string
  studentId: string
  studentName: string
  routeName: string
  boardingPoint: string
  busId: string
  busIdentifier: string
  issuedOn: string
  validFrom: string
  validTo: string
  note: string
  status: 'issued'
}

export type StudentProfile = {
  id: string
  name: string
  studentId: string
  program: string
  year: string
  hostel: string
  emergencyContact?: string
}

export type BusPass = {
  reference: string
  status: StudentStatus
  validFrom: string
  validTo: string
  note: string
}

export type RouteStop = {
  name: string
  eta: string
  note: string
}

export type StudentRoute = {
  id: string
  name: string
  bus: string
  origin: string
  destination: string
  boardingPoint: string
  schedule: string
  stops: RouteStop[]
}

export type StatusHistoryEntry = {
  label: string
  date: string
  description: string
}

export type StudentApplication = {
  reference: string
  submittedOn: string
  nextAction: string
  statusHistory: StatusHistoryEntry[]
  reviewStatus: ApplicationReviewStatus
  routeName: string
  boardingPoint: string
  notes?: string
  studentId: string
  studentName: string
}
