import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function confirmPayment() {
      if (!appointmentId) {
        setErrorMessage('ID записи не найден в URL')
        setStatus('error')
        return
      }

      try {
        // Update appointment status to confirmed
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', appointmentId)

        if (error) {
          console.error('Error confirming appointment:', error)
          setErrorMessage(error.message)
          setStatus('error')
          return
        }

        setStatus('success')
      } catch (err) {
        console.error('Error:', err)
        setErrorMessage('Произошла ошибка при подтверждении записи')
        setStatus('error')
      }
    }

    confirmPayment()
  }, [appointmentId])

  if (status === 'loading') {
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

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-center text-yellow-600">
              Оплата получена
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Платёж прошёл успешно, но возникла проблема с обновлением статуса записи.
              Не волнуйтесь - мы получили вашу оплату и свяжемся с вами.
            </p>
            {errorMessage && (
              <p className="text-center text-sm text-red-500">{errorMessage}</p>
            )}
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
            {appointmentId && (
              <Button asChild>
                <Link to={`/confirmation/${appointmentId}`}>
                  Посмотреть детали записи
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
