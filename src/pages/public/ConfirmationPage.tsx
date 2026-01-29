import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MessageSquare, Key } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppointment } from '@/hooks/useAppointments'
import { ErrorDisplay } from '@/components/ui/error-display'

export function ConfirmationPage() {
  const { appointmentId: paramId } = useParams<{ appointmentId: string }>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  
  // Support both URL param and query param (PayAnyWay redirect)
  const appointmentId = paramId || searchParams.get('MNT_TRANSACTION_ID') || ''
  
  // Get password from localStorage (saved before payment redirect)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  
  useEffect(() => {
    const savedPassword = localStorage.getItem('generatedPassword')
    const savedAppointmentId = localStorage.getItem('generatedPasswordAppointmentId')
    
    // Only show password if it matches this appointment
    if (savedPassword && savedAppointmentId === appointmentId) {
      setGeneratedPassword(savedPassword)
      // Clear after reading
      localStorage.removeItem('generatedPassword')
      localStorage.removeItem('generatedPasswordAppointmentId')
    }
  }, [appointmentId])
  
  const { appointment, isLoading, error } = useAppointment(appointmentId)

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки записи"
        />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Запись не найдена
        </h2>
        <p className="text-muted-foreground mb-4">
          Запрашиваемая запись не существует или была удалена.
        </p>
        <Button asChild>
          <Link to="/">Вернуться на главную</Link>
        </Button>
      </div>
    )
  }

  const timeSlot = appointment.time_slot
  const lawyer = timeSlot?.lawyer
  const formatTime = (time: string) => time.slice(0, 5)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className={`h-16 w-16 ${appointment.status === 'confirmed' ? 'text-green-500' : 'text-yellow-500'}`} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {appointment.status === 'confirmed' ? 'Запись подтверждена!' : 'Запись успешно создана!'}
        </h1>
        <p className="text-muted-foreground">
          {appointment.status === 'confirmed' 
            ? 'Ваша консультация оплачена и забронирована.'
            : 'Ваша заявка на консультацию принята и ожидает подтверждения.'}
        </p>
      </div>

      {/* Generated Password Card */}
      {generatedPassword && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Key className="h-5 w-5" />
              Ваш личный кабинет создан
            </CardTitle>
            <CardDescription>
              Для вас автоматически создан личный кабинет. Сохраните эти данные для входа.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p className="font-mono font-medium">{appointment?.client_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Пароль:</p>
                  <p className="font-mono font-medium text-lg">{generatedPassword}</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 Сохраните пароль в надёжном месте. В личном кабинете вы сможете просматривать свои записи.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Войти в личный кабинет</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Детали записи</CardTitle>
          <CardDescription>
            Номер записи: {appointment.id.slice(0, 8).toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lawyer Info */}
          {lawyer && (
            <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{lawyer.user?.full_name || 'Юрист'}</p>
                <p className="text-sm text-muted-foreground">{lawyer.specialization}</p>
              </div>
            </div>
          )}

          {/* Date and Time */}
          {timeSlot && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Дата</p>
                  <p className="font-medium">
                    {format(parseISO(timeSlot.date), 'd MMMM yyyy', { locale: ru })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Время</p>
                  <p className="font-medium">
                    {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="space-y-3 pt-3 border-t">
            <h3 className="font-medium">Ваши данные</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.client_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.client_email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.client_phone}</span>
              </div>
              {appointment.comment && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{appointment.comment}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Статус:</span>
              {appointment.status === 'confirmed' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Подтверждён
                </span>
              ) : appointment.status === 'cancelled' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Отменён
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Ожидает подтверждения
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button asChild>
          <Link to="/">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
  )
}
