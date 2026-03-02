import { toast } from '@/components/ui/sonner';

class ApiInterceptor {
  handleUnauthorized() {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  handleForbidden() {
    if (window.location.pathname !== '/forbidden') {

    }
  }
}

export const apiInterceptor = new ApiInterceptor();
