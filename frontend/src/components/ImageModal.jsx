import React from 'react';

export default function ImageModal({ isOpen, onClose, imageUrl }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-3xl animate-in fade-in duration-500"
      onClick={onClose}
    >
      {/* Close Button */}
      <button 
        className="absolute top-6 right-6 lg:top-10 lg:right-10 text-white/40 hover:text-white p-3 hover:bg-white/10 rounded-full transition-all z-[260] bg-white/5 backdrop-blur-md active:scale-90"
        onClick={onClose}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* Image Container */}
      <div 
        className="relative max-w-[95vw] max-h-[95vh] animate-in zoom-in-95 duration-500 flex items-center justify-center p-2 lg:p-4 mt-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative group">
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-4 bg-white/5 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
          
          <img 
            src={imageUrl} 
            alt="Full View" 
            className="relative max-w-full max-h-[85vh] object-contain rounded-3xl shadow-2xl border border-white/10"
          />
        </div>
      </div>
    </div>
  );
}
