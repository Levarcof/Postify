import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MessagingPanel from './MessagingPanel';
import MobileNav from './MobileNav';

export default function MainLayout() {
  const location = useLocation();
  const isConversation = location.pathname.includes('/conversation') || location.pathname.includes('/messages');

  return (
    <div className="min-h-screen bg-[#080810] text-white flex">
      {/* GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[100px]" />
      </div>

      <Sidebar />

      {/* MIDDLE SECTION - FEED */}
      <main className={`flex-1 flex flex-col items-center pt-6 pb-24 lg:ml-64 px-4 md:px-8 z-10 ${isConversation ? '!mx-0 !max-w-none !px-0 !pt-0 !pb-0 !ml-0' : 'xl:mr-80'}`}>
        <div className={`w-full h-full ${isConversation ? 'max-w-none' : 'max-w-[640px]'}`}>
          <Outlet />
        </div>
      </main>

      {!isConversation && <MessagingPanel />}

      <MobileNav />
    </div>
  );
}
