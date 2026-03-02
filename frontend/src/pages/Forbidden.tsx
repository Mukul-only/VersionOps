import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Forbidden: React.FC = () => {
  const navigate = useNavigate();

  const handleHome = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <Shield className="mx-auto h-16 w-16 text-destructive animate-pulse" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">403 – Access Denied</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You don’t have permission to access this resource.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={handleHome}>Return to Home</Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
