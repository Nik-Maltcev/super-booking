import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lawyer, LawyerWithStats } from '@/types'

async function fetchLawyers(): Promise<Lawyer[]> {
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      user:users(*)
    `)
    .order('id')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Type for time slot with appointments from Supabase query
interface TimeSlotWithAppointments {
  id: string
  lawyer_id: string
  appointments: { id: string; status: string }[]
}

// Fetch lawyers with appointment statistics for admin panel (Requirements 9.1, 9.2)
async function fetchLawyersWithStats(): Promise<LawyerWithStats[]> {
  // Fetch all lawyers
  const { data: lawyers, error: lawyersError } = await supabase
    .from('lawyers')
    .select(`
      *,
      user:users(*)
    `)
    .order('id')

  if (lawyersError) {
    throw new Error(lawyersError.message)
  }

  // Fetch all time slots with appointments
  const { data: timeSlots, error: slotsError } = await supabase
    .from('time_slots')
    .select(`
      id,
      lawyer_id,
      appointments(id, status)
    `)

  if (slotsError) {
    throw new Error(slotsError.message)
  }

  const typedTimeSlots = (timeSlots || []) as unknown as TimeSlotWithAppointments[]
  const typedLawyers = (lawyers || []) as unknown as Lawyer[]

  // Calculate statistics for each lawyer
  const lawyersWithStats: LawyerWithStats[] = typedLawyers.map((lawyer) => {
    const lawyerSlots = typedTimeSlots.filter(
      (slot) => slot.lawyer_id === lawyer.id
    )
    
    let totalAppointments = 0
    let completedAppointments = 0

    lawyerSlots.forEach((slot) => {
      const appointments = slot.appointments || []
      totalAppointments += appointments.length
      completedAppointments += appointments.filter(
        (apt) => apt.status === 'confirmed'
      ).length
    })

    return {
      ...lawyer,
      total_appointments: totalAppointments,
      completed_appointments: completedAppointments,
    }
  })

  return lawyersWithStats
}

async function fetchLawyerByUserId(userId: string): Promise<Lawyer | null> {
  const { data, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      user:users(*)
    `)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data as unknown as Lawyer
}

// Fetch lawyer by ID or slug (for booking page)
async function fetchLawyerByIdOrSlug(idOrSlug: string): Promise<Lawyer | null> {
  // First try by UUID
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  
  let query = supabase
    .from('lawyers')
    .select(`
      *,
      user:users(*)
    `)
  
  if (isUUID) {
    query = query.eq('id', idOrSlug)
  } else {
    query = query.eq('slug', idOrSlug)
  }
  
  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data as unknown as Lawyer
}

export function useLawyers() {
  const { data: lawyers = [], isLoading, error } = useQuery({
    queryKey: ['lawyers'],
    queryFn: fetchLawyers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    lawyers,
    isLoading,
    error: error as Error | null,
  }
}

export function useCurrentLawyer(userId: string | undefined) {
  const { data: lawyer, isLoading, error } = useQuery({
    queryKey: ['lawyer', 'current', userId],
    queryFn: () => fetchLawyerByUserId(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    lawyer,
    isLoading,
    error: error as Error | null,
  }
}


// Hook for admin panel to get lawyers with statistics
export function useLawyersWithStats() {
  const { data: lawyers = [], isLoading, error } = useQuery({
    queryKey: ['lawyers', 'withStats'],
    queryFn: fetchLawyersWithStats,
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  return {
    lawyers,
    isLoading,
    error: error as Error | null,
  }
}

// Hook to get lawyer by ID or slug (for booking page)
export function useLawyer(idOrSlug: string | undefined) {
  const { data: lawyer, isLoading, error } = useQuery({
    queryKey: ['lawyer', idOrSlug],
    queryFn: () => fetchLawyerByIdOrSlug(idOrSlug!),
    enabled: !!idOrSlug,
    staleTime: 5 * 60 * 1000,
  })

  return {
    lawyer,
    isLoading,
    error: error as Error | null,
  }
}


// Update lawyer consultation price
async function updateLawyerPrice(lawyerId: string, price: number): Promise<void> {
  const { error } = await supabase
    .from('lawyers')
    .update({ consultation_price: price } as never)
    .eq('id', lawyerId)

  if (error) {
    throw new Error(error.message)
  }
}

// Hook to update lawyer price
export function useUpdateLawyerPrice() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ lawyerId, price }: { lawyerId: string; price: number }) =>
      updateLawyerPrice(lawyerId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lawyer'] })
      queryClient.invalidateQueries({ queryKey: ['lawyers'] })
    },
  })

  return {
    updatePrice: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error as Error | null,
  }
}
