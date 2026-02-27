import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-white text-2xl font-bold">Campus Link</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Home
                </Link>
                <Link
                  to="/chat"
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Chat
                </Link>
                <Link
                  to="/groups"
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Study Groups
                </Link>
                <Link
                  to="/discussion"
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Discussion
                </Link>
                <div className="flex items-center space-x-3 border-l border-blue-500 pl-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium text-sm">
                      {user?.name}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="text-white hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-700">
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 mb-2 bg-blue-600 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user?.name}</p>
                      <p className="text-blue-200 text-xs">{user?.email}</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Chat
                </Link>
                <Link
                  to="/groups"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Study Groups
                </Link>
                <Link
                  to="/discussion"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Discussion
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:bg-red-600 w-full text-left block px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
