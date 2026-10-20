import { useContext } from 'react'
import { StudentApplicationContext } from './studentApplicationContext'

export function useStudentApplications() {
  const context = useContext(StudentApplicationContext)

  if (!context) {
    throw new Error('useStudentApplications must be used within StudentApplicationProvider.')
  }

  return context
}
