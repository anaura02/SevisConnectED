import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { StudyPlanProvider } from './context/StudyPlanContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <StudyPlanProvider>
        <App />
      </StudyPlanProvider>
    </AuthProvider>
  </React.StrictMode>,
)

