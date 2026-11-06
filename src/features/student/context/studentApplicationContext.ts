import { createContext } from 'react'
import type { ApplicationReviewStatus, IssuedBusPass, StudentApplication } from '../types'

export type StudentApplicationDraft = {
  routeName: string
  boardingPoint: string
  notes?: string
  studentId?: string
  studentName?: string
}

export type WorkflowActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'invalid' | 'persistence' }

export type StudentApplicationContextValue = {
  applications: StudentApplication[]
  studentApplication: StudentApplication | null
  issuedPasses: IssuedBusPass[]
  studentPass: IssuedBusPass | null
  persistenceStatus: 'ready' | 'read_failed' | 'write_failed'
  persistenceMessage: string | null
  createApplication: (draft: StudentApplicationDraft) => WorkflowActionResult<StudentApplication>
  updateApplicationStatus: (
    reference: string,
    nextStatus: ApplicationReviewStatus,
    note: string,
  ) => WorkflowActionResult<StudentApplication>
  resubmitApplication: (
    reference: string,
    draft: StudentApplicationDraft,
  ) => WorkflowActionResult<StudentApplication>
  issuePass: (reference: string, busId: string) => WorkflowActionResult<IssuedBusPass>
  resetPrototypeState: () => void
}

export const StudentApplicationContext = createContext<StudentApplicationContextValue | undefined>(undefined)
