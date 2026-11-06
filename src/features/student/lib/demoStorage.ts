import { mockStaffBuses } from '../../staff/data/mockStaffData'
import type { IssuedBusPass, StudentApplication } from '../types'

export const STORAGE_KEY = 'mangalam-ebus-demo-state'
export const STORAGE_VERSION = 1

export const demoQueueApplications: StudentApplication[] = [
  {
    reference: 'APP-2026-1001',
    submittedOn: '17 Mar 2026',
    nextAction: 'This application is scheduled for staff review before transport approval decisions.',
    statusHistory: [
      { label: 'Application submitted', description: 'Requested the North Campus Loop route.', date: '17 Mar 2026' },
      { label: 'Application under review', description: 'The review queue is checking route and boarding details.', date: '18 Mar 2026' },
    ],
    reviewStatus: 'under_review',
    routeName: 'North Campus Loop',
    boardingPoint: 'Gate 2, Near Main Cycle Stand',
    notes: 'Demonstration review queue example.',
    studentId: 'DEMO-STU-101',
    studentName: 'Ananya Menon',
  },
  {
    reference: 'APP-2026-1002',
    submittedOn: '21 Mar 2026',
    nextAction: 'Corrections are required before the application can be resubmitted for review.',
    statusHistory: [
      { label: 'Application submitted', description: 'Requested the South Gate Connector route.', date: '21 Mar 2026' },
      { label: 'Corrections requested', description: 'Please confirm the boarding point and route before resubmitting.', date: '22 Mar 2026' },
    ],
    reviewStatus: 'corrections_requested',
    routeName: 'South Gate Connector',
    boardingPoint: 'Library Plaza Stop',
    notes: 'Need additional route information.',
    studentId: 'DEMO-STU-102',
    studentName: 'Rohan Iyer',
  },
  {
    reference: 'APP-2026-1003',
    submittedOn: '05 Apr 2026',
    nextAction: 'This application has already been approved in the demonstration workflow and is not official travel permission.',
    statusHistory: [
      { label: 'Application submitted', description: 'Requested the West Residence Shuttle route.', date: '05 Apr 2026' },
      { label: 'Application under review', description: 'Staff review was completed.', date: '06 Apr 2026' },
      { label: 'Application approved', description: 'The demo workflow approved the route request.', date: '07 Apr 2026' },
    ],
    reviewStatus: 'approved',
    routeName: 'West Residence Shuttle',
    boardingPoint: 'Residence Gate 1',
    notes: 'Approved example for the demonstration queue.',
    studentId: 'DEMO-STU-103',
    studentName: 'Ishita Shah',
  },
  {
    reference: 'APP-2026-1004',
    submittedOn: '08 Apr 2026',
    nextAction: 'Approved in the prototype workflow. This is not an official institutional approval or travel authorization.',
    statusHistory: [
      { label: 'Application submitted', description: 'Requested the North Campus Loop route.', date: '08 Apr 2026' },
      { label: 'Application under review', description: 'A staff member is checking the route and boarding details.', date: '09 Apr 2026' },
      { label: 'Application approved', description: 'The demo workflow approved the route request before issuing a prototype pass.', date: '10 Apr 2026' },
    ],
    reviewStatus: 'approved',
    routeName: 'North Campus Loop',
    boardingPoint: 'Gate 2, Near Main Cycle Stand',
    notes: 'Demonstration review queue example for the assigned bus roster.',
    studentId: 'DEMO-STU-004',
    studentName: 'Meera Iyer',
  },
]

export const defaultIssuedPasses: IssuedBusPass[] = [
  {
    reference: 'EBUS-PASS-004',
    applicationReference: 'APP-2026-1004',
    studentId: 'DEMO-STU-004',
    studentName: 'Meera Iyer',
    routeName: 'North Campus Loop',
    boardingPoint: 'Gate 2, Near Main Cycle Stand',
    busId: 'bus-012',
    busIdentifier: 'E-BUS-012',
    issuedOn: '02 Aug 2026',
    validFrom: '02 Aug 2026',
    validTo: '31 Jul 2027',
    note: 'Prototype data — illustrative only. This record is for demo purposes and is not connected to a live transport system.',
    status: 'issued',
  },
]

export type PersistenceStatus = 'ready' | 'read_failed' | 'write_failed'

export type DemoWorkflowState = {
  applications: StudentApplication[]
  issuedPasses: IssuedBusPass[]
}

export type DemoLoadResult = DemoWorkflowState & {
  persistenceStatus: PersistenceStatus
  persistenceMessage: string | null
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

const monthNumbers: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
}

