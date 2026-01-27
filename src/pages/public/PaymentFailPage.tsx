import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'

export function PaymentFailPage() {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-center text-red-600">
            Ошибка оплаты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            К сожалению, оплата не прошла. Пожалуйста, попробуйте ещё раз.
          </p>
          <div className="flex flex-col gap-2">
            {appointmentId && (
              <Button asChild>
                <Link to={`/booking?retry=${appointmentId}`}>
                  Попробовать снова
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/">На главную</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
