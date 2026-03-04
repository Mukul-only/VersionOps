import React from 'react';
import { X } from 'lucide-react';

interface ForbiddenPopupProps {
  open: boolean;
  onClose: () => void;
}

const ForbiddenPopup: React.FC<ForbiddenPopupProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-red-500/20 rounded-2xl w-full max-w-[440px] mx-4 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative font-mono"
      >
        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent relative z-10" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="relative w-10 h-10 shrink-0">
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
              <div className="absolute inset-1.5 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div>
              <div className="font-bold text-lg text-white tracking-tight leading-none uppercase">
                Forbidden
              </div>
              <div className="text-[10px] text-red-500 tracking-widest mt-1 opacity-80 uppercase">
                Access Denied · 403
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-white/5 border border-white/10 rounded-lg w-8 h-8 flex items-center justify-center transition-all hover:bg-white/10 hover:rotate-90 text-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-6 relative z-10" />

        {/* Content */}
        <div className="p-6 relative z-10">
          <p className="text-white/60 text-sm leading-relaxed">
            You do not have permission to access this page.
            <br />
            <span className="text-white/30 text-xs">
              If you believe this is an error, contact your administrator.
            </span>
          </p>

          {/* Error code chip */}
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] text-red-500/90 tracking-widest font-medium">
              HTTP 403 FORBIDDEN
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-6 relative z-10" />

        {/* Actions */}
        <div className="px-6 pt-4 pb-6 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="bg-transparent border border-red-500/40 rounded-lg text-red-500 text-[11px] font-medium tracking-widest px-6 py-2.5 transition-all hover:bg-red-500/10 uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPopup;
