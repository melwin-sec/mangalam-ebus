import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultIssuedPasses,
  demoQueueApplications,
  isValidWorkflowState,
  readDemoState,
  saveDemoState,
  STORAGE_KEY,
  STORAGE_VERSION,
} from './demoStorage'
import type { IssuedBusPass, StudentApplication } from '../types'

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
  window.localStorage.clear()
})

describe('demo storage integrity', () => {
  it('accepts the intended default fictional workflow with linked approved passes', () => {
    expect(isValidWorkflowState(validWorkflow())).toBe(true)
  })

  it.each([
    ['empty application reference', (state: TestWorkflow) => { state.issuedPasses[0].applicationReference = '' }],
    ['nonexistent application reference', (state: TestWorkflow) => { state.issuedPasses[0].applicationReference = 'MISSING-APP' }],
    ['unapproved application', (state: TestWorkflow) => { state.applications.find((app) => app.reference === 'APP-2026-1005')!.reviewStatus = 'under_review' }],
    ['mismatched student identity', (state: TestWorkflow) => { state.issuedPasses[0].studentId = 'OTHER-STUDENT' }],
    ['mismatched student name', (state: TestWorkflow) => { state.issuedPasses[0].studentName = 'Other Student' }],
    ['mismatched route', (state: TestWorkflow) => { state.issuedPasses[0].routeName = 'West Residence Shuttle' }],
    ['mismatched boarding point', (state: TestWorkflow) => { state.issuedPasses[0].boardingPoint = 'Library Plaza Stop' }],
    ['unsupported bus', (state: TestWorkflow) => { state.issuedPasses[0].busId = 'bus-999' }],
    ['mismatched bus route', (state: TestWorkflow) => { state.issuedPasses[0].busId = 'bus-017'; state.issuedPasses[0].busIdentifier = 'E-BUS-017' }],
    ['mismatched bus identifier', (state: TestWorkflow) => { state.issuedPasses[0].busIdentifier = 'E-BUS-999' }],
    ['duplicate pass reference', (state: TestWorkflow) => { state.issuedPasses[1].reference = state.issuedPasses[0].reference }],
    ['duplicate application and student issuance', (state: TestWorkflow) => { state.issuedPasses.push({ ...state.issuedPasses[0], reference: 'EBUS-PASS-DUPLICATE' }) }],
  ])('rejects %s', (_description, corrupt) => {
    const state = validWorkflow()
    corrupt(state)
    expect(isValidWorkflowState(state)).toBe(false)
  })

  it('falls back safely and reports invalid persisted records', () => {
    const state = validWorkflow()
    state.issuedPasses[0].applicationReference = 'MISSING-APP'
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    const loaded = readDemoState()
    expect(loaded.persistenceStatus).toBe('read_failed')
    expect(loaded.applications).toEqual(demoQueueApplications)
    expect(loaded.issuedPasses).toEqual(defaultIssuedPasses)
  })

  it('saves and restores application review history and linked passes', () => {
    const state = validWorkflow()
    const application = state.applications.find((item) => item.reference === 'APP-2026-1001')!
    application.reviewStatus = 'approved'
    application.statusHistory.push({
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