export function parseDemoDate(value: string): Date | null {
  const match = /^(\d{2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(value)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = monthNumbers[match[2]]
  const year = Number(match[3])
  if (month === undefined) {
    return null
  }

  const parsed = new Date(Date.UTC(year, month, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return parsed
}

function isValidPassForApplication(pass: IssuedBusPass, application: StudentApplication) {
  const bus = mockStaffBuses.find((candidate) => candidate.id === pass.busId)
  if (!bus || application.reviewStatus !== 'approved') {
    return false
  }

  return (
    Boolean(application.studentId) &&
    Boolean(application.studentName) &&
    pass.studentId === application.studentId &&
    pass.studentName === application.studentName &&
    Boolean(application.routeName) &&
    Boolean(application.boardingPoint) &&
    normalize(pass.routeName) === normalize(application.routeName ?? '') &&
    normalize(bus.routeName) === normalize(application.routeName ?? '') &&
    normalize(pass.boardingPoint) === normalize(application.boardingPoint ?? '') &&
    bus.boardingPoints.some((point) => normalize(point) === normalize(pass.boardingPoint)) &&
    pass.busIdentifier === bus.identifier
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getStorageErrorMessage(error: unknown, operation: 'read' | 'write' | 'clear') {
  const errorName = isRecord(error) && typeof error.name === 'string' ? error.name : ''
  const errorCode = isRecord(error) && typeof error.code === 'number' ? error.code : 0
  const isQuotaError =
    errorName === 'QuotaExceededError' ||
    errorName === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    errorCode === 22 ||
    errorCode === 1014

  if (isQuotaError) {
    return 'Browser storage is full. The change was not saved, and existing saved data was preserved.'
  }

  const isAccessError =
    errorName === 'SecurityError' ||
    errorName === 'NotAllowedError' ||
    errorName === 'InvalidStateError'

  if (isAccessError) {
    return `Browser storage is unavailable or access was denied. Prototype data could not be ${operation === 'read' ? 'read' : operation === 'write' ? 'saved' : 'cleared'}.`
  }

  if (operation === 'read') {
    return 'Stored prototype data could not be read, so the default fictional state was restored.'
  }
  if (operation === 'clear') {
    return 'The prototype could not clear the stored demo data from the browser.'
  }
  return 'The prototype could not save this state in the browser, so persistence is unavailable.'
}

function isValidStatusHistoryEntry(value: unknown): value is StudentApplication['statusHistory'][number] {
  if (!isRecord(value)) {
    return false
  }

  const allowedLabels = new Set([
    'Application submitted',
    'Application resubmitted',
    'Application under review',
    'Corrections requested',
    'Application approved',
  ])

  return (
    typeof value.label === 'string' &&
    allowedLabels.has(value.label) &&
    typeof value.date === 'string' &&
    parseDemoDate(value.date) !== null &&
    typeof value.description === 'string' &&
    Boolean(value.description.trim())
  )
}

function isValidApplicationRecord(value: unknown): value is StudentApplication {
  if (!isRecord(value)) {
    return false
  }

  const statusHistoryLabels: Record<string, ApplicationReviewStatus> = {
    'Application submitted': 'submitted',
    'Application resubmitted': 'submitted',
    'Application under review': 'under_review',
    'Corrections requested': 'corrections_requested',
    'Application approved': 'approved',
  }
  const latestHistoryEntry =
    Array.isArray(value.statusHistory) && value.statusHistory.length > 0
      ? value.statusHistory.reduce((latest, entry) => {
          const entryDate = isRecord(entry) && typeof entry.date === 'string'
            ? parseDemoDate(entry.date)
            : null
          const latestDate = isRecord(latest) && typeof latest.date === 'string'
            ? parseDemoDate(latest.date)
            : null
          return entryDate && latestDate && entryDate > latestDate ? entry : latest
        })
      : undefined

  return (
    typeof value.reference === 'string' &&
    Boolean(value.reference.trim()) &&
    typeof value.submittedOn === 'string' &&
    parseDemoDate(value.submittedOn) !== null &&
    typeof value.nextAction === 'string' &&
    Boolean(value.nextAction.trim()) &&
    Array.isArray(value.statusHistory) &&
    value.statusHistory.length > 0 &&
    value.statusHistory.every(isValidStatusHistoryEntry) &&
    typeof value.reviewStatus === 'string' &&
    isRecord(latestHistoryEntry) &&
    typeof latestHistoryEntry.label === 'string' &&
    statusHistoryLabels[latestHistoryEntry.label] === value.reviewStatus &&
    (typeof value.routeName === 'string' && Boolean(value.routeName.trim())) &&
    (typeof value.boardingPoint === 'string' && Boolean(value.boardingPoint.trim())) &&
    (typeof value.notes === 'string' || value.notes === undefined) &&
    typeof value.studentId === 'string' &&
    Boolean(value.studentId.trim()) &&
    typeof value.studentName === 'string' &&
    Boolean(value.studentName.trim())
  )
}

function isValidIssuedPassRecord(value: unknown): value is IssuedBusPass {
  if (!isRecord(value)) {
    return false
  }

  const validFrom = typeof value.validFrom === 'string' ? parseDemoDate(value.validFrom) : null
  const validTo = typeof value.validTo === 'string' ? parseDemoDate(value.validTo) : null

  return (
    typeof value.reference === 'string' &&
    Boolean(value.reference.trim()) &&
    typeof value.applicationReference === 'string' &&
    Boolean(value.applicationReference.trim()) &&
    typeof value.studentId === 'string' &&
    Boolean(value.studentId.trim()) &&
    typeof value.studentName === 'string' &&
    Boolean(value.studentName.trim()) &&
    typeof value.routeName === 'string' &&
    Boolean(value.routeName.trim()) &&
    typeof value.boardingPoint === 'string' &&
    Boolean(value.boardingPoint.trim()) &&
    typeof value.busId === 'string' &&
    Boolean(value.busId.trim()) &&
    typeof value.busIdentifier === 'string' &&
    Boolean(value.busIdentifier.trim()) &&
    typeof value.issuedOn === 'string' &&
    parseDemoDate(value.issuedOn) !== null &&
    typeof value.validFrom === 'string' &&
    validFrom !== null &&
    typeof value.validTo === 'string' &&
    validTo !== null &&
    validTo.getTime() >= validFrom.getTime() &&
    typeof value.note === 'string' &&
    Boolean(value.note.trim()) &&
    value.status === 'issued'
  )
}

type ApplicationReviewStatus = StudentApplication['reviewStatus']

function hasValidPassRelationships(applications: StudentApplication[], issuedPasses: IssuedBusPass[]) {
  const applicationMap = new Map(applications.map((application) => [application.reference, application]))
  const seenApplicationReferences = new Set<string>()
  const seenStudentIds = new Set<string>()

  for (const application of applications) {
    if (!application.reference.trim() || seenApplicationReferences.has(application.reference)) {
      return false
    }
    seenApplicationReferences.add(application.reference)
    if (seenStudentIds.has(application.studentId)) {
      return false
    }
    seenStudentIds.add(application.studentId)
  }

  const seenPassReferences = new Set<string>()
  const seenApplicationPasses = new Set<string>()
  const seenStudentPasses = new Set<string>()

  for (const pass of issuedPasses) {
    if (!pass.reference.trim() || seenPassReferences.has(pass.reference) || !pass.applicationReference.trim()) {
      return false
    }
    seenPassReferences.add(pass.reference)

    const matchingApplication = applicationMap.get(pass.applicationReference)
    if (!matchingApplication || !isValidPassForApplication(pass, matchingApplication)) {
      return false
    }

    if (
      seenApplicationPasses.has(pass.applicationReference) ||
      seenStudentPasses.has(pass.studentId)
    ) {
      return false
    }
    seenApplicationPasses.add(pass.applicationReference)
    seenStudentPasses.add(pass.studentId)
  }

  return true
}

export function isValidWorkflowState(value: unknown): value is DemoWorkflowState & { version: number } {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.version !== 'number' || value.version !== STORAGE_VERSION) {
    return false
  }

  if (!Array.isArray(value.applications) || !Array.isArray(value.issuedPasses)) {
    return false
  }

  if (!value.applications.every(isValidApplicationRecord)) {
    return false
  }

  if (!value.issuedPasses.every(isValidIssuedPassRecord)) {
    return false
  }

  return hasValidPassRelationships(value.applications, value.issuedPasses)
}

export function readDemoState(): DemoLoadResult {
  const fallback: DemoLoadResult = {
    applications: demoQueueApplications,
    issuedPasses: defaultIssuedPasses,
    persistenceStatus: 'ready',
    persistenceMessage: null,
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return fallback
    }

    const parsed = JSON.parse(rawValue) as unknown

    if (!isValidWorkflowState(parsed)) {
      return {
        ...fallback,
        persistenceStatus: 'read_failed',
        persistenceMessage:
          'Saved prototype data was invalid or from an unsupported version and has been ignored.',
      }
    }

    return {
      applications: parsed.applications,
      issuedPasses: parsed.issuedPasses,
      persistenceStatus: 'ready',
      persistenceMessage: null,
    }
  } catch (error) {
    return {
      ...fallback,
      persistenceStatus: 'read_failed',
      persistenceMessage: getStorageErrorMessage(error, 'read'),
    }
  }
}

export function saveDemoState(state: DemoWorkflowState): {
  ok: boolean
  persistenceStatus: PersistenceStatus
  persistenceMessage: string | null
} {
  try {
    const payload = {
      version: STORAGE_VERSION,
      applications: state.applications,
      issuedPasses: state.issuedPasses,
      savedAt: new Date().toISOString(),
    }

    if (!isValidWorkflowState(payload)) {
      return {
        ok: false,
        persistenceStatus: 'write_failed',
        persistenceMessage: 'The workflow state could not be saved because it violates the prototype schema.',
      }
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))

    return {
      ok: true,
      persistenceStatus: 'ready',
      persistenceMessage: null,
    }
  } catch (error) {
    return {
      ok: false,
      persistenceStatus: 'write_failed',
      persistenceMessage: getStorageErrorMessage(error, 'write'),
    }
  }
}

export function clearDemoState(): {
  ok: boolean
  persistenceStatus: PersistenceStatus
  persistenceMessage: string | null
} {
  try {
    window.localStorage.removeItem(STORAGE_KEY)

    return {
      ok: true,
      persistenceStatus: 'ready',
      persistenceMessage: null,
    }
  } catch (error) {
    return {
      ok: false,
      persistenceStatus: 'write_failed',
      persistenceMessage: getStorageErrorMessage(error, 'clear'),
    }
  }
}

export function buildDriverBusRecord() {
  return mockStaffBuses[0]
}
