import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types";
import { useAuth } from "./useAuth";

export const useUsers = () => {
  const { activeOrgId } = useAuth();

  return useQuery({
    queryKey: ["users", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      // Get user IDs belonging to the active organization
      const { data: members, error: memberError } = await supabase
        .from("org_members")
        .select("user_id")
        .eq("org_id", activeOrgId);

      if (memberError) throw new Error(memberError.message);
      if (!members || members.length === 0) return [];

      const userIds = members.map(m => m.user_id);

      // Fetch profiles for those users
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .order("full_name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Profile[];
    },
    enabled: !!activeOrgId,
  });
};