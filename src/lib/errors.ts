import { toast } from 'sonner'
import type { PostgrestError } from '@supabase/supabase-js'

// Error types (Requirements 13.1, 13.2, 13.3)
export type ErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'CONFLICT_ERROR'

export interface AppError {
  type: ErrorType
  message: string
  details?: Record<string, string>
}

// Map Supabase error codes to user-friendly messages
const SUPABASE_ERROR_MESSAGES: Record<string, { type: ErrorType; message: string }> = {
  'PGRST116': { type: 'NOT_FOUND', message: 'Запись не найдена' },
  '23505': { type: 'CONFLICT_ERROR', message: 'Запись уже существует' },
  '23503': { type: 'VALIDATION_ERROR', message: 'Связанная запись не найдена' },
  '42501': { type: 'AUTH_ERROR', message: 'Недостаточно прав для выполнения операции' },
  'PGRST301': { type: 'AUTH_ERROR', message: 'Требуется авторизация' },
}

// Handle Supabase errors
export function handleSupabaseError(error: PostgrestError): AppError {
  const mapped = SUPABASE_ERROR_MESSAGES[error.code]
  if (mapped) {
    return mapped
  }
  return { type: 'SERVER_ERROR', message: 'Произошла ошибка сервера' }
}

// Check if error is a network error
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true
  }
  if (error instanceof Error && error.message.includes('network')) {
    return true
  }
  return false
}

// Get user-friendly error message
export function getErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Ошибка сети. Проверьте подключение к интернету.'
  }
  
  if (error instanceof Error) {
    // Handle specific error messages
    if (error.message === 'Invalid login credentials') {
      return 'Неверный email или пароль'
    }
    if (error.message.includes('overlapping') || error.message.includes('пересекается')) {
      return 'Слот пересекается с существующим слотом'
    }
    return error.message
  }
  
  return 'Произошла неизвестная ошибка'
}

// Toast notification helpers (Requirements 13.1, 13.2)
export const showSuccessToast = (message: string) => {
  toast.success(message)
}

export const showErrorToast = (error: unknown) => {
  const message = getErrorMessage(error)
  toast.error(message)
}

export const showValidationErrorToast = (message: string) => {
  toast.error(message, {
    description: 'Проверьте введенные данные',
  })
}

export const showNetworkErrorToast = (onRetry?: () => void) => {
  toast.error('Ошибка сети', {
    description: 'Проверьте подключение к интернету',
    action: onRetry ? {
      label: 'Повторить',
      onClick: onRetry,
    } : undefined,
  })
}

export const showInfoToast = (message: string) => {
  toast.info(message)
}

export const showWarningToast = (message: string) => {
  toast.warning(message)
}
