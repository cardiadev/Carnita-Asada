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
      events: {
        Row: {
          id: string
          nano_id: string
          title: string
          event_date: string
          location: string | null
          cancelled_at: string | null
          people_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nano_id: string
          title: string
          event_date: string
          location?: string | null
          cancelled_at?: string | null
          people_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nano_id?: string
          title?: string
          event_date?: string
          location?: string | null
          cancelled_at?: string | null
          people_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      attendees: {
        Row: {
          id: string
          event_id: string
          name: string
          exclude_from_split: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          exclude_from_split?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          exclude_from_split?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          sort_order: number
          is_default: boolean
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          sort_order?: number
          is_default?: boolean
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          sort_order?: number
          is_default?: boolean
        }
      }
      suggested_items: {
        Row: {
          id: string
          category_id: string
          name: string
          default_unit: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          default_unit?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          default_unit?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          event_id: string
          category_id: string | null
          name: string
          quantity: number
          unit: string
          is_purchased: boolean
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          category_id?: string | null
          name: string
          quantity?: number
          unit?: string
          is_purchased?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          category_id?: string | null
          name?: string
          quantity?: number
          unit?: string
          is_purchased?: boolean
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          event_id: string
          attendee_id: string | null
          description: string
          amount: number
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          attendee_id?: string | null
          description: string
          amount: number
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          attendee_id?: string | null
          description?: string
          amount?: number
          receipt_url?: string | null
          created_at?: string
        }
      }
      expense_exclusions: {
        Row: {
          id: string
          expense_id: string
          attendee_id: string
        }
        Insert: {
          id?: string
          expense_id: string
          attendee_id: string
        }
        Update: {
          id?: string
          expense_id?: string
          attendee_id?: string
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

// Tipos de ayuda para usar en la aplicación
export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type Attendee = Database['public']['Tables']['attendees']['Row']
export type AttendeeInsert = Database['public']['Tables']['attendees']['Insert']
export type AttendeeUpdate = Database['public']['Tables']['attendees']['Update']

export type Category = Database['public']['Tables']['categories']['Row']

export type SuggestedItem = Database['public']['Tables']['suggested_items']['Row']

export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']
export type ShoppingItemInsert = Database['public']['Tables']['shopping_items']['Insert']
export type ShoppingItemUpdate = Database['public']['Tables']['shopping_items']['Update']

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type ExpenseExclusion = Database['public']['Tables']['expense_exclusions']['Row']

// Tipos extendidos con relaciones
export type CategoryWithSuggestions = Category & {
  suggested_items: SuggestedItem[]
}

export type ExpenseWithAttendee = Expense & {
  attendee: Attendee | null
  exclusions: ExpenseExclusion[]
}

export type AttendeeWithExpenses = Attendee & {
  total_paid: number
  total_owes: number
  balance: number
}
