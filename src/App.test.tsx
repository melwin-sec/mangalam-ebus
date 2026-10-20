import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
})
