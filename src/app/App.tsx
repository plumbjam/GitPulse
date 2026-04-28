import { Providers } from '@/app/providers'
import { AppShell } from '@/components/layout/AppShell'

function App() {
  return (
    <Providers>
      <div className="min-h-screen bg-background bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
        <AppShell />
      </div>
    </Providers>
  )
}

export default App
