import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { BookingForm, type BookingFormData } from '@/components/booking/BookingForm'
import { Button } from '@/components/ui/button'
import { useTimeSlots } from '@/hooks/useTimeSlots'
import { useAppointments } from '@/hooks/useAppointments'
import { useLawyer } from '@/hooks/useLawyers'
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/errors'
import { ErrorDisplay } from '@/components/ui/error-display'
import type { TimeSlot } from '@/types'

export function BookingPage() {
  const { lawyerId } = useParams<{ lawyerId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Fetch lawyer info by ID or slug
  const { lawyer, isLoading: isLoadingLawyer, error: lawyerError } = useLawyer(lawyerId)

  // Fetch time slots (use lawyer.id for queries)
  const { slots, availableDates, isLoading: isLoadingSlots, error: slotsError } = useTimeSlots({
    lawyer_id: lawyer?.id || '',
    date: selectedDate?.toISOString().split('T')[0],
    is_available: true, // Only show available slots (Requirements 2.5)
  })

  // Appointments hook for creating bookings
  const { createAppointment, isCreating } = useAppointments()

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyer', lawyerId] })
    queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
    queryClient.invalidateQueries({ queryKey: ['availableDates'] })
  }

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null)
  }, [selectedDate])

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) {
      showWarningToast('Пожалуйста, выберите время консультации')
      return
    }

    try {
      const appointment = await createAppointment({
        time_slot_id: selectedSlot.id,
        client_name: data.client_name,
        client_email: data.client_email,
        client_phone: data.client_phone,
        comment: data.comment,
      })

      showSuccessToast('Запись успешно создана!')
      navigate(`/confirmation/${appointment.id}`)
    } catch (error) {
      showErrorToast(error)
    }
  }

  if (isLoadingLawyer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (lawyerError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Запись к юристу</h1>
          </div>
        </div>
        <ErrorDisplay 
          error={lawyerError} 
          onRetry={handleRetry}
          title="Ошибка загрузки данных юриста"
        />
      </div>
    )
  }

  if (!lawyer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Юрист не найден
        </h2>
        <p className="text-muted-foreground mb-4">
          Запрашиваемый юрист не существует или был удален.
        </p>
        <Button asChild>
          <Link to="/">Вернуться к списку юристов</Link>
        </Button>
      </div>
    )
  }

  // Show error for slots loading
  if (slotsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Запись к {lawyer.user?.full_name || 'юристу'}
            </h1>
            <p className="text-muted-foreground">
              {lawyer.specialization}
            </p>
          </div>
        </div>
        <ErrorDisplay 
          error={slotsError} 
          onRetry={handleRetry}
          title="Ошибка загрузки расписания"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Запись к {lawyer.user?.full_name || 'юристу'}
          </h1>
          <p className="text-muted-foreground">
            {lawyer.specialization}
          </p>
        </div>
      </div>

      {/* Time Slot Picker */}
      <TimeSlotPicker
        lawyerId={lawyer.id}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        selectedSlot={selectedSlot}
        onSlotSelect={handleSlotSelect}
        slots={slots}
        availableDates={availableDates}
        isLoading={isLoadingSlots}
      />

      {/* Booking Form */}
      <BookingForm
        timeSlot={selectedSlot}
        lawyerId={lawyer.id}
        onSubmit={handleSubmit}
        isSubmitting={isCreating}
      />
    </div>
  )
}
