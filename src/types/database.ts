export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'client' | 'lawyer' | 'superadmin'
          full_name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'client' | 'lawyer' | 'superadmin'
          full_name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'client' | 'lawyer' | 'superadmin'
          full_name?: string
          phone?: string | null
          created_at?: string
        }
      }
      lawyers: {
        Row: {
          id: string
          user_id: string
          slug: string
          specialization: string
          bio: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          slug: string
          specialization: string
          bio?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string
          specialization?: string
          bio?: string | null
          avatar_url?: string | null
        }
      }
      time_slots: {
        Row: {
          id: string
          lawyer_id: string
          date: string
          start_time: string
          end_time: string
          is_available: boolean
        }
        Insert: {
          id?: string
          lawyer_id: string
          date: string
          start_time: string
          end_time: string
          is_available?: boolean
        }
        Update: {
          id?: string
          lawyer_id?: string
          date?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
        }
      }
      appointments: {
        Row: {
          id: string
          time_slot_id: string
          client_name: string
          client_email: string
          client_phone: string
          comment: string | null
          status: 'pending' | 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          time_slot_id: string
          client_name: string
          client_email: string
          client_phone: string
          comment?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          time_slot_id?: string
          client_name?: string
          client_email?: string
          client_phone?: string
          comment?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
