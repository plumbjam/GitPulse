import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the GitPulse shell headline', () => {
    render(<App />)
    expect(screen.getByText(/GitPulse/i)).toBeInTheDocument()
    expect(screen.getByText(/Turn GitHub activity into sound/i)).toBeInTheDocument()
  })
})
