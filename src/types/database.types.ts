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
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          title: string
          description: string | null
          status: 'Todo' | 'In Progress' | 'Done'
          priority: 'low' | 'medium' | 'high'
          due_date: string | null
          assigned_to: string | null
          team_id: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title: string
          description?: string | null
          status?: 'Todo' | 'In Progress' | 'Done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          assigned_to?: string | null
          team_id?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          title?: string
          description?: string | null
          status?: 'Todo' | 'In Progress' | 'Done'
          priority?: 'low' | 'medium' | 'high'
          due_date?: string | null
          assigned_to?: string | null
          team_id?: string | null
          created_by?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          email: string | null
          role: 'admin' | 'member' | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          role?: 'admin' | 'member' | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          email?: string | null
          role?: 'admin' | 'member' | null
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          task_id: string
          user_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          task_id: string
          user_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          task_id?: string
          user_id?: string
          content?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          created_at: string
          task_id: string
          action: string
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          task_id: string
          action: string
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          task_id?: string
          action?: string
          user_id?: string | null
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