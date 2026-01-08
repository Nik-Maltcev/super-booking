import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Appointment, CreateAppointmentInput, AppointmentFilters } from '@/types'

// Generate random password (8 characters)
function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Check if user exists by email
async function checkUserExists(email: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()
  
  return !!data
}

// Create client account (without email confirmation)
async function createClientAccount(
  email: string, 
  fullName: string, 
  phone: string
): Promise<{ userId: string; password: string } | null> {
  const password = generatePassword()
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError || !authData.user) {
    console.error('Error creating client auth:', authError)
    return null
  }

  // Create user profile
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      role: 'client',
      full_name: fullName,
      phone,
    } as any)

  if (userError) {
    console.error('Error creating client profile:', userError)
    return null
  }

  // Sign out immediately (client doesn't need to be logged in)
  await supabase.auth.signOut()

  return { userId: authData.user.id, password }
}

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
// Auto-create client account if not exists
async function createAppointment(input: CreateAppointmentInput): Promise<Appointment & { generatedPassword?: string }> {
  let generatedPassword: string | undefined

  // Check if client already has an account
  const userExists = await checkUserExists(input.client_email)
  
  if (!userExists) {
    // Create client account
    const result = await createClientAccount(
      input.client_email,
      input.client_name,
      input.client_phone
    )
    if (result) {
      generatedPassword = result.password
    }
  }

  // Create the appointment with status "pending"
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

  return { 
    ...(appointment as unknown as Appointment), 
    generatedPassword 
  }
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
