import { Database } from '../types/database.types';

export type Task = Database['public']['Tables']['tasks']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
