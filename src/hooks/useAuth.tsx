import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserOrg {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  userOrgs: UserOrg[];
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(localStorage.getItem("active_org_id"));
  const [userOrgs, setUserOrgs] = useState<UserOrg[]>([]);

  const fetchUserOrgs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name)')
        .eq('user_id', userId);

      if (error) throw error;

      const orgs = (data || []).map((m: any) => ({
        id: m.org_id,
        name: m.organizations?.name,
        role: m.role
      }));

      setUserOrgs(orgs);
      
      if (orgs.length === 1 && !activeOrgId) {
        setActiveOrgId(orgs[0].id);
      }
    } catch (err) {
      console.error('Error fetching user orgs:', err);
    }
  };

  const setActiveOrgId = (id: string) => {
    setActiveOrgIdState(id);
    localStorage.setItem("active_org_id", id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrgs(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrgs(session.user.id);
      } else {
        setUserOrgs([]);
        setActiveOrgIdState(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("active_org_id");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      activeOrgId, 
      setActiveOrgId, 
      userOrgs, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};