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
import StaffApplicationDetailPage from './pages/StaffApplicationDetailPage'
import { mockStaffBuses, mockStaffStudents } from './data/mockStaffData'
import {
  defaultIssuedPasses,
  demoQueueApplications,
  saveDemoState,
} from '../student/lib/demoStorage'

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
    const updated = updateApplicationStatus(application.reference, status, note)
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
          const updated = resubmitApplication(application.reference, {
            routeName: 'North Campus Loop',
            boardingPoint: 'Library Plaza Stop',
          })
          setResult(updated ? `updated:${updated.reviewStatus}` : `blocked:${application.reviewStatus}`)
        }}
      >
        Resubmit application
      </button>
      <button type="button" onClick={() => setResult(updateApplicationStatus('MISSING-REF', 'under_review', 'Nope') ? 'allowed' : 'missing')}>
        Check missing reference
      </button>
      <button type="button" onClick={() => setResult(resubmitApplication('MISSING-REF', { routeName: 'Route', boardingPoint: 'Stop' }) ? 'allowed' : 'missing-resubmit')}>
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

    const created = createApplication({
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
    })

    if (!created) {
      setResult('blocked')
      return
    }

    setBeforeHistoryCount(created.statusHistory.length)
    setStatus(created.reviewStatus)
    setHistoryCount(created.statusHistory.length)

    if (scenario === 'unapproved') {
      const issued = issuePass(created.reference, 'bus-012')
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    const underReview = updateApplicationStatus(created.reference, 'under_review', 'Review started.')
    const approved = underReview
      ? updateApplicationStatus(created.reference, 'approved', 'Approved by demo staff')
      : null

    if (!approved) {
      setResult('blocked')
      return
    }

    setBeforeHistoryCount(approved.statusHistory.length)
    setStatus(approved.reviewStatus)
    setHistoryCount(approved.statusHistory.length)

    if (scenario === 'route-mismatch') {
      const issued = issuePass(created.reference, 'bus-012')
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'unsupported-bus') {
      const issued = issuePass(created.reference, 'bus-999')
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'invalid-boarding-point') {
      const issued = issuePass(created.reference, 'bus-012')
      setResult(issued ? `issued:${issued.reference}` : 'blocked')
      return
    }

    if (scenario === 'duplicate-issuance') {
      const firstIssue = issuePass(created.reference, 'bus-021')
      const secondIssue = issuePass(created.reference, 'bus-021')
      setResult(
        secondIssue ? `issued:${secondIssue.reference}` : firstIssue ? 'duplicate-blocked' : 'duplicate-blocked',
      )
      return
    }

    if (scenario === 'valid-issuance') {
      const issued = issuePass(created.reference, 'bus-021')
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
    const created = createApplication({
      routeName: 'West Residence Shuttle',
      boardingPoint: 'Residence Gate 1',
      studentId,
      studentName: 'Persisted Workflow Demo',
    })
    if (!created) return

    const underReview = updateApplicationStatus(created.reference, 'under_review', 'Review started.')
    const approved = underReview
      ? updateApplicationStatus(created.reference, 'approved', 'Approved for the persistence test.')
      : null
    if (approved) issuePass(approved.reference, 'bus-021')
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
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('2')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('1')
    expect(screen.getByText('Under review').parentElement).toHaveTextContent('1')
    expect(screen.getByText(/fictional and not operational/i)).toBeInTheDocument()
  })

  it('keeps dashboard and roster statuses consistent with an approved application awaiting issuance', () => {
    const applications = structuredClone(demoQueueApplications)
    const kabirApplication = applications.find((item) => item.reference === 'APP-2026-1001')!
    kabirApplication.studentId = 'DEMO-STU-003'
    kabirApplication.studentName = 'Kabir Rao'
    kabirApplication.reviewStatus = 'approved'
    kabirApplication.statusHistory.push({
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
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('2')
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('2')
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

  it('cancels reset without changing the saved workflow', async () => {
    const user = userEvent.setup()
    const applications = structuredClone(demoQueueApplications)
    const kabirApplication = applications[0]
    kabirApplication.studentId = 'DEMO-STU-003'
    kabirApplication.studentName = 'Kabir Rao'
    kabirApplication.reviewStatus = 'approved'
    kabirApplication.statusHistory.push({
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
    expect(screen.getByText('Pending passes').parentElement).toHaveTextContent('2')
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
    expect(screen.getByText('Active passes').parentElement).toHaveTextContent('2')
    expect(window.confirm).toHaveBeenCalledOnce()
  })

  it('reports a failed storage clear during confirmed reset', async () => {
    const user = userEvent.setup()
    const storedState = JSON.stringify({ version: 1, applications: [], issuedPasses: [] })
    window.localStorage.setItem('mangalam-ebus-demo-state', storedState)
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('clear failed')
    })
    window.history.replaceState(null, '', '/staff')

    render(<App />)
    await user.click(screen.getByRole('button', { name: /reset demo data/i }))

    expect(screen.getByRole('status')).toHaveTextContent(/could not clear the stored demo data/i)
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(storedState)
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
    expect(within(roster).getByRole('heading', { name: 'Aarav Nair' })).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: 'Aarav Nair' })).toBeInTheDocument()
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
    expect(screen.getByTestId('issued-count')).toHaveTextContent('2')

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
    const application = applications.find((item) => item.reference === 'APP-2026-1005')!
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
              const created = createApplication({
                routeName: 'North Campus Loop',
                boardingPoint: 'Gate 2, Near Main Cycle Stand',
                studentId: 'REFERENCE-TEST-001',
                studentName: 'Reference Test Student',
              })
              if (created) {
                setReferences((current) => [...current, created.reference])
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
