import { useEffect } from 'react';
import { usePopup } from '@/hooks/use-popup';
import { apiInterceptor } from '@/api/interceptor';

const PopupHandler = () => {
  const { showPopup } = usePopup();

  useEffect(() => {
    apiInterceptor.setPopupHandler(showPopup);
  }, [showPopup]);

  return null;
};

export default PopupHandler;
