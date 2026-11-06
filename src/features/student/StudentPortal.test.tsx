import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../../App'
import { StudentApplicationProvider } from './context/StudentApplicationProvider'
import StudentApplicationPage from './pages/StudentApplicationPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import StudentPassPage from './pages/StudentPassPage'
import StaffApplicationsPage from '../staff/pages/StaffApplicationsPage'
import { mockRoute, mockStudent } from './data/mockStudentData'
import { defaultIssuedPasses, demoQueueApplications, saveDemoState } from './lib/demoStorage'

function SharedDemoWorkflowHarness() {
  return (
    <StudentApplicationProvider>
      <div>
        <MemoryRouter initialEntries={['/student/application']}>
          <Routes>
            <Route path="/student/application" element={<StudentApplicationPage />} />
          </Routes>
        </MemoryRouter>
        <MemoryRouter initialEntries={['/student/pass']}>
          <StudentPassPage />
        </MemoryRouter>
        <MemoryRouter initialEntries={['/student']}>
          <StudentDashboardPage />
        </MemoryRouter>
        <MemoryRouter initialEntries={['/staff/applications']}>
          <Routes>
            <Route path="/staff/applications" element={<StaffApplicationsPage />} />
          </Routes>
        </MemoryRouter>
      </div>
    </StudentApplicationProvider>
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('student portal foundation', () => {
  it('renders a demo-entry link from the student login page', () => {
    window.history.replaceState(null, '', '/student/login')

    render(<App />)

    const demoEntry = screen.getByRole('link', { name: /open student portal demo/i })
    expect(demoEntry).toHaveAttribute('href', '/student')
    expect(screen.getByText(/prototype demo only/i)).toBeInTheDocument()
  })

  it('renders each student portal section heading', () => {
    const routeExpectations = [
      ['/student', new RegExp(`welcome, ${mockStudent.name}`, 'i')],
      ['/student/pass', /digital bus pass/i],
      ['/student/transport', /transport information/i],
      ['/student/application', /submit a demonstration application/i],
      ['/student/profile', /profile details/i],
    ]

    for (const [route, heading] of routeExpectations as Array<[string, RegExp]>) {
      window.history.replaceState(null, '', route)
      const { unmount } = render(<App />)

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      unmount()
    }
  })

  it('opens the first-time application form for the student in the fresh default state', () => {
    window.history.replaceState(null, '', '/student/application')

    render(<App />)

    expect(screen.getByRole('heading', { name: /submit a demonstration application/i })).toBeInTheDocument()
    expect(screen.getByText(/no application exists yet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred route/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/boarding point/i)).toBeInTheDocument()
  })

  it('keeps the fresh student, dashboard, pass and staff queue state aligned', () => {
    render(<SharedDemoWorkflowHarness />)

    expect(screen.getByText(/no application exists yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a demo application/i })).toHaveAttribute(
      'href',
      '/student/application',
    )
    expect(screen.getByText(/no issued pass exists yet for this student/i)).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: mockStudent.name })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ananya Menon' })).toBeInTheDocument()
  })

  it('marks the active student navigation item reliably', () => {
    window.history.replaceState(null, '', '/student/transport')

    render(<App />)

    const nav = screen.getByRole('navigation', { name: /student portal sections/i })
    expect(within(nav).getByRole('link', { name: /transport/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('preserves the landing and staff login routes outside the portal', () => {
    window.history.replaceState(null, '', '/')
    const landing = render(<App />)
    expect(screen.getByRole('heading', { name: /your campus commute, simplified\./i })).toBeInTheDocument()
    landing.unmount()

    window.history.replaceState(null, '', '/staff/login')
    render(<App />)
    expect(screen.getByRole('heading', { name: /staff sign in/i })).toBeInTheDocument()
  })

  it('shows the student dashboard with no application or issued pass in the fresh default state', () => {
    window.history.replaceState(null, '', '/student')

    render(<App />)

    expect(
      screen.getByRole('heading', { name: `Welcome, ${mockStudent.name}` }),
    ).toBeInTheDocument()
    expect(screen.getByText('Not issued yet')).toBeInTheDocument()
    expect(screen.getByText('No application submitted yet')).toBeInTheDocument()
    expect(screen.getByText(mockRoute.bus)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.name)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.boardingPoint)).toBeInTheDocument()
    expect(screen.getByText(mockStudent.studentId)).toBeInTheDocument()

    const passCard = screen.getByRole('heading', { name: 'Digital bus pass' }).closest('article')
    expect(within(passCard!).getByText('Pending')).toBeInTheDocument()
    expect(within(passCard!).getByText(/no issued pass exists yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /submit a demo application/i })).toHaveAttribute(
      'href',
      '/student/application',
    )
  })

  it('links to each student section from the dashboard quick links', () => {
    window.history.replaceState(null, '', '/student')

    render(<App />)

    const quickLinks = [
      { label: 'View digital pass', to: '/student/pass' },
      { label: 'View transport details', to: '/student/transport' },
      { label: 'View application status', to: '/student/application' },
      { label: 'View student profile', to: '/student/profile' },
    ]
    const quickLinksNav = screen.getByRole('navigation', {
      name: 'Student dashboard quick links',
    })

    for (const { label, to } of quickLinks) {
      expect(within(quickLinksNav).getByRole('link', { name: label })).toHaveAttribute(
        'href',
        to,
      )
    }
  })

  it('handles malformed storage and unsupported schema versions safely', () => {
    window.localStorage.setItem('mangalam-ebus-demo-state', '{bad json')
    window.history.replaceState(null, '', '/student')
    render(<App />)

    expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()

    window.localStorage.setItem('mangalam-ebus-demo-state', JSON.stringify({ version: 999, applications: [], issuedPasses: [] }))
    cleanup()
    window.history.replaceState(null, '', '/student')
    render(<App />)

    expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()
  })

  it('does not overwrite invalid saved data when a workflow action follows fallback', async () => {
    const user = userEvent.setup()
    const rawSavedData = '{invalid saved data'
    window.localStorage.setItem('mangalam-ebus-demo-state', rawSavedData)
    window.history.replaceState(null, '', '/student/application')
    render(<App />)

    await user.type(screen.getByLabelText(/preferred route/i), 'North Campus Loop')
    await user.type(screen.getByLabelText(/boarding point/i), 'Gate 2, Near Main Cycle Stand')
    await user.click(screen.getByRole('button', { name: /submit demo application/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/was not submitted because it could not be saved/i)
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(rawSavedData)
  })

  it('shows a student-visible warning when storage reads fail', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read failed')
    })

    window.history.replaceState(null, '', '/student')
    render(<App />)
    expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/could not be read/i)
  })

  it('shows a student-visible warning when a workflow write fails', async () => {
    const user = userEvent.setup()
    const rawSavedState = JSON.stringify({
      version: 1,
      applications: demoQueueApplications,
      issuedPasses: defaultIssuedPasses,
    })
    window.localStorage.setItem('mangalam-ebus-demo-state', rawSavedState)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
    })
    window.history.replaceState(null, '', '/student/application')
    const firstRender = render(<App />)

    await user.type(screen.getByLabelText(/preferred route/i), 'North Campus Loop')
    await user.type(screen.getByLabelText(/boarding point/i), 'Gate 2, Near Main Cycle Stand')
    await user.click(screen.getByRole('button', { name: /submit demo application/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/was not submitted because it could not be saved/i)
    expect(screen.getByText(/storage is full/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /submit a demonstration application/i })).toBeInTheDocument()
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).toBe(rawSavedState)

    await user.click(screen.getByRole('button', { name: /submit demo application/i }))
    expect(screen.getByText('Status: Submitted')).toBeInTheDocument()
    expect(screen.queryByText(/storage is full/i)).not.toBeInTheDocument()
    firstRender.unmount()

    window.history.replaceState(null, '', '/student/application')
    render(<App />)
    expect(screen.getByText('Status: Submitted')).toBeInTheDocument()
    expect(window.localStorage.getItem('mangalam-ebus-demo-state')).not.toBe(rawSavedState)
  })

  it('labels notices as sample content and explains prototype limitations', () => {
    window.history.replaceState(null, '', '/student')

    render(<App />)

    expect(
      screen.getByText(/sample prototype content · not official announcements/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/not live service information/i)).toBeInTheDocument()
    expect(screen.getByText(/synthetic demo records/i)).toBeInTheDocument()
    expect(screen.getByText(/schedules are not live/i)).toBeInTheDocument()
  })

  it('shows the no-issued-pass state in the fresh default state', () => {
    window.history.replaceState(null, '', '/student/pass')

    render(<App />)

    const pass = screen.getByRole('article', { name: /prototype digital bus pass/i })
    expect(within(pass).getByText('Not issued')).toBeInTheDocument()
    expect(within(pass).getByText('Not yet issued')).toBeInTheDocument()
    expect(within(pass).getByText(/no issued pass exists yet for this student/i)).toBeInTheDocument()
    expect(within(pass).queryByText(mockStudent.name)).not.toBeInTheDocument()
  })

  it('shows future, active, and expired issued-pass date states', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T12:00:00Z'))

    try {
      const scenarios = [
        { validFrom: '07 Nov 2026', validTo: '31 Jul 2027', label: 'Not yet valid' },
        { validFrom: '01 Aug 2026', validTo: '31 Jul 2027', label: 'Active' },
        { validFrom: '01 Aug 2025', validTo: '05 Nov 2026', label: 'Expired' },
      ]

      for (const scenario of scenarios) {
        const applications = structuredClone(demoQueueApplications)
        const application = applications.find((item) => item.reference === 'APP-2026-1004')!
        application.studentId = mockStudent.studentId
        application.studentName = mockStudent.name
        const passes = structuredClone(defaultIssuedPasses)
        passes[0].studentId = mockStudent.studentId
        passes[0].studentName = mockStudent.name
        passes[0].validFrom = scenario.validFrom
        passes[0].validTo = scenario.validTo
        expect(saveDemoState({
          applications,
          issuedPasses: passes,
        }).ok).toBe(true)

        window.history.replaceState(null, '', '/student/pass')
        const view = render(<App />)
        const pass = screen.getByRole('article', { name: /prototype digital bus pass/i })
        expect(within(pass).getByText(scenario.label)).toBeInTheDocument()
        view.unmount()
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('prominently warns that the pass is not valid for travel and links back to the dashboard', () => {
    window.history.replaceState(null, '', '/student/pass')

    render(<App />)

    expect(
      screen.getByRole('note', { name: 'PROTOTYPE — NOT VALID FOR TRAVEL' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to dashboard/i }),
    ).toHaveAttribute('href', '/student')
    expect(screen.getByText(/no issued pass exists yet for this student/i)).toBeInTheDocument()
  })

  it('renders assigned transport information and labels all schedule data as illustrative', () => {
    window.history.replaceState(null, '', '/student/transport')

    render(<App />)

    expect(screen.getByText(mockRoute.bus)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: mockRoute.name })).toBeInTheDocument()
    expect(screen.getByText(mockRoute.boardingPoint)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.origin + ' to ' + mockRoute.destination)).toBeInTheDocument()
    for (const stop of mockRoute.stops) {
      expect(screen.getByRole('heading', { name: stop.name })).toBeInTheDocument()
      expect(screen.getByText(`Sample time: ${stop.eta}`)).toBeInTheDocument()
    }
    expect(
      screen.getByText(/sample schedule — not live operational information/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/no live tracking or service updates are available/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/student',
    )
  })

  it('renders profile fixture details and skips an absent optional contact field', () => {
    window.history.replaceState(null, '', '/student/profile')

    const { unmount } = render(<App />)

    expect(screen.getByRole('heading', { name: mockStudent.name })).toBeInTheDocument()
    expect(screen.getByText(mockStudent.studentId)).toBeInTheDocument()
    expect(screen.getByText(mockStudent.program)).toBeInTheDocument()
    expect(screen.getByText(mockStudent.year)).toBeInTheDocument()
    expect(screen.getByText(mockStudent.hostel)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.bus + ' · ' + mockRoute.name)).toBeInTheDocument()
    expect(screen.getByText(/demonstration data only/i)).toBeInTheDocument()
    expect(screen.queryByText('Emergency contact · sample')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute(
      'href',
      '/student',
    )
    unmount()
  })
})
