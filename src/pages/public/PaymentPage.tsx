import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppointment } from '@/hooks/useAppointments'

export function PaymentPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const navigate = useNavigate()
  const { appointment, isLoading } = useAppointment(appointmentId || '')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  // Check if already confirmed
  useEffect(() => {
    if (appointment?.status === 'confirmed') {
      setConfirmed(true)
    }
  }, [appointment])

  const handleConfirmPayment = async () => {
    if (!appointmentId || !appointment) return
    
    setIsConfirming(true)
    try {
      // Update appointment status
      await supabase
        .from('appointments')
        .update({ status: 'confirmed' } as never)
        .eq('id', appointmentId)

      // Block the time slot
      await supabase
        .from('time_slots')
        .update({ is_available: false } as never)
        .eq('id', appointment.time_slot_id)

      setConfirmed(true)
    } catch (error) {
      console.error('Error confirming:', error)
    }
    setIsConfirming(false)
  }

  const handleCancel = async () => {
    if (!appointmentId) return
    
    setIsCancelling(true)
    try {
      // Delete the pending appointment
      await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('status', 'pending') // Only delete if still pending

      // Navigate back to booking
      navigate(-1)
    } catch (error) {
      console.error('Error cancelling:', error)
    }
    setIsCancelling(false)
  }

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

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-green-600">
              Запись подтверждена!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Спасибо за оплату. Ваша консультация забронирована.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to={`/confirmation/${appointmentId}`}>
                  Посмотреть детали
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

  // Build payment widget URL
  const lawyer = appointment.time_slot?.lawyer
  const price = lawyer?.consultation_price || 1000
  const widgetUrl = `https://payanyway.ru/assistant.widget?MNT_ID=74730556&MNT_AMOUNT=${price.toFixed(2)}&MNT_CURRENCY_CODE=RUB&MNT_TEST_MODE=0&MNT_DESCRIPTION=${encodeURIComponent(`Консультация: ${lawyer?.user?.full_name || 'юрист'}`)}`

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel} disabled={isCancelling}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Оплата консультации</h1>
            <p className="text-sm text-muted-foreground">
              {lawyer?.user?.full_name} • {price.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isCancelling}>
            <X className="h-4 w-4 mr-1" />
            Отменить
          </Button>
        </div>

        {/* Payment Widget */}
        <Card>
          <CardHeader>
            <CardTitle>Оплатите консультацию</CardTitle>
            <CardDescription>
              После оплаты нажмите кнопку "Я оплатил" ниже
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

        {/* Confirm Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleConfirmPayment} 
              disabled={isConfirming}
              className="w-full"
              size="lg"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Подтверждаем...
                </>
              ) : (
                'Я оплатил ✓'
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Нажмите после успешной оплаты в форме выше
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
