import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearDemoState,
  defaultIssuedPasses,
  demoQueueApplications,
  isValidWorkflowState,
  readDemoState,
  saveDemoState,
  STORAGE_KEY,
  STORAGE_VERSION,
} from './demoStorage'
import type { IssuedBusPass, StudentApplication } from '../types'
import { mockStudent } from '../data/mockStudentData'

type TestWorkflow = {
  version: number
  applications: StudentApplication[]
  issuedPasses: IssuedBusPass[]
}

function validWorkflow(): TestWorkflow {
  return structuredClone({
    version: STORAGE_VERSION,
    applications: demoQueueApplications,
    issuedPasses: defaultIssuedPasses,
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('demo storage integrity', () => {
  it('keeps the fresh student state empty while preserving staff examples and linked passes', () => {
    const state = validWorkflow()

    expect(isValidWorkflowState(state)).toBe(true)
    expect(state.applications.some((application) => application.studentId === mockStudent.studentId)).toBe(false)
    expect(state.issuedPasses.some((pass) => pass.studentId === mockStudent.studentId)).toBe(false)
    expect(state.applications.map((application) => application.reference)).toEqual([
      'APP-2026-1001',
      'APP-2026-1002',
      'APP-2026-1003',
      'APP-2026-1004',
    ])
    expect(state.issuedPasses).toHaveLength(1)
    expect(state.issuedPasses[0].studentId).toBe('DEMO-STU-004')
    expect(state.issuedPasses[0].applicationReference).toBe('APP-2026-1004')
  })

  it.each([
    ['blank application reference', (state: TestWorkflow) => { state.applications[0].reference = '   ' }],
    ['blank submission date', (state: TestWorkflow) => { state.applications[0].submittedOn = '   ' }],
    ['missing route', (state: TestWorkflow) => { delete (state.applications[0] as Partial<StudentApplication>).routeName }],
    ['blank route', (state: TestWorkflow) => { state.applications[0].routeName = '   ' }],
    ['blank boarding point', (state: TestWorkflow) => { state.applications[0].boardingPoint = '   ' }],
    ['missing student ID', (state: TestWorkflow) => { delete (state.applications[0] as Partial<StudentApplication>).studentId }],
    ['blank student ID', (state: TestWorkflow) => { state.applications[0].studentId = '   ' }],
    ['missing student name', (state: TestWorkflow) => { delete (state.applications[0] as Partial<StudentApplication>).studentName }],
    ['blank student name', (state: TestWorkflow) => { state.applications[0].studentName = '   ' }],
    ['invalid submission date', (state: TestWorkflow) => { state.applications[0].submittedOn = '31 Feb 2026' }],
    ['invalid history date', (state: TestWorkflow) => { state.applications[0].statusHistory[0].date = '2026-03-17' }],
    ['empty review history', (state: TestWorkflow) => { state.applications[0].statusHistory = [] }],
    ['contradictory latest history', (state: TestWorkflow) => { state.applications[0].statusHistory[1].label = 'Application approved' }],
    ['unknown history label', (state: TestWorkflow) => { state.applications[0].statusHistory[0].label = 'Application rejected' }],
    ['invalid pass issue date', (state: TestWorkflow) => { state.issuedPasses[0].issuedOn = 'not a date' }],
    ['impossible pass validity date', (state: TestWorkflow) => { state.issuedPasses[0].validTo = '31 Feb 2027' }],
    ['pass validity end before start', (state: TestWorkflow) => { state.issuedPasses[0].validTo = '01 Aug 2026' }],
    ['empty application reference', (state: TestWorkflow) => { state.issuedPasses[0].applicationReference = '' }],
    ['nonexistent application reference', (state: TestWorkflow) => { state.issuedPasses[0].applicationReference = 'MISSING-APP' }],
    ['unapproved application', (state: TestWorkflow) => { state.applications.find((app) => app.reference === 'APP-2026-1004')!.reviewStatus = 'under_review' }],
    ['mismatched student identity', (state: TestWorkflow) => { state.issuedPasses[0].studentId = 'OTHER-STUDENT' }],
    ['mismatched student name', (state: TestWorkflow) => { state.issuedPasses[0].studentName = 'Other Student' }],
    ['mismatched route', (state: TestWorkflow) => { state.issuedPasses[0].routeName = 'West Residence Shuttle' }],
    ['mismatched boarding point', (state: TestWorkflow) => { state.issuedPasses[0].boardingPoint = 'Library Plaza Stop' }],
    ['unsupported bus', (state: TestWorkflow) => { state.issuedPasses[0].busId = 'bus-999' }],
    ['mismatched bus route', (state: TestWorkflow) => { state.issuedPasses[0].busId = 'bus-017'; state.issuedPasses[0].busIdentifier = 'E-BUS-017' }],
    ['mismatched bus identifier', (state: TestWorkflow) => { state.issuedPasses[0].busIdentifier = 'E-BUS-999' }],
    ['duplicate pass reference', (state: TestWorkflow) => { state.issuedPasses.push({ ...state.issuedPasses[0]!, applicationReference: 'APP-2026-1004', studentId: 'DEMO-STU-004', studentName: 'Meera Iyer' }) }],
    ['duplicate application and student issuance', (state: TestWorkflow) => { state.issuedPasses.push({ ...state.issuedPasses[0], reference: 'EBUS-PASS-DUPLICATE' }) }],
  ])('rejects %s', (_description, corrupt) => {
    const state = validWorkflow()
    corrupt(state)
    expect(isValidWorkflowState(state)).toBe(false)
  })

  it('preserves optional notes when absent or empty', () => {
    const state = validWorkflow()
    state.applications[0].notes = ''
    expect(isValidWorkflowState(state)).toBe(true)

    delete (state.applications[0] as Partial<StudentApplication>).notes
    expect(isValidWorkflowState(state)).toBe(true)
  })

  it('falls back safely and reports invalid persisted records', () => {
    const state = validWorkflow()
    state.issuedPasses[0].applicationReference = 'MISSING-APP'
    const rawState = JSON.stringify(state)
    window.localStorage.setItem(STORAGE_KEY, rawState)

    const loaded = readDemoState()
    expect(loaded.persistenceStatus).toBe('read_failed')
    expect(loaded.applications).toEqual(demoQueueApplications)
    expect(loaded.issuedPasses).toEqual(defaultIssuedPasses)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(rawState)
  })

  it('reports quota failures and preserves the previous saved value', () => {
    const original = JSON.stringify({
      version: STORAGE_VERSION,
      applications: demoQueueApplications,
      issuedPasses: defaultIssuedPasses,
    })
    window.localStorage.setItem(STORAGE_KEY, original)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    })

    const result = saveDemoState(validWorkflow())

    expect(result.ok).toBe(false)
    expect(result.persistenceStatus).toBe('write_failed')
    expect(result.persistenceMessage).toMatch(/storage is full/i)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(original)
  })

  it('reports when browser storage access is denied', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })

    const result = readDemoState()

    expect(result.persistenceStatus).toBe('read_failed')
    expect(result.persistenceMessage).toMatch(/storage is unavailable or access was denied/i)
  })

  it('restores the revised fictional defaults after clearing saved workflow data', () => {
    const saved = validWorkflow()
    expect(saveDemoState(saved).ok).toBe(true)

    expect(clearDemoState().ok).toBe(true)
    const restored = readDemoState()

    expect(restored.applications).toEqual(demoQueueApplications)
    expect(restored.issuedPasses).toEqual(defaultIssuedPasses)
    expect(restored.applications.some((application) => application.studentId === mockStudent.studentId)).toBe(false)
    expect(restored.issuedPasses.some((pass) => pass.studentId === mockStudent.studentId)).toBe(false)
  })

  it('preserves previously saved valid student application and pass data', () => {
    const legacyApplication: StudentApplication = {
      reference: 'APP-2026-1005',
      submittedOn: '15 Apr 2026',
      nextAction: 'Approved in the existing demonstration workflow.',
      statusHistory: [
        { label: 'Application submitted', description: 'Existing saved application.', date: '13 Apr 2026' },
        { label: 'Application approved', description: 'Existing saved approval.', date: '15 Apr 2026' },
      ],
      reviewStatus: 'approved',
      routeName: 'North Campus Loop',
      boardingPoint: 'Gate 2, Near Main Cycle Stand',
      notes: 'Existing saved fictional application.',
      studentId: mockStudent.studentId,
      studentName: mockStudent.name,
    }
    const legacyPass: IssuedBusPass = {
      reference: 'EBUS-PASS-2041',
      applicationReference: legacyApplication.reference,
      studentId: mockStudent.studentId,
      studentName: mockStudent.name,
      routeName: 'North Campus Loop',
      boardingPoint: 'Gate 2, Near Main Cycle Stand',
      busId: 'bus-012',
      busIdentifier: 'E-BUS-012',
      issuedOn: '01 Aug 2026',
      validFrom: '01 Aug 2026',
      validTo: '31 Jul 2027',
      note: 'Previously saved fictional pass.',
      status: 'issued',
    }
    const savedState = {
      applications: [legacyApplication, ...demoQueueApplications],
      issuedPasses: [legacyPass, ...defaultIssuedPasses],
    }

    expect(saveDemoState(savedState).ok).toBe(true)
    const loaded = readDemoState()

    expect(loaded.persistenceStatus).toBe('ready')
    expect(loaded.applications).toContainEqual(legacyApplication)
    expect(loaded.issuedPasses).toContainEqual(legacyPass)
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('saves and restores application review history and linked passes', () => {
    const state = validWorkflow()
    const application = state.applications.find((item) => item.reference === 'APP-2026-1001')!
    application.reviewStatus = 'approved'
    application.statusHistory.unshift({
      label: 'Application approved',
      description: 'Approved for the persistence test.',
      date: '20 Oct 2026',
    })

    expect(saveDemoState(state).ok).toBe(true)
    const restored = readDemoState()
    expect(restored.persistenceStatus).toBe('ready')
    expect(restored.applications.find((item) => item.reference === application.reference)).toEqual(application)
    expect(restored.issuedPasses).toEqual(state.issuedPasses)
  })
})
