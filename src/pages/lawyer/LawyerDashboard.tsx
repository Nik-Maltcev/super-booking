import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCurrentLawyer, useUpdateLawyerPrice } from '@/hooks/useLawyers'
import { useAppointments } from '@/hooks/useAppointments'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ErrorDisplay } from '@/components/ui/error-display'
import { showSuccessToast, showErrorToast } from '@/lib/errors'

// Helper to format time
function formatTime(time: string): string {
  return time.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
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

export function LawyerDashboard() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { lawyer, isLoading: isLawyerLoading, error: lawyerError } = useCurrentLawyer(user?.id)
  const { updatePrice, isUpdating } = useUpdateLawyerPrice()
  const [copied, setCopied] = useState(false)
  const [price, setPrice] = useState<string>('')
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  
  const { appointments, isLoading: isAppointmentsLoading, error: appointmentsError } = useAppointments(
    lawyer?.id ? { lawyer_id: lawyer.id, date: today } : undefined
  )

  const isLoading = isLawyerLoading || isAppointmentsLoading
  const error = lawyerError || appointmentsError

  // Generate booking link (use slug for prettier URLs)
  const bookingLink = lawyer?.slug 
    ? `${window.location.origin}/booking/${lawyer.slug}`
    : ''

  const handleCopyLink = async () => {
    if (bookingLink) {
      await navigator.clipboard.writeText(bookingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSavePrice = async () => {
    if (!lawyer) return
    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      showErrorToast('Введите корректную цену')
      return
    }
    try {
      await updatePrice({ lawyerId: lawyer.id, price: numPrice })
      showSuccessToast('Цена обновлена')
      setIsEditingPrice(false)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleStartEditPrice = () => {
    setPrice(lawyer?.consultation_price?.toString() || '1000')
    setIsEditingPrice(true)
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyer', 'current'] })
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
          <h2 className="text-2xl font-bold text-gray-900">Дашборд</h2>
          <p className="text-gray-600">Записи на сегодня</p>
        </div>
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки данных"
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

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = a.time_slot?.start_time || ''
    const timeB = b.time_slot?.start_time || ''
    return timeA.localeCompare(timeB)
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Дашборд</h2>
        <p className="text-gray-600">Записи на сегодня</p>
      </div>

      {/* Персональная ссылка для записи */}
      <Card>
        <CardHeader>
          <CardTitle>Ваша ссылка для записи</CardTitle>
          <CardDescription>
            Поделитесь этой ссылкой с клиентами для записи на консультацию
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={bookingLink} 
              readOnly 
              className="flex-1 bg-gray-50"
            />
            <Button onClick={handleCopyLink} variant="outline">
              {copied ? '✓ Скопировано' : 'Копировать'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(bookingLink, '_blank')}
            >
              Открыть
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Цена консультации */}
      <Card>
        <CardHeader>
          <CardTitle>Стоимость консультации</CardTitle>
          <CardDescription>
            Эта сумма будет списана с клиента при записи
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingPrice ? (
            <div className="flex gap-2 items-center">
              <Input 
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Цена в рублях"
                className="w-40"
              />
              <span className="text-gray-500">₽</span>
              <Button onClick={handleSavePrice} disabled={isUpdating}>
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditingPrice(false)}>
                Отмена
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-2xl font-bold">
                {lawyer?.consultation_price?.toLocaleString('ru-RU') || '1000'} ₽
              </span>
              <Button variant="outline" onClick={handleStartEditPrice}>
                Изменить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Записи на {new Date(today).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAppointments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              На сегодня записей нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  return (
                    <TableRow key={appointment.id}>
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
