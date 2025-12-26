import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle, Calendar, Clock, User, Mail, Phone, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppointment } from '@/hooks/useAppointments'
import { ErrorDisplay } from '@/components/ui/error-display'

export function ConfirmationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()
  const queryClient = useQueryClient()
  
  const { appointment, isLoading, error } = useAppointment(appointmentId!)

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
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Запись успешно создана!
        </h1>
        <p className="text-muted-foreground">
          Ваша заявка на консультацию принята и ожидает подтверждения.
        </p>
      </div>

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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Ожидает подтверждения
              </span>
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
