import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { usePopup } from '@/hooks/use-popup';

const ForbiddenPopup: React.FC = () => {
  const navigate = useNavigate();
  const { hidePopup } = usePopup();

  const handleHome = () => {
    hidePopup();
    navigate('/');
  };

  return (
    <div className="text-center p-8 max-w-md w-full">
      <Shield className="mx-auto h-16 w-16 text-destructive animate-pulse" />
      <h1 className="mt-6 text-4xl font-bold tracking-tight">403 – Access Denied</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You don’t have permission to access this resource.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={handleHome}>Return to Home</Button>
        <Button variant="outline" onClick={hidePopup}>
          Close
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPopup;
