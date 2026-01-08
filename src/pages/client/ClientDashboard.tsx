import { useAuthContext } from '@/contexts/AuthContext'
import { useAppointments } from '@/hooks/useAppointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ErrorDisplay } from '@/components/ui/error-display'
import { format, parseISO, isFuture } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'

function formatTime(time: string): string {
  return time.slice(0, 5)
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'pending':
      return { label: 'Ожидает', className: 'bg-yellow-100 text-yellow-800' }
    case 'confirmed':
      return { label: 'Подтверждена', className: 'bg-green-100 text-green-800' }
    case 'cancelled':
      return { label: 'Отменена', className: 'bg-red-100 text-red-800' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' }
  }
}

export function ClientDashboard() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  
  const { appointments, isLoading, error } = useAppointments()

  // Filter appointments by client email
  const clientAppointments = appointments.filter(
    apt => apt.client_email === user?.email
  )

  // Separate upcoming and past appointments
  const upcomingAppointments = clientAppointments.filter(apt => {
    if (!apt.time_slot) return false
    const appointmentDate = parseISO(`${apt.time_slot.date}T${apt.time_slot.start_time}`)
    return isFuture(appointmentDate) && apt.status !== 'cancelled'
  })

  const pastAppointments = clientAppointments.filter(apt => {
    if (!apt.time_slot) return false
    const appointmentDate = parseISO(`${apt.time_slot.date}T${apt.time_slot.start_time}`)
    return !isFuture(appointmentDate) || apt.status === 'cancelled'
  })

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Мои записи</h2>
        </div>
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки записей"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Мои записи</h2>
        <p className="text-gray-600">Просмотр ваших консультаций</p>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Предстоящие записи</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              У вас нет предстоящих записей
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Юрист</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.map((appointment) => {
                  const status = getStatusBadge(appointment.status)
                  const timeSlot = appointment.time_slot
                  const lawyer = timeSlot?.lawyer

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {timeSlot && format(parseISO(timeSlot.date), 'd MMMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {timeSlot && `${formatTime(timeSlot.start_time)} - ${formatTime(timeSlot.end_time)}`}
                      </TableCell>
                      <TableCell>
                        {lawyer?.user?.full_name || 'Юрист'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>История записей</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Юрист</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastAppointments.map((appointment) => {
                  const status = getStatusBadge(appointment.status)
                  const timeSlot = appointment.time_slot
                  const lawyer = timeSlot?.lawyer

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {timeSlot && format(parseISO(timeSlot.date), 'd MMMM yyyy', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {timeSlot && `${formatTime(timeSlot.start_time)} - ${formatTime(timeSlot.end_time)}`}
                      </TableCell>
                      <TableCell>
                        {lawyer?.user?.full_name || 'Юрист'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
