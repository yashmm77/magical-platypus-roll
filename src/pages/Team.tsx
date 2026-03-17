import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { Users, Plus, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const roleBadge: Record<string, string> = {
  admin: 'bg-indigo-100 text-indigo-700',
  member: 'bg-slate-100 text-slate-700',
  viewer: 'bg-yellow-100 text-yellow-700',
};

const Team = () => {
  const { activeOrgId, userOrgs } = useAuth();
  const { data: users, isLoading } = useUsers();
  const queryClient = useQueryClient();
  const isAdmin = userOrgs.find((o) => o.id === activeOrgId)?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: signUpData } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      });

      let userId = signUpData?.user?.id;

      if (!userId) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', form.email)
          .single();
        userId = existing?.id;
      }

      if (!userId) throw new Error('Could not resolve user. Try a different email.');

      const { error: linkError } = await supabase.rpc('add_member_to_org', {
        p_user_id: userId,
        p_org_id: activeOrgId,
        p_role: form.role,
      });

      if (linkError) throw linkError;

      toast.success('Member added successfully!');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'member' });
      queryClient.invalidateQueries({ queryKey: ['users', activeOrgId] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
        {isAdmin && (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(val) => setForm({ ...form, role: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((member: any) => (
            <Card key={member.id} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {member.full_name?.substring(0, 2).toUpperCase() || member.email?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">{member.full_name || 'Unnamed User'}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="mt-3">
                      <Badge className={`border-none text-xs font-medium ${roleBadge[member.role] || roleBadge.member}`}>
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!users || users.length === 0) && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No team members found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Team;