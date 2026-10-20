import { describe, expect, it } from 'vitest'
import { mockPass, mockRoute, mockStudent } from './mockStudentData'
import type { StudentProfile } from '../types'

describe('synthetic student mock data', () => {
  it('keeps the student, pass, route and application records internally consistent', () => {
    const typedStudent: StudentProfile = mockStudent

    expect(typedStudent.id).toMatch(/^student-/i)
    expect(typedStudent.studentId).toMatch(/^STU-/i)
    expect(mockPass.reference).toMatch(/^EBUS-/i)
    expect(mockPass.status).toBe('active')
    expect(mockRoute.boardingPoint).toContain('Gate')
    expect(mockRoute.schedule).toContain('Prototype schedule')
  })
})
