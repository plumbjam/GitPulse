import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the GitPulse shell headline', () => {
    render(<App />)
    expect(screen.getByText('GitPulse')).toBeInTheDocument()
    expect(screen.getByText(/Turn GitHub activity into sound/i)).toBeInTheDocument()
  })
})
