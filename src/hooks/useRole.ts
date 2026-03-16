import { useRole as useRoleContext } from '@/context/RoleContext';

export const useRole = () => {
  const { role, loading, refreshRole } = useRoleContext();
  
  return {
    role,
    isLoading: loading,
    isAdmin: role === 'admin',
    isMember: role === 'member',
    isViewer: role === 'viewer',
    canEdit: role === 'admin' || role === 'member',
    refreshRole
  };
};