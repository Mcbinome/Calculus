import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider } from './context/AuthContext'
import { SchemaProvider } from './context/SchemaContext'
import { AdminPage } from './pages/AdminPage'
import { CalculatorPage } from './pages/CalculatorPage'

export default function App() {
  return (
    <AuthProvider>
      <SchemaProvider>
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<CalculatorPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </SchemaProvider>
    </AuthProvider>
  )
}
