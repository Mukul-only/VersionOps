
import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center p-8 max-w-md w-full">
        <Lock className="mx-auto h-16 w-16 text-destructive animate-shake" />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">401 – Unauthorized</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You are not authorized to view this page. Please log in with valid credentials.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
