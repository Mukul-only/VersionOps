import React, { createContext, useState, ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import UnauthorizedPopup from './error-pages/UnauthorizedPopup';
import ForbiddenPopup from './error-pages/ForbiddenPopup';

export type PopupContent = 'unauthorized' | 'forbidden' | null;

export interface PopupContextType {
  showPopup: (content: PopupContent) => void;
  hidePopup: () => void;
}

export const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [popupContent, setPopupContent] = useState<PopupContent>(null);

  const showPopup = (content: PopupContent) => setPopupContent(content);
  const hidePopup = () => setPopupContent(null);

  const renderContent = () => {
    switch (popupContent) {
      case 'unauthorized':
        return <UnauthorizedPopup />;
      case 'forbidden':
        return <ForbiddenPopup />;
      default:
        return null;
    }
  };

  return (
    <PopupContext.Provider value={{ showPopup, hidePopup }}>
      {children}
      <Dialog open={!!popupContent} onOpenChange={(isOpen) => !isOpen && hidePopup()}>
        <DialogContent>{renderContent()}</DialogContent>
      </Dialog>
    </PopupContext.Provider>
  );
};
