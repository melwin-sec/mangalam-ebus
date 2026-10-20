import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import StaffLoginPage from './StaffLoginPage'
import StudentLoginPage from './StudentLoginPage'

afterEach(cleanup)

describe('login pages', () => {
  it('renders student-specific content and a link back home', () => {
    render(
      <MemoryRouter>
        <StudentLoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Student sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Student identifier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(
      screen.getByText(/authentication is not connected and no credentials are transmitted or saved/i),
    ).toBeInTheDocument()
  })

  it('renders staff-specific content and a link back home', () => {
    render(
      <MemoryRouter>
        <StaffLoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Staff sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Staff identifier')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
    expect(
      screen.getByText(/authentication is not connected and no credentials are transmitted or saved/i),
    ).toBeInTheDocument()
  })
})
