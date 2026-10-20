import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { mockStaffBuses } from '../../staff/data/mockStaffData'
import { mockStudent } from '../data/mockStudentData'
import {
  clearDemoState,
  defaultIssuedPasses,
  demoQueueApplications,
  readDemoState,
  saveDemoState,
  type PersistenceStatus,
} from '../lib/demoStorage'
import type { ApplicationReviewStatus, IssuedBusPass, StudentApplication } from '../types'
import { StudentApplicationContext, type StudentApplicationDraft } from './studentApplicationContext'

const statusTransitionMap: Record<ApplicationReviewStatus, ApplicationReviewStatus[]> = {
  submitted: ['under_review'],
  under_review: ['approved', 'corrections_requested'],
  corrections_requested: ['submitted'],
  approved: [],
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function buildStatusHistory(
  label: string,
  description: string,
  date: string,
): StudentApplication['statusHistory'][number] {
  return { label, date, description }
}

function buildReference(usedReferences: Set<string>, sequence: { current: number }) {
  const candidatePrefix = `APP-${new Date().getFullYear()}-`
  let reference = ''

  do {
    sequence.current += 1
    reference = `${candidatePrefix}${String(sequence.current).padStart(4, '0')}`
  } while (usedReferences.has(reference))

  usedReferences.add(reference)
  return reference
}

function isValidTransition(
  currentStatus: ApplicationReviewStatus,
  nextStatus: ApplicationReviewStatus,
) {
  return statusTransitionMap[currentStatus].includes(nextStatus)
}

function getNextAction(status: ApplicationReviewStatus) {
  const nextActionMap: Record<ApplicationReviewStatus, string> = {
    submitted: 'Submitted to the demonstration review queue for staff screening.',
    under_review: 'Under demonstration review. Staff are checking the application details.',
    corrections_requested:
      'Corrections are requested. Please update the route or boarding details before resubmission.',
    approved:
      'Approved in the prototype workflow. This is not an official institutional approval or travel authorization.',
  }

  return nextActionMap[status]
}

function normalizeRouteValue(value: string | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ')
}

function isValidIssuedRouteAndBoardingPoint(
  routeName: string | undefined,
  boardingPoint: string | undefined,
  busId: string,
) {
  const selectedBus = mockStaffBuses.find((bus) => bus.id === busId)
  if (!selectedBus || !routeName || !boardingPoint) {
    return false
  }

  if (normalizeRouteValue(selectedBus.routeName).toLocaleLowerCase() !== normalizeRouteValue(routeName).toLocaleLowerCase()) {
    return false
  }

  const normalizedBoardingPoint = normalizeRouteValue(boardingPoint)
  return selectedBus.boardingPoints.some((boardPoint) => normalizeRouteValue(boardPoint) === normalizedBoardingPoint)
}

export function StudentApplicationProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState(readDemoState)
  const [applications, setApplications] = useState<StudentApplication[]>(initialState.applications)
  const [issuedPasses, setIssuedPasses] = useState<IssuedBusPass[]>(initialState.issuedPasses)
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>(initialState.persistenceStatus)
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(initialState.persistenceMessage)

  const applicationsRef = useRef(applications)
  const issuedPassesRef = useRef(issuedPasses)
  const usedReferencesRef = useRef(new Set(initialState.applications.map((application) => application.reference)))
  const referenceSequenceRef = useRef(0)
  const usedPassReferencesRef = useRef(new Set(initialState.issuedPasses.map((pass) => pass.reference)))

  const commitState = useCallback(
    (nextApplications: StudentApplication[], nextIssuedPasses: IssuedBusPass[]) => {
      applicationsRef.current = nextApplications
      issuedPassesRef.current = nextIssuedPasses
      setApplications(nextApplications)
      setIssuedPasses(nextIssuedPasses)

      const saveResult = saveDemoState({ applications: nextApplications, issuedPasses: nextIssuedPasses })
      setPersistenceStatus(saveResult.persistenceStatus)
      setPersistenceMessage(saveResult.persistenceMessage)
    },
    [],
  )

  const resetPrototypeState = useCallback(() => {
    const nextApplications = demoQueueApplications
    const nextIssuedPasses = defaultIssuedPasses

    applicationsRef.current = nextApplications
    issuedPassesRef.current = nextIssuedPasses
    setApplications(nextApplications)
    setIssuedPasses(nextIssuedPasses)
    usedReferencesRef.current = new Set(nextApplications.map((application) => application.reference))
    referenceSequenceRef.current = 0
    usedPassReferencesRef.current = new Set(nextIssuedPasses.map((pass) => pass.reference))

    const saveResult = clearDemoState()
    if (!saveResult.ok) {
      setPersistenceStatus(saveResult.persistenceStatus)
      setPersistenceMessage(saveResult.persistenceMessage)
      return
    }

    setPersistenceStatus('ready')
    setPersistenceMessage('Prototype data was reset to the initial fictional state.')
  }, [])

  const studentApplication = useMemo(
    () => applications.find((item) => item.studentId === mockStudent.studentId) ?? null,
    [applications],
  )

  const studentPass = useMemo(
    () => issuedPasses.find((item) => item.studentId === mockStudent.studentId) ?? null,
    [issuedPasses],
  )

  const createApplication = useCallback((draft: StudentApplicationDraft): StudentApplication | null => {
    const targetStudentId = draft.studentId ?? mockStudent.studentId
    const targetStudentName = draft.studentName ?? mockStudent.name

    if (applicationsRef.current.some((item) => item.studentId === targetStudentId)) {
      return null
    }

    const sanitizedRouteName = draft.routeName.trim()
    const sanitizedBoardingPoint = draft.boardingPoint.trim()
    const sanitizedNotes = draft.notes?.trim() ?? ''

    if (!sanitizedRouteName || !sanitizedBoardingPoint) {
      return null
    }

    const createdOn = formatDate(new Date())
    const reference = buildReference(usedReferencesRef.current, referenceSequenceRef)

    const createdApplication: StudentApplication = {
      reference,
      submittedOn: createdOn,
      nextAction: getNextAction('submitted'),
      statusHistory: [
        buildStatusHistory(
          'Application submitted',
          `Student requested the ${sanitizedRouteName} route from ${sanitizedBoardingPoint}.`,
          createdOn,
        ),
      ],
      reviewStatus: 'submitted',
      routeName: sanitizedRouteName,
      boardingPoint: sanitizedBoardingPoint,
      notes: sanitizedNotes,
      studentId: targetStudentId,
      studentName: targetStudentName,
    }

    const nextApplications = [createdApplication, ...applicationsRef.current]
    usedReferencesRef.current.add(reference)
    commitState(nextApplications, issuedPassesRef.current)
    return createdApplication
  }, [commitState])

  const updateApplicationStatus = useCallback(
    (reference: string, nextStatus: ApplicationReviewStatus, note: string): StudentApplication | null => {
      const currentApplications = applicationsRef.current
      const application = currentApplications.find((item) => item.reference === reference)
      const trimmedNote = note.trim()

      if (
        !application ||
        nextStatus === 'submitted' ||
        !isValidTransition(application.reviewStatus, nextStatus) ||
        (nextStatus === 'corrections_requested' && !trimmedNote)
      ) {
        return null
      }

      const safeNote = trimmedNote || getNextAction(nextStatus)
      const timelineLabel =
        nextStatus === 'approved'
          ? 'Application approved'
          : nextStatus === 'corrections_requested'
            ? 'Corrections requested'
            : 'Application under review'
      const updatedApplication = {
        ...application,
        reviewStatus: nextStatus,
        nextAction: safeNote,
        statusHistory: [
          buildStatusHistory(timelineLabel, safeNote, formatDate(new Date())),
          ...application.statusHistory,
        ],
      }

      const nextApplications = currentApplications.map((item) =>
        item.reference === reference ? updatedApplication : item,
      )
      commitState(nextApplications, issuedPassesRef.current)
      return updatedApplication
    },
    [commitState],
  )

  const resubmitApplication = useCallback(
    (reference: string, draft: StudentApplicationDraft): StudentApplication | null => {
      const currentApplications = applicationsRef.current
      const application = currentApplications.find((item) => item.reference === reference)
      const sanitizedRouteName = draft.routeName.trim()
      const sanitizedBoardingPoint = draft.boardingPoint.trim()

      if (
        !application ||
        !isValidTransition(application.reviewStatus, 'submitted') ||
        !sanitizedRouteName ||
        !sanitizedBoardingPoint
      ) {
        return null
      }

      const updatedApplication = {
        ...application,
        submittedOn: formatDate(new Date()),
        nextAction: getNextAction('submitted'),
        reviewStatus: 'submitted' as const,
        routeName: sanitizedRouteName,
        boardingPoint: sanitizedBoardingPoint,
        notes: draft.notes?.trim() ?? '',
        statusHistory: [
          buildStatusHistory(
            'Application resubmitted',
            `Student updated the request to ${sanitizedRouteName} from ${sanitizedBoardingPoint}.`,
            formatDate(new Date()),
          ),
          ...application.statusHistory,
        ],
      }

      const nextApplications = currentApplications.map((item) =>
        item.reference === reference ? updatedApplication : item,
      )
      commitState(nextApplications, issuedPassesRef.current)
      return updatedApplication
    },
    [commitState],
  )

  const issuePass = useCallback(
    (reference: string, busId: string): IssuedBusPass | null => {
      const application = applicationsRef.current.find((item) => item.reference === reference)

      if (
        !application ||
        application.reviewStatus !== 'approved' ||
        !application.studentId ||
        !application.studentName
      ) {
        return null
      }

      const hasExistingPass = issuedPassesRef.current.some(
        (pass) => pass.applicationReference === reference || pass.studentId === application.studentId,
      )

      if (hasExistingPass) {
        return null
      }

      if (!isValidIssuedRouteAndBoardingPoint(application.routeName, application.boardingPoint, busId)) {
        return null
      }

      const matchingBus = mockStaffBuses.find((bus) => bus.id === busId)

      if (!matchingBus) {
        return null
      }

      let passReference = ''
      let sequence = issuedPassesRef.current.length + 1
      do {
        passReference = `EBUS-PASS-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`
        sequence += 1
      } while (usedPassReferencesRef.current.has(passReference))
      usedPassReferencesRef.current.add(passReference)

      const issuedPass: IssuedBusPass = {
        reference: passReference,
        applicationReference: application.reference,
        studentId: application.studentId,
        studentName: application.studentName,
        routeName: application.routeName ?? matchingBus.routeName,
        boardingPoint: application.boardingPoint ?? matchingBus.origin,
        busId: matchingBus.id,
        busIdentifier: matchingBus.identifier,
        issuedOn: formatDate(new Date()),
        validFrom: '01 Aug 2026',
        validTo: '31 Jul 2027',
        note: 'Prototype pass issued in the demonstration workflow. This pass is not valid for travel.',
        status: 'issued',
      }

      const nextIssuedPasses = [issuedPass, ...issuedPassesRef.current]
      commitState(applicationsRef.current, nextIssuedPasses)
      return issuedPass
    },
    [commitState],
  )

  return (
    <StudentApplicationContext.Provider
      value={{
        applications,
        studentApplication,
        issuedPasses,
        studentPass,
        persistenceStatus,
        persistenceMessage,
        createApplication,
        updateApplicationStatus,
        resubmitApplication,
        issuePass,
        resetPrototypeState,
      }}
    >
      {children}
    </StudentApplicationContext.Provider>
  )
}
