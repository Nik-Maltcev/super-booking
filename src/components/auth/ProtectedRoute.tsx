import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuthContext()
  const location = useLocation()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has required role
  if (role && !allowedRoles.includes(role)) {
    // Superadmin has access to all routes
    if (role === 'superadmin') {
      return <>{children}</>
    }

    // Lawyer trying to access superadmin routes - redirect to lawyer dashboard
    if (role === 'lawyer') {
      return <Navigate to="/lawyer/dashboard" replace />
    }

    // Client trying to access protected routes - redirect to home
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Helper function for route protection logic (useful for testing)
export function getRouteRedirect(
  isAuthenticated: boolean,
  userRole: UserRole | null,
  allowedRoles: UserRole[]
): 'allow' | 'login' | 'lawyer-dashboard' | 'home' {
  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return 'login'
  }

  // No role found - redirect to login
  if (!userRole) {
    return 'login'
  }

  // Superadmin has access to all protected routes
  if (userRole === 'superadmin') {
    return 'allow'
  }

  // Check if user role is in allowed roles
  if (allowedRoles.includes(userRole)) {
    return 'allow'
  }

  // Lawyer trying to access superadmin routes
  if (userRole === 'lawyer') {
    return 'lawyer-dashboard'
  }

  // Default - redirect to home
  return 'home'
}
