import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../../App'
import { StudentApplicationProvider } from '../student/context/StudentApplicationProvider'
import { useStudentApplications } from '../student/context/useStudentApplications'
import type { ApplicationReviewStatus } from '../student/types'
import StudentApplicationPage from '../student/pages/StudentApplicationPage'
import StudentPassPage from '../student/pages/StudentPassPage'
import { mockStudent } from '../student/data/mockStudentData'
import StaffApplicationsPage from './pages/StaffApplicationsPage'
import StaffApplicationDetailPage from './pages/StaffApplicationDetailPage'
import { mockStaffBuses, mockStaffStudents } from './data/mockStaffData'
import type { WorkflowActionResult } from '../student/context/studentApplicationContext'
import {
  defaultIssuedPasses,
  demoQueueApplications,
  saveDemoState,
} from '../student/lib/demoStorage'

function actionValue<T>(result: WorkflowActionResult<T>): T | null {
  return result.ok ? result.value : null
}

function StaffDetailRouteHarness({ reference }: { reference: string }) {
  return (
    <StudentApplicationProvider>
      <MemoryRouter initialEntries={[`/staff/applications/${encodeURIComponent(reference)}`]}>
        <Routes>
          <Route path="/staff/applications/:reference" element={<StaffApplicationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </StudentApplicationProvider>
  )
}

function SharedStudentStaffWorkflowHarness() {
  return (
    <StudentApplicationProvider>
      <div>
        <MemoryRouter initialEntries={['/student/application']}>
          <StudentApplicationPage />
        </MemoryRouter>
        <MemoryRouter initialEntries={['/student/pass']}>
          <StudentPassPage />
        </MemoryRouter>
        <MemoryRouter initialEntries={['/staff/applications']}>
          <Routes>
            <Route path="/staff/applications" element={<StaffApplicationsPage />} />
            <Route path="/staff/applications/:reference" element={<StaffApplicationDetailPage />} />
          </Routes>
        </MemoryRouter>
      </div>
    </StudentApplicationProvider>
  )
}

function ApplicationTransitionHarness() {
  const { applications, createApplication, issuedPasses, resubmitApplication, updateApplicationStatus } =
    useStudentApplications()
  const [result, setResult] = useState('idle')

  const application = applications.find((item) => item.studentId === 'TRANSITION-TEST-001') ?? null

  if (!application) {
    return (
      <button
        type="button"
        onClick={() => {
          createApplication({
            routeName: 'North Campus Loop',
            boardingPoint: 'Gate 2, Near Main Cycle Stand',
            notes: 'Demo request',
            studentId: 'TRANSITION-TEST-001',
            studentName: 'Transition Test Student',
          })
        }}
      >
        Create application
      </button>
    )
  }

  const runTransition = (status: ApplicationReviewStatus, note: string) => {
    const updated = actionValue(updateApplicationStatus(application.reference, status, note))
    setResult(updated ? `updated:${updated.reviewStatus}` : `blocked:${application.reviewStatus}`)
  }

  return (
    <>
      <div data-testid="status">{application.reviewStatus}</div>
      <div data-testid="history-count">{application.statusHistory.length}</div>
      <div data-testid="issued-count">{issuedPasses.length}</div>
      <div data-testid="latest-history">{application.statusHistory[0].description}</div>
      <button type="button" onClick={() => runTransition('under_review', 'Review started')}>
        Start review
      </button>
      <button type="button" onClick={() => runTransition('approved', 'Approved by demo staff')}>
        Approve application
      </button>
      <button type="button" onClick={() => runTransition('corrections_requested', 'Needs route clarification')}>
        Request corrections
      </button>
      <button type="button" onClick={() => runTransition('corrections_requested', 'Request before review')}>
        Request corrections before review
      </button>
      <button type="button" onClick={() => runTransition('corrections_requested', '   ')}>
        Request corrections without explanation
      </button>
      <button type="button" onClick={() => runTransition('submitted', 'Cannot directly resubmit')}>
        Direct resubmit
      </button>
      <button
        type="button"
        onClick={() => {
          const updated = actionValue(resubmitApplication(application.reference, {
            routeName: 'North Campus Loop',
            boardingPoint: 'Library Plaza Stop',
          }))
          setResult(updated ? `updated:${updated.reviewStatus}` : `blocked:${application.reviewStatus}`)
        }}
      >
        Resubmit application
      </button>
      <button type="button" onClick={() => setResult(updateApplicationStatus('MISSING-REF', 'under_review', 'Nope').ok ? 'allowed' : 'missing')}>
        Check missing reference
      </button>
      <button type="button" onClick={() => setResult(resubmitApplication('MISSING-REF', { routeName: 'Route', boardingPoint: 'Stop' }).ok ? 'allowed' : 'missing-resubmit')}>
        Check missing resubmit reference
      </button>
      <button type="button" onClick={() => runTransition('approved', 'Invalid direct approval')}>
        Invalid direct approval
      </button>
      <div data-testid="result">{result}</div>
    </>
  )
}

function IssuePassGuardHarness({ scenario }: { scenario: string }) {
  const { applications, createApplication, issuedPasses, issuePass, updateApplicationStatus } = useStudentApplications()
  const targetStudentId = `DEMO-${scenario.toUpperCase()}-001`
  const targetApplication = applications.find((application) => application.studentId === targetStudentId)
  const [result, setResult] = useState('idle')
  const [status, setStatus] = useState('missing')
  const [historyCount, setHistoryCount] = useState(0)
  const [beforeIssuedCount, setBeforeIssuedCount] = useState(issuedPasses.length)
  const [beforeHistoryCount, setBeforeHistoryCount] = useState(0)

  const runIssuePass = () => {
    const startingIssuedCount = issuedPasses.length
    setBeforeIssuedCount(startingIssuedCount)

    const created = actionValue(createApplication({
      routeName:
        scenario === 'unapproved' || scenario === 'invalid-boarding-point'
          ? 'North Campus Loop'
          : 'West Residence Shuttle',
      boardingPoint:
        scenario === 'unapproved'
          ? 'Gate 2, Near Main Cycle Stand'
          : scenario === 'invalid-boarding-point'
            ? 'Library Plaza Stop'
            : 'Residence Gate 1',
      studentId: targetStudentId,
      studentName: `Demo ${scenario.replace('-', ' ')}`,
    }))

    if (!created) {
      setResult('blocked')
      return
    }

    setBeforeHistoryCount(created.statusHistory.length)
    setStatus(created.reviewStatus)
    setHistoryCount(created.statusHistory.length)

    if (scenario === 'unapproved') {
      const issued = actionValue(issuePass(created.reference, 'bus-012'))
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    const underReview = actionValue(updateApplicationStatus(created.reference, 'under_review', 'Review started.'))
    const approved = underReview
      ? actionValue(updateApplicationStatus(created.reference, 'approved', 'Approved by demo staff'))
      : null

    if (!approved) {
      setResult('blocked')
      return
    }

    setBeforeHistoryCount(approved.statusHistory.length)
    setStatus(approved.reviewStatus)
    setHistoryCount(approved.statusHistory.length)

    if (scenario === 'route-mismatch') {
      const issued = actionValue(issuePass(created.reference, 'bus-012'))
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'unsupported-bus') {
      const issued = actionValue(issuePass(created.reference, 'bus-999'))
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'invalid-boarding-point') {
      const issued = actionValue(issuePass(created.reference, 'bus-012'))
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'duplicate-issuance') {
      const firstIssue = actionValue(issuePass(created.reference, 'bus-021'))
      const secondIssue = actionValue(issuePass(created.reference, 'bus-021'))
      setResult(
        secondIssue ? `issued:${secondIssue.reference}` : firstIssue ? 'duplicate-blocked' : 'duplicate-blocked',
      )
      return
    }

    if (scenario === 'valid-issuance') {
      const issued = actionValue(issuePass(created.reference, 'bus-021'))
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
    }
  }

  return (
    <>
      <button type="button" onClick={runIssuePass}>Run guard scenario</button>
      <div data-testid="before-issued-count">{beforeIssuedCount}</div>
      <div data-testid="before-history-count">{beforeHistoryCount}</div>
      <div data-testid="status">{status}</div>
      <div data-testid="issued-count">{issuedPasses.length}</div>
      <div data-testid="history-count">{historyCount}</div>
      <div data-testid="actual-status">{targetApplication?.reviewStatus ?? 'missing'}</div>
      <div data-testid="actual-history-count">{targetApplication?.statusHistory.length ?? 0}</div>
      <div data-testid="result">{result}</div>
    </>
  )
}

function PersistedWorkflowHarness() {
  const { applications, createApplication, issuePass, issuedPasses, updateApplicationStatus } =
    useStudentApplications()
  const studentId = 'PERSISTED-WORKFLOW-001'
  const application = applications.find((item) => item.studentId === studentId)
  const pass = issuedPasses.find((item) => item.studentId === studentId)

  const runWorkflow = () => {
    const created = actionValue(createApplication({
      routeName: 'West Residence Shuttle',
      boardingPoint: 'Residence Gate 1',
      studentId,
      studentName: 'Persisted Workflow Demo',
    }))
    if (!created) return

    const underReview = actionValue(updateApplicationStatus(created.reference, 'under_review', 'Review started.'))
    const approved = underReview
      ? actionValue(updateApplicationStatus(created.reference, 'approved', 'Approved for the persistence test.'))
      : null
    if (approved) actionValue(issuePass(approved.reference, 'bus-021'))
  }

  return (
    <>
      <button type="button" onClick={runWorkflow}>Run persistable workflow</button>
      <div data-testid="persisted-status">{application?.reviewStatus ?? 'missing'}</div>
      <div data-testid="persisted-application-reference">{application?.reference ?? 'missing'}</div>
      <div data-testid="persisted-history-count">{application?.statusHistory.length ?? 0}</div>
      <div data-testid="persisted-pass-reference">{pass?.reference ?? 'missing'}</div>
      <div data-testid="persisted-pass-application">{pass?.applicationReference ?? 'missing'}</div>
      <div data-testid="persisted-pass-student">{pass?.studentName ?? 'missing'}</div>
      <div data-testid="persisted-pass-route">{pass?.routeName ?? 'missing'}</div>
      <div data-testid="persisted-pass-boarding">{pass?.boardingPoint ?? 'missing'}</div>
      <div data-testid="persisted-pass-bus">{pass?.busId ?? 'missing'}</div>
    </>
  )
}

function PersistenceReliabilityHarness() {
  const {
    applications,
    createApplication,
    issuePass,
    issuedPasses,
    resubmitApplication,
    updateApplicationStatus,
  } = useStudentApplications()
  const [result, setResult] = useState('idle')
  const application = applications.find((item) => item.studentId === 'RELIABILITY-STUDENT-001')

  const recordResult = (actionResult: WorkflowActionResult<{ reference: string }>) => {
    setResult(actionResult.ok ? `ok:${actionResult.value.reference}` : `failed:${actionResult.reason}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          recordResult(createApplication({
            routeName: 'West Residence Shuttle',
            boardingPoint: 'Residence Gate 1',
            studentId: 'RELIABILITY-STUDENT-001',
            studentName: 'Persistence Reliability Demo',
          }))
        }
      >
        Create reliability application
      </button>
      <button
        type="button"
        onClick={() => application && recordResult(
          updateApplicationStatus(application.reference, 'under_review', 'Review started.'),
        )}
      >
        Start reliability review
      </button>
      <button
        type="button"
        onClick={() => application && recordResult(
          updateApplicationStatus(application.reference, 'corrections_requested', 'Please confirm the stop.'),
        )}
      >
        Request reliability corrections
      </button>
      <button
        type="button"
        onClick={() => application && recordResult(
          resubmitApplication(application.reference, {
            routeName: 'West Residence Shuttle',
            boardingPoint: 'Residence Gate 1',
          }),
        )}
      >
        Resubmit reliability application
      </button>
      <button
        type="button"
        onClick={() => application && recordResult(
          updateApplicationStatus(application.reference, 'approved', 'Approved for persistence test.'),
        )}
      >
        Approve reliability application
      </button>
      <button
        type="button"
        onClick={() => application && recordResult(issuePass(application.reference, 'bus-021'))}
      >
        Issue reliability pass
      </button>
      <div data-testid="reliability-result">{result}</div>
      <div data-testid="reliability-status">{application?.reviewStatus ?? 'missing'}</div>
      <div data-testid="reliability-history">{application?.statusHistory.length ?? 0}</div>
      <div data-testid="reliability-pass-count">{issuedPasses.length}</div>
    </>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('staff transport portal', () => {
  it('renders all staff routes with their expected headings', () => {
    const routes = [
      ['/staff', 'Staff transport dashboard'],
      ['/staff/roster', 'Roster · E-BUS-012'],
      ['/staff/buses', 'Buses and route summaries'],
    ]

    for (const [route, heading] of routes) {
      window.history.replaceState(null, '', route)
      const { unmount } = render(<App />)

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      unmount()
    }
  })

  it('navigates from the dashboard to the roster and buses views', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/staff')

    render(<App />)

    await user.click(screen.getByRole('link', { name: 'View assigned-bus roster' }))
    expect(screen.getByRole('heading', { name: 'Roster · E-BUS-012' })).toBeInTheDocument()

    await user.click(
      within(screen.getByRole('navigation', { name: 'Staff portal sections' })).getByRole(
        'link',
        { name: 'Buses' },
      ),
    )
    expect(screen.getByRole('heading', { name: 'Buses and route summaries' })).toBeInTheDocument()
  })

  it('derives assigned-bus summary metrics from the demonstration roster', () => {
    window.history.replaceState(null, '', '/staff')

    render(<App />)

    expect(screen.getByText('Assigned students').parentElement).toHaveTextContent('4')
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('2')
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('1')
    expect(screen.getByText(/fictional and not operational/i)).toBeInTheDocument()
  })

  it('keeps dashboard and roster statuses consistent with an approved application awaiting issuance', () => {
    const applications = structuredClone(demoQueueApplications)
    const kabirApplication = applications.find((item) => item.reference === 'APP-2026-1001')!
    kabirApplication.studentId = 'DEMO-STU-003'
    kabirApplication.studentName = 'Kabir Rao'
    kabirApplication.reviewStatus = 'approved'
    kabirApplication.statusHistory.unshift({
      label: 'Application approved',
      description: 'Approved for the roster consistency test.',
      date: '20 Oct 2026',
    })
    expect(saveDemoState({ applications, issuedPasses: structuredClone(defaultIssuedPasses) }).ok).toBe(true)

    window.history.replaceState(null, '', '/staff/roster')
    const rosterRender = render(<App />)
    const kabir = screen.getByRole('heading', { name: 'Kabir Rao' }).closest('li')
    expect(within(kabir!).getByText('Pending')).toBeInTheDocument()
    rosterRender.unmount()

    window.history.replaceState(null, '', '/staff')
    render(<App />)
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('3')
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('0')
  })

  it('persists and restores application history and a linked issued pass after provider remount', async () => {
    const user = userEvent.setup()
    render(
      <StudentApplicationProvider>
        <PersistedWorkflowHarness />
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /run persistable workflow/i }))
    expect(screen.getByTestId('persisted-status')).toHaveTextContent('approved')
    expect(screen.getByTestId('persisted-history-count')).toHaveTextContent('3')
    expect(screen.getByTestId('persisted-pass-reference')).not.toHaveTextContent('missing')
    expect(screen.getByTestId('persisted-pass-student')).toHaveTextContent('Persisted Workflow Demo')
    expect(screen.getByTestId('persisted-pass-route')).toHaveTextContent('West Residence Shuttle')
    expect(screen.getByTestId('persisted-pass-boarding')).toHaveTextContent('Residence Gate 1')
    expect(screen.getByTestId('persisted-pass-bus')).toHaveTextContent('bus-021')

    const rawState = window.localStorage.getItem('mangalam-ebus-demo-state')
    expect(rawState).not.toBeNull()
    cleanup()

    render(
      <StudentApplicationProvider>
        <PersistedWorkflowHarness />
      </StudentApplicationProvider>,
    )
    expect(screen.getByTestId('persisted-status')).toHaveTextContent('approved')
    expect(screen.getByTestId('persisted-history-count')).toHaveTextContent('3')
    expect(screen.getByTestId('persisted-pass-application')).not.toHaveTextContent('missing')
    expect(screen.getByTestId('persisted-pass-application')).toHaveTextContent(
      screen.getByTestId('persisted-application-reference').textContent ?? '',
    )
    expect(screen.getByTestId('persisted-pass-student')).toHaveTextContent('Persisted Workflow Demo')
  })

  it('completes the student lifecycle through the student and staff UI and restores it after remount', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    let view = render(<SharedStudentStaffWorkflowHarness />)

    await user.type(screen.getByLabelText(/preferred route/i), 'North Campus Loop')
    await user.type(screen.getByLabelText(/boarding point/i), 'Gate 2, Near Main Cycle Stand')
    await user.click(screen.getByRole('button', { name: /submit demo application/i }))

    expect(screen.getByText('Status: Submitted')).toBeInTheDocument()
    const applicationReference = screen.getByText('Application reference').nextElementSibling?.textContent
    expect(applicationReference).toMatch(/^APP-/)
    const queueItem = screen.getByRole('heading', { name: mockStudent.name }).closest('li')
    expect(queueItem).not.toBeNull()
    expect(within(queueItem!).getByText(applicationReference!)).toBeInTheDocument()
    expect(within(queueItem!).getByText('Submitted')).toBeInTheDocument()

    await user.click(within(queueItem!).getByRole('link', { name: /view application/i }))
    await user.click(screen.getByRole('button', { name: /start review/i }))
    await user.type(
      screen.getByLabelText(/review note/i),
      'Please add a note confirming the requested boarding point.',
    )
    await user.click(screen.getByRole('button', { name: /request corrections/i }))

    expect(screen.getByText('Status: Corrections Requested')).toBeInTheDocument()
    expect(
      screen.getAllByText(/please add a note confirming the requested boarding point/i).length,
    ).toBeGreaterThan(0)
    view.unmount()
    view = render(<SharedStudentStaffWorkflowHarness />)

    expect(screen.getByText('Status: Corrections Requested')).toBeInTheDocument()
    expect(
      screen.getAllByText(/please add a note confirming the requested boarding point/i).length,
    ).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /edit and resubmit/i }))
    await user.type(
      screen.getByLabelText(/notes for the demo review team/i),
      'Updated details for the demonstration request.',
    )
    await user.click(screen.getByRole('button', { name: /resubmit demo application/i }))

    expect(screen.getByText('Status: Submitted')).toBeInTheDocument()
    expect(screen.getAllByText(/application resubmitted/i).length).toBeGreaterThan(0)
    view.unmount()
    view = render(<SharedStudentStaffWorkflowHarness />)

    expect(screen.getByText('Status: Submitted')).toBeInTheDocument()
    expect(screen.getAllByText(/application resubmitted/i).length).toBeGreaterThan(0)
    const resubmittedQueueItem = screen
      .getByRole('heading', { name: mockStudent.name })
      .closest('li')
    await user.click(within(resubmittedQueueItem!).getByRole('link', { name: /view application/i }))
    await user.click(screen.getByRole('button', { name: /start review/i }))
    await user.click(screen.getByRole('button', { name: /approve demo application/i }))

    expect(screen.getByText('Status: Approved')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /issue demo pass/i })).toBeInTheDocument()
    const passArticle = screen.getByRole('article', { name: /prototype digital bus pass/i })
    expect(within(passArticle).getByText(/no issued pass exists yet/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /issue demo pass/i }))

    expect(within(passArticle).getByText('Active')).toBeInTheDocument()
    const issuedPassReference = within(passArticle).getByText(/^EBUS-PASS-/).textContent
    expect(issuedPassReference).toMatch(/^EBUS-PASS-/)

    view.unmount()
    render(<SharedStudentStaffWorkflowHarness />)

    expect(screen.getByText('Status: Approved')).toBeInTheDocument()
    expect(screen.getAllByText(applicationReference!).length).toBeGreaterThan(0)
    const restoredPass = screen.getByRole('article', { name: /prototype digital bus pass/i })
    expect(within(restoredPass).getByText(issuedPassReference!)).toBeInTheDocument()
    expect(within(restoredPass).getByText(mockStudent.name)).toBeInTheDocument()
    const restoredQueue = screen.getByRole('list', { name: 'Demo application review queue' })
    const restoredQueueItem = within(restoredQueue)
      .getByRole('heading', { name: mockStudent.name })
      .closest('li')
    expect(within(restoredQueueItem!).getByText('Approved')).toBeInTheDocument()
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/i)
  }, 20000)

  it('keeps every workflow operation persistence-first and allows retry after failed writes', async () => {
    const user = userEvent.setup()
    expect(saveDemoState({
      applications: structuredClone(demoQueueApplications),
      issuedPasses: structuredClone(defaultIssuedPasses),
    }).ok).toBe(true)
    let persistedValue = window.localStorage.getItem('mangalam-ebus-demo-state')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const failNextWrite = () => {
      setItemSpy.mockImplementationOnce(() => {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
      })
    }

    let view = render(
      <StudentApplicationProvider>
        <PersistenceReliabilityHarness />
      </StudentApplicationProvider>,
    )

    const expectFailedOperation = async (
      buttonName: RegExp,
      expectedStatus: string,
      expectedHistory: string,
      expectedPassCount: string,
    ) => {
      failNextWrite()
      await user.click(screen.getByRole('button', { name: buttonName }))
      expect(screen.getByTestId('reliability-result')).toHaveTextContent('failed:persistence')
      expect(screen.getByTestId('reliability-status')).toHaveTextContent(expectedStatus)
      expect(screen.getByTestId('reliability-history')).toHaveTextContent(expectedHistory)
      expect(screen.getByTestId('reliability-pass-count')).toHaveTextContent(expectedPassCount)
      expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(persistedValue)
    }

    const expectSuccessfulRetry = async (buttonName: RegExp, expectedStatus: string) => {
      await user.click(screen.getByRole('button', { name: buttonName }))
      expect(screen.getByTestId('reliability-result')).toHaveTextContent(/^ok:/)
      expect(screen.getByTestId('reliability-status')).toHaveTextContent(expectedStatus)
      persistedValue = window.localStorage.getItem('mangalam-ebus-demo-state')
      expect(persistedValue).not.toBeNull()
    }

    await expectFailedOperation(/create reliability application/i, 'missing', '0', '1')
    await expectSuccessfulRetry(/create reliability application/i, 'submitted')

    await expectFailedOperation(/start reliability review/i, 'submitted', '1', '1')
    await expectSuccessfulRetry(/start reliability review/i, 'under_review')

    await expectFailedOperation(/request reliability corrections/i, 'under_review', '2', '1')
    await expectSuccessfulRetry(/request reliability corrections/i, 'corrections_requested')

    await expectFailedOperation(/resubmit reliability application/i, 'corrections_requested', '3', '1')
    await expectSuccessfulRetry(/resubmit reliability application/i, 'submitted')

    await user.click(screen.getByRole('button', { name: /start reliability review/i }))
    expect(screen.getByTestId('reliability-status')).toHaveTextContent('under_review')
    persistedValue = window.localStorage.getItem('mangalam-ebus-demo-state')

    await expectFailedOperation(/approve reliability application/i, 'under_review', '5', '1')
    await expectSuccessfulRetry(/approve reliability application/i, 'approved')

    await expectFailedOperation(/issue reliability pass/i, 'approved', '6', '1')
    await expectSuccessfulRetry(/issue reliability pass/i, 'approved')
    expect(screen.getByTestId('reliability-pass-count')).toHaveTextContent('2')

    view.unmount()
    view = render(
      <StudentApplicationProvider>
        <PersistenceReliabilityHarness />
      </StudentApplicationProvider>,
    )
    expect(screen.getByTestId('reliability-status')).toHaveTextContent('approved')
    expect(screen.getByTestId('reliability-history')).toHaveTextContent('6')
    expect(screen.getByTestId('reliability-pass-count')).toHaveTextContent('2')
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(persistedValue)
    view.unmount()
  })

  it('does not report pass issuance success until the pass is saved', async () => {
    const user = userEvent.setup()
    const applications = structuredClone(demoQueueApplications)
    const application = applications.find((item) => item.reference === 'APP-2026-1003')!
    application.studentId = mockStudent.studentId
    application.studentName = mockStudent.name
    expect(saveDemoState({
      applications,
      issuedPasses: structuredClone(defaultIssuedPasses),
    }).ok).toBe(true)
    const persistedValue = window.localStorage.getItem('mangalam-ebus-demo-state')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    })

    window.history.replaceState(null, '', `/staff/applications/${application.reference}`)
    const firstRender = render(<StaffDetailRouteHarness reference={application.reference} />)
    expect(screen.getByRole('button', { name: /issue demo pass/i })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: 'Issued pass' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /issue demo pass/i }))

    expect(setItemSpy).toHaveBeenCalledOnce()
    expect(setItemSpy.mock.results[0]?.type).toBe('throw')
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(persistedValue)
    expect(screen.getByRole('status')).toHaveTextContent(/demo pass was not issued because it could not be saved/i)
    expect(screen.getByRole('status')).not.toHaveTextContent(/demo pass ebus-pass-.* issued/i)
    expect(screen.queryByRole('heading', { name: 'Issued pass' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /issue demo pass/i }))
    expect(screen.getByRole('heading', { name: 'Issued pass' })).toBeInTheDocument()
    firstRender.unmount()

    const restoredRender = render(<StaffDetailRouteHarness reference={application.reference} />)
    expect(screen.getByRole('heading', { name: 'Issued pass' })).toBeInTheDocument()
    expect(screen.getByText(mockStudent.name)).toBeInTheDocument()
    restoredRender.unmount()
  }, 20000)

  it('cancels reset without changing the saved workflow', async () => {
    const user = userEvent.setup()
    const applications = structuredClone(demoQueueApplications)
    const kabirApplication = applications[0]
    kabirApplication.studentId = 'DEMO-STU-003'
    kabirApplication.studentName = 'Kabir Rao'
    kabirApplication.reviewStatus = 'approved'
    kabirApplication.statusHistory.unshift({
      label: 'Application approved',
      description: 'Approved before canceling reset.',
      date: '20 Oct 2026',
    })
    expect(saveDemoState({ applications, issuedPasses: structuredClone(defaultIssuedPasses) }).ok).toBe(true)
    const rawState = window.localStorage.getItem('mangalam-ebus-demo-state')
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    window.history.replaceState(null, '', '/staff')

    render(<App />)
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))

    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(rawState)
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('3')
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('0')
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('confirms reset, restores defaults, and keeps defaults after remount', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('mangalam-ebus-demo-state', JSON.stringify({
      version: 999,
      applications: [],
      issuedPasses: [],
    }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    window.history.replaceState(null, '', '/staff')

    const firstRender = render(<App />)
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBeNull()
    firstRender.unmount()

    window.history.replaceState(null, '', '/staff')
    render(<App />)
    expect(screen.getByText('Assigned students').parentElement).toHaveTextContent('4')
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('2')
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('reports a failed storage clear during confirmed reset', async () => {
    const user = userEvent.setup()
    const applications = structuredClone(demoQueueApplications)
    applications[0].studentId = mockStudent.studentId
    applications[0].studentName = mockStudent.name
    const storedState = JSON.stringify({
      version: 1,
      applications,
      issuedPasses: structuredClone(defaultIssuedPasses),
    })
    window.localStorage.setItem('mangalam-ebus-demo-state', storedState)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('clear failed')
    })
    window.history.replaceState(null, '', '/staff')

    render(<App />)
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/could not clear the stored demo data/i)
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(storedState)
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: /reset demo data/i }))
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBeNull()
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('2')
  })

  it('searches the assigned-bus roster by student ID and name', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/staff/roster')

    render(<App />)

    const search = screen.getByRole('searchbox', { name: 'Search by student name or ID' })
    await user.type(search, 'DEMO-STU-002')
    expect(screen.getByRole('heading', { name: 'Diya Menon' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aarav Nair' })).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'Kabir')
    expect(screen.getByRole('heading', { name: 'Kabir Rao' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Diya Menon' })).not.toBeInTheDocument()
  })

  it('filters by supported pass status and reports when there are no matches', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/staff/roster')

    render(<App />)

    const statusFilter = screen.getByRole('combobox', { name: 'Filter by pass status' })
    await user.selectOptions(statusFilter, 'active')

    const roster = screen.getByRole('list', { name: 'E-BUS-012 student roster' })
    expect(within(roster).queryByRole('heading', { name: 'Aarav Nair' })).not.toBeInTheDocument()
    expect(within(roster).getByRole('heading', { name: 'Meera Iyer' })).toBeInTheDocument()
    expect(within(roster).queryByRole('heading', { name: 'Diya Menon' })).not.toBeInTheDocument()

    await user.selectOptions(statusFilter, 'review')
    expect(screen.getByRole('heading', { name: 'Kabir Rao' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aarav Nair' })).not.toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Search by student name or ID' }), 'no match')
    expect(screen.getByRole('heading', { name: 'No students found' })).toBeInTheDocument()
    expect(
      screen.getByText(/try another name or student id, or change the pass-status filter/i),
    ).toBeInTheDocument()
  })

  it('combines roster search with status filtering and clears the search back to the filtered set', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/staff/roster')

    render(<App />)

    const statusFilter = screen.getByRole('combobox', { name: 'Filter by pass status' })
    const search = screen.getByRole('searchbox', { name: 'Search by student name or ID' })

    await user.selectOptions(statusFilter, 'active')
    await user.type(search, 'meer')
    expect(screen.getByRole('heading', { name: 'Meera Iyer' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aarav Nair' })).not.toBeInTheDocument()

    await user.clear(search)
    expect(screen.getByRole('heading', { name: 'Meera Iyer' })).toBeInTheDocument()
  })

  it('reconciles each bus summary with its roster totals and statuses', () => {
    window.history.replaceState(null, '', '/staff/buses')

    render(<App />)

    for (const bus of mockStaffBuses) {
      const busStudents = mockStaffStudents.filter((student) => student.busId === bus.id)
      const statusCounts: Record<'active' | 'pending' | 'review', number> = busStudents.reduce(
        (counts, student) => {
          counts[student.passStatus] += 1
          return counts
        },
        { active: 0, pending: 0, review: 0 },
      )

      const card = screen.getByRole('heading', { name: bus.identifier }).closest('li')
      expect(card).not.toBeNull()
      expect(card).toHaveTextContent(bus.routeName)
      expect(card).toHaveTextContent(String(busStudents.length))
      expect(card).toHaveTextContent(String(statusCounts.active))
      expect(card).toHaveTextContent(String(statusCounts.pending))
      expect(card).toHaveTextContent(String(statusCounts.review))
    }
  })

  it('opens the selected bus roster from the coordinator-style view', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/staff/buses')

    render(<App />)

    expect(screen.getByText(/does not represent real coordinator permissions/i)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'View E-BUS-017 roster' }))

    expect(screen.getByRole('heading', { name: 'Roster · E-BUS-017' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ishaan Das' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aarav Nair' })).not.toBeInTheDocument()
  })

  it('shows an explicit message for an unknown bus selection', () => {
    window.history.replaceState(null, '', '/staff/roster?bus=unknown-bus')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Bus not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to buses' })).toHaveAttribute(
      'href',
      '/staff/buses',
    )
  })

  it('enforces each allowed transition and keeps history unchanged for invalid actions', async () => {
    const user = userEvent.setup()

    render(
      <StudentApplicationProvider>
        <ApplicationTransitionHarness />
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /create application/i }))
    expect(screen.getByTestId('status')).toHaveTextContent('submitted')
    expect(screen.getByTestId('history-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /request corrections without explanation/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:submitted')
    expect(screen.getByTestId('history-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /request corrections before review/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:submitted')
    expect(screen.getByTestId('history-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /direct resubmit/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:submitted')

    await user.click(screen.getByRole('button', { name: /start review/i }))
    expect(screen.getByTestId('status')).toHaveTextContent('under_review')
    expect(screen.getByTestId('history-count')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: /start review/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:under_review')
    expect(screen.getByTestId('history-count')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: /request corrections without explanation/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:under_review')
    expect(screen.getByTestId('history-count')).toHaveTextContent('2')

    await user.click(screen.getByRole('button', { name: /^request corrections$/i }))
    expect(screen.getByTestId('status')).toHaveTextContent('corrections_requested')
    expect(screen.getByTestId('history-count')).toHaveTextContent('3')
    expect(screen.getByTestId('latest-history')).toHaveTextContent('Needs route clarification')

    await user.click(screen.getByRole('button', { name: /approve application/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:corrections_requested')
    expect(screen.getByTestId('history-count')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: /direct resubmit/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:corrections_requested')
    expect(screen.getByTestId('history-count')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: /resubmit application/i }))
    expect(screen.getByTestId('status')).toHaveTextContent('submitted')
    expect(screen.getByTestId('history-count')).toHaveTextContent('4')

    await user.click(screen.getByRole('button', { name: /invalid direct approval/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:submitted')
    expect(screen.getByTestId('history-count')).toHaveTextContent('4')

    await user.click(screen.getByRole('button', { name: /start review/i }))
    await user.click(screen.getByRole('button', { name: /approve application/i }))
    expect(screen.getByTestId('status')).toHaveTextContent('approved')
    expect(screen.getByTestId('history-count')).toHaveTextContent('6')
    expect(screen.getByTestId('issued-count')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: /^request corrections$/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:approved')
    expect(screen.getByTestId('history-count')).toHaveTextContent('6')

    await user.click(screen.getByRole('button', { name: /start review/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('blocked:approved')
    expect(screen.getByTestId('history-count')).toHaveTextContent('6')

    await user.click(screen.getByRole('button', { name: /check missing reference/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('missing')

    await user.click(screen.getByRole('button', { name: /check missing resubmit reference/i }))
    expect(screen.getByTestId('result')).toHaveTextContent('missing-resubmit')
    expect(screen.getByTestId('history-count')).toHaveTextContent('6')
  })

  it('requires a meaningful explanation before requesting corrections', async () => {
    const user = userEvent.setup()

    render(<StaffDetailRouteHarness reference="APP-2026-1001" />)

    await user.click(screen.getByRole('button', { name: /request corrections/i }))
    expect(
      screen.getByText(/please explain what needs to be corrected before requesting changes/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.type(screen.getByLabelText(/review note/i), '   ')
    await user.click(screen.getByRole('button', { name: /request corrections/i }))
    expect(
      screen.getByText(/please explain what needs to be corrected before requesting changes/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.clear(screen.getByLabelText(/review note/i))
    await user.type(screen.getByLabelText(/review note/i), 'Please confirm the boarding point before resubmission.')
    await user.click(screen.getByRole('button', { name: /^request corrections$/i }))
    expect(screen.getByText('Corrections requested')).toBeInTheDocument()
  })

  it('lets a student edit and resubmit after a correction request', async () => {
    const user = userEvent.setup()
    const applications = structuredClone(demoQueueApplications)
    const application = applications.find((item) => item.reference === 'APP-2026-1001')!
    application.studentId = mockStudent.studentId
    application.studentName = mockStudent.name
    application.reviewStatus = 'corrections_requested'
    application.nextAction = 'Please confirm the boarding point before resubmission.'
    application.statusHistory.unshift({
      label: 'Corrections requested',
      description: application.nextAction,
      date: '20 Oct 2026',
    })
    const passes = structuredClone(defaultIssuedPasses).filter(
      (pass) => pass.studentId !== application.studentId,
    )
    expect(saveDemoState({ applications, issuedPasses: passes }).ok).toBe(true)
    window.history.replaceState(null, '', '/student/application')
    render(<App />)

    await user.click(screen.getByRole('button', { name: /edit and resubmit/i }))
    expect(screen.getByRole('heading', { name: /update your demonstration application/i })).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/boarding point/i))
    await user.type(screen.getByLabelText(/boarding point/i), 'Library Plaza Stop')
    await user.click(screen.getByRole('button', { name: /resubmit demo application/i }))

    expect(screen.getByRole('heading', { name: /application status/i })).toBeInTheDocument()
    expect(screen.getByText(/application resubmitted/i)).toBeInTheDocument()
  })

  it('keeps application references unique and ignores missing application references', async () => {
    const user = userEvent.setup()

    function ReferenceHarness() {
      const { applications, createApplication } = useStudentApplications()
      const [references, setReferences] = useState<string[]>([])

      return (
        <>
          <button
            type="button"
            onClick={() => {
              const result = createApplication({
                routeName: 'North Campus Loop',
                boardingPoint: 'Gate 2, Near Main Cycle Stand',
                studentId: 'REFERENCE-TEST-001',
                studentName: 'Reference Test Student',
              })
              if (result.ok) {
                setReferences((current) => [...current, result.value.reference])
              }
            }}
          >
            Create application
          </button>
          <div data-testid="references">{references.join(',')}</div>
          <div data-testid="all-references">
            {applications.map((application) => application.reference).join(',')}
          </div>
        </>
      )
    }

    render(
      <StudentApplicationProvider>
        <ReferenceHarness />
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /create application/i }))
    await user.click(screen.getByRole('button', { name: /create application/i }))

    const references = screen.getByTestId('references').textContent?.split(',').filter(Boolean)
    expect(references).toHaveLength(1)
    expect(new Set(references).size).toBe(1)
    const allReferences = screen.getByTestId('all-references').textContent?.split(',').filter(Boolean)
    expect(new Set(allReferences).size).toBe(allReferences?.length)
  })

  it('rejects unapproved, mismatched, unsupported, and invalid boarding-point issuance attempts without mutating state', async () => {
    const user = userEvent.setup()
    const scenarios = ['unapproved', 'route-mismatch', 'unsupported-bus', 'invalid-boarding-point'] as const

    for (const scenario of scenarios) {
      const { unmount } = render(
        <StudentApplicationProvider>
          <IssuePassGuardHarness scenario={scenario} />
        </StudentApplicationProvider>,
      )

      await user.click(screen.getByRole('button', { name: /run guard scenario/i }))

      const beforeIssuedCount = Number(screen.getByTestId('before-issued-count').textContent)
      const beforeHistoryCount = Number(screen.getByTestId('before-history-count').textContent)

      expect(screen.getByTestId('result')).toHaveTextContent('blocked')
      expect(screen.getByTestId('issued-count')).toHaveTextContent(String(beforeIssuedCount))
      expect(screen.getByTestId('history-count')).toHaveTextContent(String(beforeHistoryCount))
      expect(screen.getByTestId('status')).toHaveTextContent(
        scenario === 'unapproved' ? 'submitted' : 'approved',
      )
      expect(screen.getByTestId('actual-status')).toHaveTextContent(
        scenario === 'unapproved' ? 'submitted' : 'approved',
      )
      expect(screen.getByTestId('actual-history-count')).toHaveTextContent(String(beforeHistoryCount))
      unmount()
    }
  })

  it('rejects duplicate issuance and preserves application review history', async () => {
    const user = userEvent.setup()

    render(
      <StudentApplicationProvider>
        <IssuePassGuardHarness scenario="duplicate-issuance" />
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /run guard scenario/i }))

    const beforeIssuedCount = Number(screen.getByTestId('before-issued-count').textContent)
    const beforeHistoryCount = Number(screen.getByTestId('before-history-count').textContent)

    expect(screen.getByTestId('result')).toHaveTextContent('duplicate-blocked')
    expect(screen.getByTestId('status')).toHaveTextContent('approved')
    expect(screen.getByTestId('history-count')).toHaveTextContent(String(beforeHistoryCount))
    expect(screen.getByTestId('actual-status')).toHaveTextContent('approved')
    expect(screen.getByTestId('actual-history-count')).toHaveTextContent(String(beforeHistoryCount))
    expect(screen.getByTestId('issued-count')).toHaveTextContent(String(beforeIssuedCount + 1))
  })

  it('issues exactly one valid pass for an approved application without changing application status or history', async () => {
    const user = userEvent.setup()

    render(
      <StudentApplicationProvider>
        <IssuePassGuardHarness scenario="valid-issuance" />
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /run guard scenario/i }))

    const beforeIssuedCount = Number(screen.getByTestId('before-issued-count').textContent)
    const beforeHistoryCount = Number(screen.getByTestId('before-history-count').textContent)

    expect(screen.getByTestId('result')).toHaveTextContent('issued:EBUS-PASS-')
    expect(screen.getByTestId('status')).toHaveTextContent('approved')
    expect(screen.getByTestId('history-count')).toHaveTextContent(String(beforeHistoryCount))
    expect(screen.getByTestId('actual-status')).toHaveTextContent('approved')
    expect(screen.getByTestId('actual-history-count')).toHaveTextContent(String(beforeHistoryCount))
    expect(screen.getByTestId('issued-count')).toHaveTextContent(String(beforeIssuedCount + 1))
  })

  it('preserves student routes and staff login prototype behavior', () => {
    window.history.replaceState(null, '', '/student')
    const studentView = render(<App />)
    expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()
    studentView.unmount()

    window.history.replaceState(null, '', '/staff/login')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument()
    expect(
      screen.getByText(/authentication is not connected and no credentials are transmitted or saved/i),
    ).toBeInTheDocument()
  })
})
