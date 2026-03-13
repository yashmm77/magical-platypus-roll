import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Logout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" 
      onClick={handleSignOut}
    >
      <LogOut className="w-5 h-5" />
      Sign Out
    </Button>
  );
};

export default Logout;