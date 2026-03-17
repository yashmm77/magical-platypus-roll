import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface OrgMembership {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  activeOrgId: string | null;
  setActiveOrgId: (id: string) => void;
  userOrgs: OrgMembership[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(
    () => localStorage.getItem('active_org_id')
  );
  const [userOrgs, setUserOrgs] = useState<OrgMembership[]>([]);

  const setActiveOrgId = (id: string) => {
    localStorage.setItem('active_org_id', id);
    setActiveOrgIdState(id);
  };

  const fetchOrgs = async (userId: string) => {
    const { data } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(id, name)')
      .eq('user_id', userId);
    const orgs = (data || []).map((m: any) => ({
      id: m.org_id,
      name: m.organizations?.name,
      role: m.role,
    }));
    setUserOrgs(orgs);
    const saved = localStorage.getItem('active_org_id');
    if (!saved && orgs.length === 1) setActiveOrgId(orgs[0].id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrgs(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrgs(session.user.id);
      else { setUserOrgs([]); }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('active_org_id');
    setActiveOrgIdState(null);
    setUserOrgs([]);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, activeOrgId, setActiveOrgId, userOrgs }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};