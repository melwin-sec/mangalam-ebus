import type { StaffBus, StaffStudent } from '../types'

export const demoStaff = {
  name: 'Demonstration staff member',
  assignedBusId: 'bus-012',
}

export const mockStaffBuses: StaffBus[] = [
  {
    id: 'bus-012',
    identifier: 'E-BUS-012',
    routeName: 'North Campus Loop',
    origin: 'North Gate',
    destination: 'Academic Block C',
    boardingPoints: ['Gate 2, Near Main Cycle Stand'],
  },
  {
    id: 'bus-017',
    identifier: 'E-BUS-017',
    routeName: 'South Gate Connector',
    origin: 'South Gate',
    destination: 'Library Plaza',
    boardingPoints: ['Library Plaza Stop'],
  },
  {
    id: 'bus-021',
    identifier: 'E-BUS-021',
    routeName: 'West Residence Shuttle',
    origin: 'West Residence',
    destination: 'Academic Block A',
    boardingPoints: ['Residence Gate 1'],
  },
]

export const mockStaffStudents: StaffStudent[] = [
  { studentId: 'STU-2041', name: 'Aarav Nair', busId: 'bus-012', passStatus: 'active' },
  { studentId: 'DEMO-STU-002', name: 'Diya Menon', busId: 'bus-012', passStatus: 'pending' },
  { studentId: 'DEMO-STU-003', name: 'Kabir Rao', busId: 'bus-012', passStatus: 'review' },
  { studentId: 'DEMO-STU-004', name: 'Meera Iyer', busId: 'bus-012', passStatus: 'active' },
  { studentId: 'DEMO-STU-005', name: 'Ishaan Das', busId: 'bus-017', passStatus: 'active' },
  { studentId: 'DEMO-STU-006', name: 'Tara Shah', busId: 'bus-017', passStatus: 'pending' },
  { studentId: 'DEMO-STU-007', name: 'Neel Thomas', busId: 'bus-021', passStatus: 'review' },
]
