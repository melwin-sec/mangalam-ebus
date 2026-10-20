import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoginForm from './LoginForm'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('LoginForm', () => {
  it('shows required field errors associated with each empty input', async () => {
    const user = userEvent.setup()
    render(<LoginForm audience="student" identifierLabel="Student identifier" />)

    await user.click(screen.getByRole('button', { name: 'Continue as student' }))

    const identifier = screen.getByRole('textbox', { name: 'Student identifier' })
    const password = screen.getByLabelText('Password', { selector: 'input' })
    expect(identifier).toHaveAttribute('aria-invalid', 'true')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(identifier).toHaveAccessibleDescription('Enter your student identifier.')
    expect(password).toHaveAccessibleDescription('Enter your password.')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Complete the required fields to continue.',
    )
  })

  it('focuses the first missing field after an invalid submit', async () => {
    const user = userEvent.setup()
    render(<LoginForm audience="staff" identifierLabel="Staff identifier" />)
    const identifier = screen.getByRole('textbox', { name: 'Staff identifier' })

    await user.click(screen.getByRole('button', { name: 'Continue as staff' }))
    expect(identifier).toHaveFocus()

    await user.type(identifier, 'staff-reference')
    expect(identifier).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('Password', { selector: 'input' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Continue as staff' }))
    expect(screen.getByLabelText('Password', { selector: 'input' })).toHaveFocus()
  })

  it('toggles password visibility with an accessible control', async () => {
    const user = userEvent.setup()
    render(<LoginForm audience="student" identifierLabel="Student identifier" />)
    const password = screen.getByLabelText('Password', { selector: 'input' })

    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('does not imply authentication and sends, logs, or stores no credentials', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const storageMock = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => undefined)
    const logMock = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    render(<LoginForm audience="student" identifierLabel="Student identifier" />)

    await user.type(
      screen.getByRole('textbox', { name: 'Student identifier' }),
      'student-reference',
    )
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'example-only')
    await user.click(screen.getByRole('button', { name: 'Continue as student' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Authentication is not connected in this prototype. Your details were not sent or saved.',
    )
    expect(screen.queryByText(/signed in|login successful/i)).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(storageMock).not.toHaveBeenCalled()
    expect(logMock).not.toHaveBeenCalled()
  })
})
