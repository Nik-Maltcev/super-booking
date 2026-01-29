import { useMemo } from 'react'
import { format, parseISO, isSameDay, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimeSlot } from '@/types'
import { cn } from '@/lib/utils'

interface TimeSlotPickerProps {
  lawyerId: string
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  selectedSlot: TimeSlot | null
  onSlotSelect: (slot: TimeSlot) => void
  slots: TimeSlot[]
  availableDates: string[]
  isLoading: boolean
}

export function TimeSlotPicker({
  selectedDate,
  onDateSelect,
  selectedSlot,
  onSlotSelect,
  slots,
  availableDates,
  isLoading,
}: TimeSlotPickerProps) {
  // Convert available dates to Date objects for the calendar
  const availableDateObjects = useMemo(() => {
    return availableDates.map(date => parseISO(date))
  }, [availableDates])

  // Filter slots for the selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    // Format selected date as YYYY-MM-DD string for comparison
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    return slots.filter(slot => 
      slot.date === selectedDateStr && slot.is_available
    )
  }, [slots, selectedDate])

  // Disable dates that don't have available slots
  const isDateDisabled = (date: Date) => {
    return !availableDateObjects.some(availableDate => 
      isSameDay(availableDate, date)
    )
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Format HH:MM
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Выберите дату</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={(date) => date && onDateSelect(date)}
            disabled={(date) => startOfDay(date) < startOfDay(new Date()) || isDateDisabled(date)}
            locale={ru}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Slots Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate 
              ? `Доступное время на ${format(selectedDate, 'd MMMM yyyy', { locale: ru })}`
              : 'Выберите дату для просмотра времени'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !selectedDate ? (
            <p className="text-muted-foreground text-center py-8">
              Выберите дату в календаре
            </p>
          ) : slotsForSelectedDate.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Нет доступных слотов на выбранную дату. Пожалуйста, выберите другую дату.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slotsForSelectedDate.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                  className={cn(
                    'h-auto py-3',
                    selectedSlot?.id === slot.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => onSlotSelect(slot)}
                >
                  <div className="text-center">
                    <div className="font-medium">
                      {formatTime(slot.start_time)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      до {formatTime(slot.end_time)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
