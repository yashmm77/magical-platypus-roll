import { Database } from '../types/database.types';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export type CommentWithProfile = Comment & {
  profiles: {
    full_name: string | null;
  } | null;
};