import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, X, AlertTriangle } from 'lucide-react'
import { useAppointment } from '@/hooks/useAppointments'

export function PaymentPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const { appointment, isLoading } = useAppointment(appointmentId || '')

  // Redirect to confirmation if already confirmed
  useEffect(() => {
    if (appointment?.status === 'confirmed') {
      navigate(`/confirmation/${appointmentId}`)
    }
  }, [appointment, appointmentId, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Запись не найдена</p>
            <Button asChild className="w-full mt-4">
              <Link to="/">На главную</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Build payment widget URL with transaction ID for callback
  const lawyer = appointment.time_slot?.lawyer
  const price = lawyer?.consultation_price || 1000
  const transactionId = `${appointmentId}|${Date.now()}`
  
  // Success/Fail URLs for redirect after payment
  const successUrl = `${window.location.origin}/confirmation/${appointmentId}`
  const failUrl = `${window.location.origin}/payment/${appointmentId}`
  
  const widgetUrl = `https://payanyway.ru/assistant.widget?` + new URLSearchParams({
    MNT_ID: '74730556',
    MNT_AMOUNT: price.toFixed(2),
    MNT_CURRENCY_CODE: 'RUB',
    MNT_TEST_MODE: '0',
    MNT_TRANSACTION_ID: transactionId,
    MNT_DESCRIPTION: `Консультация: ${lawyer?.user?.full_name || 'юрист'}`,
    MNT_SUCCESS_URL: successUrl,
    MNT_FAIL_URL: failUrl,
  }).toString()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Оплата консультации</h1>
            <p className="text-sm text-muted-foreground">
              {lawyer?.user?.full_name} • {price.toLocaleString('ru-RU')} ₽
            </p>
          </div>
        </div>

        {/* Payment Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Оплатите консультацию</CardTitle>
            <CardDescription>
              После успешной оплаты вы будете автоматически перенаправлены на страницу подтверждения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              src={widgetUrl}
              width="100%"
              height="500"
              style={{ border: 'none', borderRadius: '8px' }}
              title="Оплата"
            />
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Важно!</p>
                <p>Не закрывайте эту страницу до завершения оплаты. После успешной оплаты статус записи обновится автоматически.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
