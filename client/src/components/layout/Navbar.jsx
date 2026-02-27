import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-white text-2xl font-bold">Campus Link</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-white hover:text-blue-200 px-3 py-2 rounded-md text-sm font-medium transition duration-200"
            >
              Dashboard
            </Link>
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
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            to="/"
            className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/login"
            className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
