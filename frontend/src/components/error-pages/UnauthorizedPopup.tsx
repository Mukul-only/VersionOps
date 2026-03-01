import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePopup } from '@/hooks/use-popup';

const UnauthorizedPopup: React.FC = () => {
  const navigate = useNavigate();
  const { hidePopup } = usePopup();

  const handleLogin = () => {
    hidePopup();
    navigate('/login');
  };

  return (
    <div className="text-center p-8 max-w-md w-full">
      <Lock className="mx-auto h-16 w-16 text-destructive animate-shake" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight">401 – Unauthorized</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You are not authorized to view this page. Please log in with valid credentials.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={handleLogin}>Go to Login</Button>
        <Button variant="outline" onClick={hidePopup}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPopup;
