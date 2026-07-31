import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthProvider } from './context/AuthContext'
import { FoodsProvider } from './context/FoodsContext'
import { SchemaProvider } from './context/SchemaContext'
import { AdminPage } from './pages/AdminPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { FoodsPage } from './pages/FoodsPage'

export default function App() {
  return (
    <AuthProvider>
      <SchemaProvider>
        <FoodsProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<CalculatorPage />} />
                <Route path="/aliments" element={<FoodsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </FoodsProvider>
      </SchemaProvider>
    </AuthProvider>
  )
}
