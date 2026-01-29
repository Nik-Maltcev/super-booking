// User roles
export type UserRole = 'client' | 'lawyer' | 'superadmin'

// Appointment status
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled'

// User interface
export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string
  phone: string | null
  created_at: string
}

// Lawyer interface
export interface Lawyer {
  id: string
  user_id: string
  slug: string | null
  specialization: string
  bio: string | null
  avatar_url: string | null
  consultation_price: number
  user?: User
}

// Time slot interface
export interface TimeSlot {
  id: string
  lawyer_id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  lawyer?: Lawyer
}

// Appointment interface
export interface Appointment {
  id: string
  time_slot_id: string
  client_name: string
  client_email: string
  client_phone: string
  comment: string | null
  status: AppointmentStatus
  transaction_id: string | null
  payment_id: string | null
  created_at: string
  time_slot?: TimeSlot
}

// Input types for creating entities
export interface CreateTimeSlotInput {
  lawyer_id: string
  date: string
  start_time: string
  end_time: string
}

export interface CreateAppointmentInput {
  time_slot_id: string
  client_name: string
  client_email: string
  client_phone: string
  comment?: string
  transaction_id?: string
}

// Lawyer with statistics (for admin panel)
export interface LawyerWithStats extends Lawyer {
  total_appointments: number
  completed_appointments: number
}

// Filter types
export interface AppointmentFilters {
  date?: string
  status?: AppointmentStatus
  lawyer_id?: string
}

export interface TimeSlotFilters {
  lawyer_id: string
  date?: string
  is_available?: boolean
}
