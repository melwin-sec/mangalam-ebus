import { BrowserRouter, Route, Routes } from 'react-router-dom'
import StaffPortalLayout from './features/staff/layouts/StaffPortalLayout'
import StaffApplicationDetailPage from './features/staff/pages/StaffApplicationDetailPage'
import StaffApplicationsPage from './features/staff/pages/StaffApplicationsPage'
import StaffBusesPage from './features/staff/pages/StaffBusesPage'
import StaffDashboardPage from './features/staff/pages/StaffDashboardPage'
import StaffRosterPage from './features/staff/pages/StaffRosterPage'
import { StudentApplicationProvider } from './features/student/context/StudentApplicationProvider'
import StudentPortalLayout from './features/student/layouts/StudentPortalLayout'
import StudentApplicationPage from './features/student/pages/StudentApplicationPage'
import StudentDashboardPage from './features/student/pages/StudentDashboardPage'
import StudentPassPage from './features/student/pages/StudentPassPage'
import StudentProfilePage from './features/student/pages/StudentProfilePage'
import StudentTransportPage from './features/student/pages/StudentTransportPage'
import AppShell from './layouts/AppShell'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import StaffLoginPage from './pages/StaffLoginPage'
import StudentLoginPage from './pages/StudentLoginPage'

function App() {
  return (
    <BrowserRouter>
      <StudentApplicationProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="student/login" element={<StudentLoginPage />} />
            <Route path="staff/login" element={<StaffLoginPage />} />
            <Route path="staff" element={<StaffPortalLayout />}>
              <Route index element={<StaffDashboardPage />} />
              <Route path="applications" element={<StaffApplicationsPage />} />
              <Route path="applications/:reference" element={<StaffApplicationDetailPage />} />
              <Route path="roster" element={<StaffRosterPage />} />
              <Route path="buses" element={<StaffBusesPage />} />
            </Route>
            <Route path="student" element={<StudentPortalLayout />}>
              <Route index element={<StudentDashboardPage />} />
              <Route path="pass" element={<StudentPassPage />} />
              <Route path="transport" element={<StudentTransportPage />} />
              <Route path="application" element={<StudentApplicationPage />} />
              <Route path="profile" element={<StudentProfilePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </StudentApplicationProvider>
    </BrowserRouter>
  )
}

export default App
