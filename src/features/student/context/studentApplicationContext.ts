import { createContext } from 'react'
import type { ApplicationReviewStatus, IssuedBusPass, StudentApplication } from '../types'

export type StudentApplicationDraft = {
  routeName: string
  boardingPoint: string
  notes?: string
  studentId?: string
  studentName?: string
}

export type StudentApplicationContextValue = {
  applications: StudentApplication[]
  studentApplication: StudentApplication | null
  issuedPasses: IssuedBusPass[]
  studentPass: IssuedBusPass | null
  persistenceStatus: 'ready' | 'read_failed' | 'write_failed'
  persistenceMessage: string | null
  createApplication: (draft: StudentApplicationDraft) => StudentApplication | null
  updateApplicationStatus: (
    reference: string,
    nextStatus: ApplicationReviewStatus,
    note: string,
  ) => StudentApplication | null
  resubmitApplication: (reference: string, draft: StudentApplicationDraft) => StudentApplication | null
  issuePass: (reference: string, busId: string) => IssuedBusPass | null
  resetPrototypeState: () => void
}

export const StudentApplicationContext = createContext<StudentApplicationContextValue | undefined>(undefined)
