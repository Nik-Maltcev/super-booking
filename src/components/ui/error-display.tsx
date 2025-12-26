import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { isNetworkError, getErrorMessage } from '@/lib/errors'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  title,
  className = '' 
}: ErrorDisplayProps) {
  if (!error) return null

  const isNetwork = isNetworkError(error)
  const message = getErrorMessage(error)

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardContent className="py-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {isNetwork ? (
            <WifiOff className="h-12 w-12 text-red-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-800">
              {title || (isNetwork ? 'Ошибка сети' : 'Произошла ошибка')}
            </h3>
            <p className="text-sm text-red-600 max-w-md">
              {message}
            </p>
          </div>

          {onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Повторить попытку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Inline error message for smaller contexts
interface InlineErrorProps {
  error: Error | null
  onRetry?: () => void
  className?: string
}

export function InlineError({ error, onRetry, className = '' }: InlineErrorProps) {
  if (!error) return null

  const message = getErrorMessage(error)

  return (
    <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </div>
      {onRetry && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onRetry}
          className="text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
