import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../../App'
import { StudentApplicationProvider } from './context/StudentApplicationProvider'
import { useStudentApplications } from './context/useStudentApplications'
import StudentPortalLayout from './layouts/StudentPortalLayout'
import StudentApplicationPage from './pages/StudentApplicationPage'
import StudentDashboardPage from './pages/StudentDashboardPage'
import StaffApplicationsPage from '../staff/pages/StaffApplicationsPage'
import { mockPass, mockRoute, mockStudent } from './data/mockStudentData'

function SharedDemoWorkflowHarness() {
  return (
    <StudentApplicationProvider>
      <div>
        <MemoryRouter initialEntries={['/student/application']}>
          <Routes>
            <Route path="/student/application" element={<StudentApplicationPage />} />
          </Routes>
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
      ['/student/application', /application status/i],
      ['/student/profile', /profile details/i],
    ]

    for (const [route, heading] of routeExpectations as Array<[string, RegExp]>) {
      window.history.replaceState(null, '', route)
      const { unmount } = render(<App />)

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      unmount()
    }
  })

  it('shows the seeded approved application associated with the initial student pass', () => {
    window.history.replaceState(null, '', '/student/application')

    render(<App />)

    expect(screen.getByRole('heading', { name: /application status/i })).toBeInTheDocument()
    expect(screen.getByText('Status: Approved')).toBeInTheDocument()
  })

  it('keeps the initial student application, pass, dashboard and staff queue aligned', () => {
    render(<SharedDemoWorkflowHarness />)

    const studentApplication = screen.getByText('Application reference').nextElementSibling
    expect(studentApplication).toHaveTextContent('APP-2026-1005')
    expect(screen.getByText(mockPass.reference)).toBeInTheDocument()

    const staffQueueItem = screen.getByRole('heading', { name: mockStudent.name }).closest('li')
    expect(staffQueueItem).not.toBeNull()
    expect(within(staffQueueItem!).getByText(studentApplication!.textContent ?? '')).toBeInTheDocument()
    expect(within(staffQueueItem!).getByText('Approved')).toBeInTheDocument()
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

  it('shows the expected student, pass, transport, and application summaries from mock data', () => {
    window.history.replaceState(null, '', '/student')

    render(<App />)

    expect(
      screen.getByRole('heading', { name: `Welcome, ${mockStudent.name}` }),
    ).toBeInTheDocument()
    expect(screen.getByText(mockPass.reference)).toBeInTheDocument()
    expect(screen.getByText(mockPass.validFrom)).toBeInTheDocument()
    expect(screen.getByText(mockPass.validTo)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.bus)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.name)).toBeInTheDocument()
    expect(screen.getByText(mockRoute.boardingPoint)).toBeInTheDocument()
    expect(screen.getByText(mockStudent.studentId)).toBeInTheDocument()
    expect(screen.getByText(mockPass.reference)).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()

    const passCard = screen.getByRole('heading', { name: 'Digital bus pass' }).closest('article')
    expect(within(passCard!).getByText('Active')).toBeInTheDocument()
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
    function CreateWorkflowItem() {
      const { createApplication } = useStudentApplications()
      return (
        <button
          type="button"
          onClick={() =>
            createApplication({
              routeName: 'North Campus Loop',
              boardingPoint: 'Gate 2, Near Main Cycle Stand',
              studentId: 'WRITE-FAIL-001',
              studentName: 'Write Failure Demo',
            })
          }
        >
          Create application
        </button>
      )
    }

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write failed')
    })
    const user = userEvent.setup()

    render(
      <StudentApplicationProvider>
        <MemoryRouter initialEntries={['/student']}>
          <Routes>
            <Route path="/student" element={<StudentPortalLayout />}>
              <Route index element={<CreateWorkflowItem />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </StudentApplicationProvider>,
    )

    await user.click(screen.getByRole('button', { name: /create application/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/could not save this state/i)
  })

  it('labels notices as sample content and explains prototype limitations', () => {
    window.history.replaceState(null, '', '/student')

    render(<App />)

    expect(
      screen.getByText(/sample prototype content · not official announcements/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/not live service information/i)).toBeInTheDocument()
    expect(screen.getByText(/synthetic demo records/i)).toBeInTheDocument()
    expect(screen.getByText(/not an official or valid travel pass/i)).toBeInTheDocument()
    expect(screen.getByText(/schedules are not live/i)).toBeInTheDocument()
  })

  it('renders the read-only pass details from the shared synthetic fixtures', () => {
    window.history.replaceState(null, '', '/student/pass')

    render(<App />)

    const pass = screen.getByRole('article', { name: /prototype digital bus pass/i })
    expect(within(pass).getByText(mockStudent.name)).toBeInTheDocument()
    expect(within(pass).getByText(`Student ID: ${mockStudent.studentId}`)).toBeInTheDocument()
    expect(
      within(pass).getByText(`${mockStudent.program} · ${mockStudent.year}`),
    ).toBeInTheDocument()
    expect(within(pass).getByText(mockPass.reference)).toBeInTheDocument()
    expect(within(pass).getByText('Active')).toBeInTheDocument()
    expect(within(pass).getByText(mockPass.validFrom)).toBeInTheDocument()
    expect(within(pass).getByText(mockPass.validTo)).toBeInTheDocument()
    expect(within(pass).getByText(mockRoute.bus)).toBeInTheDocument()
    expect(within(pass).getByText(mockRoute.name)).toBeInTheDocument()
    expect(
      within(pass).getByText(`Boarding point: ${mockRoute.boardingPoint}`),
    ).toBeInTheDocument()
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
    expect(
      screen.getByText(/not connected to a live transport system/i),
    ).toBeInTheDocument()
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
