import { supabase } from '../lib/supabase';

export const initializeDatabase = async () => {
  try {
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
          updated_at TIMESTAMPTZ,
          username TEXT,
          full_name TEXT,
          avatar_url TEXT,
          email TEXT,
          role TEXT DEFAULT 'member'
        );
      `
    });

    if (profilesError) {
      console.error('Error creating profiles table:', profilesError);
    }

    // Create teams table if it doesn't exist
    const { error: teamsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS teams (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          name TEXT NOT NULL,
          description TEXT
        );
      `
    });

    if (teamsError) {
      console.error('Error creating teams table:', teamsError);
    }

    // Create tasks table if it doesn't exist
    const { error: tasksError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
          priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
          due_date TIMESTAMPTZ,
          assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
          team_id UUID REFERENCES teams(id) ON DELETE SET NULL
        );
      `
    });

    if (tasksError) {
      console.error('Error creating tasks table:', tasksError);
    }

    // Create indexes for better performance
    const { error: indexesError } = await supabase.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
      `
    });

    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
    }

    // Create task_summary view
    const { error: summaryViewError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE VIEW task_summary AS
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status IN ('todo', 'in_progress') THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks
        FROM tasks;
      `
    });

    if (summaryViewError) {
      console.error('Error creating task_summary view:', summaryViewError);
    }

    // Create tasks_due_today view
    const { error: dueTodayViewError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE VIEW tasks_due_today AS
        SELECT 
          tasks.*,
          profiles.full_name as assigned_to_name
        FROM tasks
        LEFT JOIN profiles ON tasks.assigned_to = profiles.id
        WHERE DATE(tasks.due_date) = DATE(NOW())
          AND tasks.status != 'completed';
      `
    });

    if (dueTodayViewError) {
      console.error('Error creating tasks_due_today view:', dueTodayViewError);
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};