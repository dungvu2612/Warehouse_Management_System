import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppProviders } from './app/providers/AppProviders'

// Entry point của ứng dụng React.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Bọc toàn app bằng các provider nền */}
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
