import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TimeSlot, CreateTimeSlotInput, TimeSlotFilters } from '@/types'

async function fetchTimeSlots(filters: TimeSlotFilters): Promise<TimeSlot[]> {
  // Don't fetch if no lawyer_id
  if (!filters.lawyer_id) {
    return []
  }

  let query = supabase
    .from('time_slots')
    .select('*')
    .eq('lawyer_id', filters.lawyer_id)
    .order('date')
    .order('start_time')

  if (filters.date) {
    query = query.eq('date', filters.date)
  }

  // Only show available slots for public booking (Requirements 2.5)
  if (filters.is_available !== undefined) {
    query = query.eq('is_available', filters.is_available)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

async function fetchAvailableDates(lawyerId: string): Promise<string[]> {
  // Don't fetch if no lawyerId
  if (!lawyerId) {
    return []
  }

  const { data, error } = await supabase
    .from('time_slots')
    .select('date')
    .eq('lawyer_id', lawyerId)
    .eq('is_available', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date')

  if (error) {
    throw new Error(error.message)
  }

  // Get unique dates
  const uniqueDates = [...new Set((data as { date: string }[])?.map(slot => slot.date) || [])]
  return uniqueDates
}

// Check for overlapping slots (Requirements 7.3)
async function checkOverlappingSlots(
  lawyerId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('id, start_time, end_time')
    .eq('lawyer_id', lawyerId)
    .eq('date', date)

  if (error) {
    throw new Error(error.message)
  }

  // Check for overlaps
  const slots = data as Array<{ id: string; start_time: string; end_time: string }> | null
  for (const slot of slots || []) {
    const existingStart = slot.start_time
    const existingEnd = slot.end_time
    
    // Overlap occurs if:
    // new start is between existing start and end, OR
    // new end is between existing start and end, OR
    // new slot completely contains existing slot
    if (
      (startTime >= existingStart && startTime < existingEnd) ||
      (endTime > existingStart && endTime <= existingEnd) ||
      (startTime <= existingStart && endTime >= existingEnd)
    ) {
      return true
    }
  }

  return false
}

async function createTimeSlot(input: CreateTimeSlotInput): Promise<TimeSlot> {
  // Check for overlapping slots (Requirements 7.3)
  const hasOverlap = await checkOverlappingSlots(
    input.lawyer_id,
    input.date,
    input.start_time,
    input.end_time
  )

  if (hasOverlap) {
    throw new Error('Слот пересекается с существующим слотом')
  }

  const insertData = {
    lawyer_id: input.lawyer_id,
    date: input.date,
    start_time: input.start_time,
    end_time: input.end_time,
    is_available: true, // Requirements 7.2: new slots are available
  }
  
  const { data, error } = await supabase
    .from('time_slots')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as unknown as TimeSlot
}

async function deleteTimeSlot(id: string): Promise<void> {
  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export function useTimeSlots(filters: TimeSlotFilters) {
  const queryClient = useQueryClient()

  const { data: slots = [], isLoading, error } = useQuery({
    queryKey: ['timeSlots', filters],
    queryFn: () => fetchTimeSlots(filters),
    enabled: !!filters.lawyer_id, // Only fetch when lawyer_id is available
    staleTime: 30 * 1000, // 30 seconds - shorter for real-time updates
  })

  const { data: availableDates = [] } = useQuery({
    queryKey: ['availableDates', filters.lawyer_id],
    queryFn: () => fetchAvailableDates(filters.lawyer_id),
    enabled: !!filters.lawyer_id, // Only fetch when lawyer_id is available
    staleTime: 30 * 1000, // 30 seconds
  })

  const createSlotMutation = useMutation({
    mutationFn: createTimeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
      queryClient.invalidateQueries({ queryKey: ['availableDates'] })
    },
  })

  const deleteSlotMutation = useMutation({
    mutationFn: deleteTimeSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] })
      queryClient.invalidateQueries({ queryKey: ['availableDates'] })
    },
  })

  return {
    slots,
    availableDates,
    isLoading,
    error: error as Error | null,
    createSlot: createSlotMutation.mutateAsync,
    deleteSlot: deleteSlotMutation.mutateAsync,
    isCreating: createSlotMutation.isPending,
    isDeleting: deleteSlotMutation.isPending,
  }
}

// Export helper for testing
export { checkOverlappingSlots }
