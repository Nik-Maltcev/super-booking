import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLawyers } from '@/hooks/useLawyers'
import { useAppointments } from '@/hooks/useAppointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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

export function AdminAppointments() {
  const queryClient = useQueryClient()
  const { lawyers, error: lawyersError } = useLawyers()
  
  // Filter state
  const [lawyerFilter, setLawyerFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  
  // Build filters object
  const filters = {
    ...(lawyerFilter !== 'all' ? { lawyer_id: lawyerFilter } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }
  
  const { appointments, isLoading, error: appointmentsError } = useAppointments(
    Object.keys(filters).length > 0 ? filters : undefined
  )

  const error = lawyersError || appointmentsError

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyers'] })
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  }

  const clearFilters = () => {
    setLawyerFilter('all')
    setDateFilter('')
    setStatusFilter('all')
  }

  // Sort appointments by date and time (newest first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = a.time_slot?.date || ''
    const dateB = b.time_slot?.date || ''
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA)
    }
    const timeA = a.time_slot?.start_time || ''
    const timeB = b.time_slot?.start_time || ''
    return timeB.localeCompare(timeA)
  })

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
          <p className="text-gray-600">Просмотр всех записей в системе</p>
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
        <h2 className="text-2xl font-bold text-gray-900">Все записи</h2>
        <p className="text-gray-600">Просмотр всех записей в системе</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="lawyer-filter">Юрист</Label>
              <Select
                value={lawyerFilter}
                onValueChange={setLawyerFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Все юристы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все юристы</SelectItem>
                  {lawyers.map((lawyer) => (
                    <SelectItem key={lawyer.id} value={lawyer.id}>
                      {lawyer.user?.full_name || 'Без имени'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <TableHead>Юрист</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAppointments.map((appointment) => {
                  const status = getStatusBadge(appointment.status)
                  const lawyer = appointment.time_slot?.lawyer
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {lawyer?.avatar_url ? (
                            <img
                              src={lawyer.avatar_url}
                              alt={lawyer.user?.full_name || 'Юрист'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {lawyer?.user?.full_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <span className="font-medium">
                            {lawyer?.user?.full_name || 'Без имени'}
                          </span>
                        </div>
                      </TableCell>
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
