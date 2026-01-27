import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const [isUpdating, setIsUpdating] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function confirmPayment() {
      if (!appointmentId) {
        setError('ID записи не найден')
        setIsUpdating(false)
        return
      }

      // Update appointment status to confirmed
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' } as never)
        .eq('id', appointmentId)

      if (updateError) {
        console.error('Error confirming appointment:', updateError)
        setError('Ошибка подтверждения записи')
      }

      setIsUpdating(false)
    }

    confirmPayment()
  }, [appointmentId])

  if (isUpdating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg">Подтверждаем оплату...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Ошибка</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <Button asChild className="w-full">
              <Link to="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center text-green-600">
            Оплата прошла успешно!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Ваша запись подтверждена. Мы отправили детали на вашу электронную почту.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to={`/confirmation/${appointmentId}`}>
                Посмотреть детали записи
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">На главную</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
