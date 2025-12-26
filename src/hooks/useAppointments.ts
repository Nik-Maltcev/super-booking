import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Appointment, CreateAppointmentInput, AppointmentFilters } from '@/types'

async function fetchAppointments(filters?: AppointmentFilters): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      time_slot:time_slots(
        *,
        lawyer:lawyers(
          *,
          user:users(*)
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  let appointments = (data || []) as unknown as Appointment[]

  // Filter by lawyer_id (client-side filtering due to nested relation)
  if (filters?.lawyer_id) {
    appointments = appointments.filter(
      (apt) => apt.time_slot?.lawyer_id === filters.lawyer_id
    )
  }

  // Filter by date (client-side filtering due to nested relation)
  if (filters?.date) {
    appointments = appointments.filter(
      (apt) => apt.time_slot?.date === filters.date
    )
  }

  return appointments
}

async function fetchAppointmentById(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      time_slot:time_slots(
        *,
        lawyer:lawyers(
          *,
          user:users(*)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data as unknown as Appointment
}

// Create appointment with status "pending" (Requirements 3.2)
// Mark time slot as unavailable (Requirements 3.3)
async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  // First, create the appointment with status "pending"
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      time_slot_id: input.time_slot_id,
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone,
      comment: input.comment || null,
      status: 'pending', // Requirements 3.2: status must be "pending"
    } as never)
    .select()
    .single()

  if (appointmentError) {
    throw new Error(appointmentError.message)
  }

  // Then, mark the time slot as unavailable (Requirements 3.3)
  const { error: slotError } = await supabase
    .from('time_slots')
    .update({ is_available: false } as never)
    .eq('id', input.time_slot_id)

  if (slotError) {
    // Rollback: delete the appointment if slot update fails
    await supabase.from('appointments').delete().eq('id', (appointment as { id: string }).id)
    throw new Error(slotError.message)
  }

  return appointment as unknown as Appointment
}

async function cancelAppointment(id: string): Promise<void> {
  // First, get the appointment to find the time slot
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('time_slot_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  // Update appointment status to "cancelled" (Requirements 8.3)
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' } as never)
    .eq('id', id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Restore time slot availability (Requirements 8.4)
  const { error: slotError } = await supabase
    .from('time_slots')
    .update({ is_available: true } as never)
    .eq('id', (appointment as { time_slot_id: string }).time_slot_id)

  if (slotError) {
    throw new Error(slotError.message)
  }
}

export function useAppointments(filters?: AppointmentFilters) {
  const queryClient = useQueryClient()

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => fetchAppointments(filters),
    staleTime: 1 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
      queryClient.invalidateQueries({ queryKey: ['availableDates'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
      queryClient.invalidateQueries({ queryKey: ['availableDates'] })
    },
  })

  return {
    appointments,
    isLoading,
    error: error as Error | null,
    createAppointment: createMutation.mutateAsync,
    cancelAppointment: cancelMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isCancelling: cancelMutation.isPending,
  }
}

export function useAppointment(id: string) {
  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => fetchAppointmentById(id),
    enabled: !!id,
  })

  return {
    appointment,
    isLoading,
    error: error as Error | null,
  }
}
