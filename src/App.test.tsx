import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  window.history.replaceState(null, '', '/')
})

describe('application routes', () => {
  it('renders the not-found page for an unknown path and links home', () => {
    window.history.replaceState(null, '', '/unknown-route')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Return to the landing page' }),
    ).toHaveAttribute('href', '/')
  })

  it('supports browser back and forward navigation between portal pages', async () => {
    const user = userEvent.setup()
    window.history.replaceState(null, '', '/student/login')

    render(<App />)
    await user.click(screen.getByRole('link', { name: /open student portal demo/i }))
    expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()

    window.history.back()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Student sign in' })).toBeInTheDocument()
    })

    window.history.forward()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome, aarav nair/i })).toBeInTheDocument()
    })
  })
})
