import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'

// Root component: render router của app.
function App() {
  return <RouterProvider router={router} />
}

export default App
