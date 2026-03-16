import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserOrg {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  activeOrgId: string | null;
  setActiveOrgId: (id: string | null) => void;
  userOrgs: UserOrg[];
  signOut: () => Promise<void>;
  refreshOrgs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [userOrgs, setUserOrgs] = useState<UserOrg[]>([]);

  const fetchUserOrgs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name)')
        .eq('user_id', userId);

      if (error) throw error;

      const orgs = data?.map((item: any) => ({
        id: item.organizations.id,
        name: item.organizations.name
      })) || [];

      setUserOrgs(orgs);
      
      // Set active org if not set or if current active org is not in the list
      const storedOrgId = localStorage.getItem('active_org_id');
      if (storedOrgId && orgs.some(o => o.id === storedOrgId)) {
        setActiveOrgIdState(storedOrgId);
      } else if (orgs.length > 0) {
        const firstOrgId = orgs[0].id;
        setActiveOrgIdState(firstOrgId);
        localStorage.setItem('active_org_id', firstOrgId);
      }
    } catch (err) {
      console.error('Error fetching user orgs:', err);
    }
  };

  const setActiveOrgId = (id: string | null) => {
    setActiveOrgIdState(id);
    if (id) {
      localStorage.setItem('active_org_id', id);
    } else {
      localStorage.removeItem('active_org_id');
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrgs(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state
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
    await supabase.auth.signOut();
    localStorage.removeItem('active_org_id');
  };

  const refreshOrgs = async () => {
    if (user) await fetchUserOrgs(user.id);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      activeOrgId, 
      setActiveOrgId, 
      userOrgs, 
      signOut,
      refreshOrgs
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