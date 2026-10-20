import type { StudentStatus } from '../student/types'

export type StaffBus = {
  id: string
  identifier: string
  routeName: string
  origin: string
  destination: string
  boardingPoints: string[]
}

export type StaffStudent = {
  studentId: string
  name: string
  busId: string
  passStatus: StudentStatus
}
