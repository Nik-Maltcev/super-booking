import { Routes, Route, Navigate } from 'react-router-dom'
import { HomePage, BookingPage, ConfirmationPage } from '@/pages/public'
import { LawyerDashboard, SlotsManagement, LawyerAppointments } from '@/pages/lawyer'
import { AdminLawyers, AdminAppointments } from '@/pages/admin'
import { ClientDashboard } from '@/pages/client'
import { LawyerLayout, AdminLayout, ClientLayout } from '@/components/layout'
import { ProtectedRoute } from '@/components/auth'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Toaster } from '@/components/ui/sonner'

// Public layout wrapper component
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Адвокатское бюро
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/booking/:lawyerId"
          element={
            <PublicLayout>
              <BookingPage />
            </PublicLayout>
          }
        />
        <Route
          path="/confirmation/:appointmentId"
          element={
            <PublicLayout>
              <ConfirmationPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
              <LoginForm />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
              <RegisterForm />
            </div>
          }
        />

        {/* Lawyer routes (protected) */}
        <Route
          path="/lawyer"
          element={<Navigate to="/lawyer/dashboard" replace />}
        />
        <Route
          path="/lawyer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['lawyer', 'superadmin']}>
              <LawyerLayout>
                <LawyerDashboard />
              </LawyerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyer/slots"
          element={
            <ProtectedRoute allowedRoles={['lawyer', 'superadmin']}>
              <LawyerLayout>
                <SlotsManagement />
              </LawyerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyer/appointments"
          element={
            <ProtectedRoute allowedRoles={['lawyer', 'superadmin']}>
              <LawyerLayout>
                <LawyerAppointments />
              </LawyerLayout>
            </ProtectedRoute>
          }
        />

        {/* Client routes (protected) */}
        <Route
          path="/client"
          element={<Navigate to="/client/dashboard" replace />}
        />
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute allowedRoles={['client', 'lawyer', 'superadmin']}>
              <ClientLayout>
                <ClientDashboard />
              </ClientLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyer/appointments"
          element={
            <ProtectedRoute allowedRoles={['lawyer', 'superadmin']}>
              <LawyerLayout>
                <LawyerAppointments />
              </LawyerLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin routes (protected - superadmin only) */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/lawyers" replace />}
        />
        <Route
          path="/admin/lawyers"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminLayout>
                <AdminLawyers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminLayout>
                <AdminAppointments />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
