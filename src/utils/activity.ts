import { supabase } from "@/lib/supabase";

export const logActivity = async (taskId: string, action: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert({
      task_id: taskId,
      action,
      user_id: user.id
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};