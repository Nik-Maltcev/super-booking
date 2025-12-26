import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCurrentLawyer } from '@/hooks/useLawyers'
import { useAppointments } from '@/hooks/useAppointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { showSuccessToast, showErrorToast } from '@/lib/errors'
import { ErrorDisplay } from '@/components/ui/error-display'
import type { AppointmentStatus } from '@/types'

// Helper to format time
function formatTime(time: string): string {
  return time.slice(0, 5)
}

// Helper to format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Helper to get status badge
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

export function LawyerAppointments() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { lawyer, isLoading: isLawyerLoading, error: lawyerError } = useCurrentLawyer(user?.id)
  
  // Filter state
  const [dateFilter, setDateFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  
  const { 
    appointments, 
    isLoading: isAppointmentsLoading, 
    error: appointmentsError,
    cancelAppointment,
    isCancelling 
  } = useAppointments(
    lawyer?.id 
      ? { 
          lawyer_id: lawyer.id,
          ...(dateFilter ? { date: dateFilter } : {}),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        } 
      : undefined
  )

  const isLoading = isLawyerLoading || isAppointmentsLoading
  const error = lawyerError || appointmentsError

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyer', 'current'] })
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId)
      showSuccessToast('Запись отменена')
    } catch (error) {
      showErrorToast(error)
    }
  }

  const clearFilters = () => {
    setDateFilter('')
    setStatusFilter('all')
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
          <h2 className="text-2xl font-bold text-gray-900">Все записи</h2>
          <p className="text-gray-600">Просмотр и управление записями клиентов</p>
        </div>
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки записей"
        />
      </div>
    )
  }

  if (!lawyer) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            Профиль юриста не найден
          </p>
        </CardContent>
      </Card>
    )
  }

  // Sort appointments by date and time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = a.time_slot?.date || ''
    const dateB = b.time_slot?.date || ''
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA) // Newest first
    }
    const timeA = a.time_slot?.start_time || ''
    const timeB = b.time_slot?.start_time || ''
    return timeA.localeCompare(timeB)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Все записи</h2>
        <p className="text-gray-600">Просмотр и управление записями клиентов</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="date-filter">Дата</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Статус</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as AppointmentStatus | 'all')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="confirmed">Подтверждена</SelectItem>
                  <SelectItem value="cancelled">Отменена</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments table */}
      <Card>
        <CardHeader>
          <CardTitle>Записи ({sortedAppointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAppointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Записи не найдены
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAppointments.map((appointment) => {
                  const status = getStatusBadge(appointment.status)
                  const canCancel = appointment.status !== 'cancelled'
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {appointment.time_slot
                          ? formatDate(appointment.time_slot.date)
                          : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {appointment.time_slot
                          ? `${formatTime(appointment.time_slot.start_time)} - ${formatTime(appointment.time_slot.end_time)}`
                          : '-'}
                      </TableCell>
                      <TableCell>{appointment.client_name}</TableCell>
                      <TableCell>{appointment.client_phone}</TableCell>
                      <TableCell>{appointment.client_email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={isCancelling}
                          >
                            Отменить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
