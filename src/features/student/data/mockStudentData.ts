import type { BusPass, StudentProfile, StudentRoute } from '../types'

export const mockStudent: StudentProfile = {
  id: 'student-2041',
  name: 'Aarav Nair',
  studentId: 'STU-2041',
  program: 'B.Tech. Computer Science',
  year: 'Second Year',
  hostel: 'North Block Residence',
}

export const mockPass: BusPass = {
  reference: 'EBUS-PASS-2041',
  status: 'active',
  validFrom: '01 Aug 2026',
  validTo: '31 Jul 2027',
  note: 'Prototype data — illustrative only. This record is for demo purposes and is not connected to a live transport system.',
}

export const mockRoute: StudentRoute = {
  id: 'route-12',
  name: 'North Campus Loop',
  bus: 'E-BUS-012',
  origin: 'North Gate',
  destination: 'Academic Block C',
  boardingPoint: 'Gate 2, Near Main Cycle Stand',
  schedule: 'Prototype schedule — 07:20, 08:05, 08:55, 17:15, 18:10.',
  stops: [
    {
      name: 'North Gate',
      eta: '07:20',
      note: 'Illustrative stop detail for the student portal demo.',
    },
    {
      name: 'Library Plaza',
      eta: '07:38',
      note: 'Illustrative stop detail for the student portal demo.',
    },
    {
      name: 'Academic Block C',
      eta: '08:00',
      note: 'Illustrative stop detail for the student portal demo.',
    },
  ],
}
