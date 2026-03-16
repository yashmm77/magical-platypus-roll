import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const useUsers = () => {
  const { activeOrgId } = useAuth();

  return useQuery({
    queryKey: ["users", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      const { data, error } = await supabase
        .from("org_members")
        .select("role, profiles(id, email, full_name, avatar_url)")
        .eq("org_id", activeOrgId);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((m: any) => ({
        ...m.profiles,
        role: m.role
      }));
    },
    enabled: !!activeOrgId,
  });
};