import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCurrentLawyer } from '@/hooks/useLawyers'
import { useTimeSlots } from '@/hooks/useTimeSlots'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

// Validation schema for time slot form
const timeSlotSchema = z.object({
  date: z.string().min(1, 'Выберите дату'),
  start_time: z.string().min(1, 'Укажите время начала'),
  end_time: z.string().min(1, 'Укажите время окончания'),
}).refine(data => data.start_time < data.end_time, {
  message: 'Время окончания должно быть позже времени начала',
  path: ['end_time'],
})

type TimeSlotFormData = z.infer<typeof timeSlotSchema>

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

// Group slots by date
function groupSlotsByDate(slots: Array<{ id: string; date: string; start_time: string; end_time: string; is_available: boolean }>) {
  const grouped: Record<string, typeof slots> = {}
  
  for (const slot of slots) {
    if (!grouped[slot.date]) {
      grouped[slot.date] = []
    }
    grouped[slot.date].push(slot)
  }
  
  // Sort dates
  const sortedDates = Object.keys(grouped).sort()
  
  return sortedDates.map(date => ({
    date,
    slots: grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))
}

export function SlotsManagement() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { lawyer, isLoading: isLawyerLoading, error: lawyerError } = useCurrentLawyer(user?.id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { slots, isLoading: isSlotsLoading, error: slotsError, createSlot, deleteSlot, isDeleting } = useTimeSlots(
    lawyer?.id ? { lawyer_id: lawyer.id } : { lawyer_id: '' }
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '10:00',
    },
  })

  const isLoading = isLawyerLoading || isSlotsLoading
  const error = lawyerError || slotsError

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyer', 'current'] })
    queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
  }

  const onSubmit = async (data: TimeSlotFormData) => {
    if (!lawyer) return

    setIsSubmitting(true)
    try {
      await createSlot({
        lawyer_id: lawyer.id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      showSuccessToast('Слот успешно создан')
      reset()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(slotId)
      showSuccessToast('Слот удален')
    } catch (error) {
      showErrorToast(error)
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Управление слотами</h2>
          <p className="text-gray-600">Создавайте и управляйте временными слотами для записи</p>
        </div>
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки слотов"
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

  const groupedSlots = groupSlotsByDate(slots)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Управление слотами</h2>
        <p className="text-gray-600">Создавайте и управляйте временными слотами для записи</p>
      </div>

      {/* Create slot form */}
      <Card>
        <CardHeader>
          <CardTitle>Создать новый слот</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Дата</Label>
                <Input
                  id="date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Время начала</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register('start_time')}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-500">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Время окончания</Label>
                <Input
                  id="end_time"
                  type="time"
                  {...register('end_time')}
                />
                {errors.end_time && (
                  <p className="text-sm text-red-500">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать слот'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Slots list grouped by date */}
      <Card>
        <CardHeader>
          <CardTitle>Существующие слоты</CardTitle>
        </CardHeader>
        <CardContent>
          {groupedSlots.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Слоты не созданы
            </p>
          ) : (
            <div className="space-y-6">
              {groupedSlots.map(({ date, slots: dateSlots }) => (
                <div key={date}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {formatDate(date)}
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Время</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dateSlots.map((slot) => (
                        <TableRow key={slot.id}>
                          <TableCell className="font-medium">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                slot.is_available
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {slot.is_available ? 'Доступен' : 'Занят'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={isDeleting || !slot.is_available}
                            >
                              Удалить
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
