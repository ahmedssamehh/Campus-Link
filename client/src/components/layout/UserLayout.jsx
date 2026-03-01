import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar 
        isOpen={sidebarOpen}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      />
      
      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-all duration-300" />
      )}
      
      {/* Main content area */}
      <div 
        className={`
          ml-20
          ${sidebarOpen ? 'blur-sm pointer-events-none' : ''}
          transition-all duration-300
        `}
      >
        <Outlet />
      </div>
    </>
  );
};

export default UserLayout;
