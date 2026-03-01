import { PopupContextType } from '@/components/popup';
import { toast } from '@/components/ui/sonner';

class ApiInterceptor {
  private showPopupHandler: PopupContextType['showPopup'] | null = null;

  setPopupHandler(handler: PopupContextType['showPopup']) {
    this.showPopupHandler = handler;
  }

  handleUnauthorized() {
    if (window.location.pathname !== '/login' && this.showPopupHandler) {
      this.showPopupHandler('unauthorized');
    }
  }

  handleForbidden() {
    if (window.location.pathname === '/login') {
      toast.error('Forbidden', {
        description: "You don't have permission to access this resource.",
      });
    } else if (this.showPopupHandler) {
      this.showPopupHandler('forbidden');
    }
  }
}

export const apiInterceptor = new ApiInterceptor();
