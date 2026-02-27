// Campus Link - Main Application Component
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Chat from './pages/chat/Chat';
import Groups from './pages/groups/Groups';
import GroupChat from './pages/groups/GroupChat';
import Discussion from './pages/discussion/Discussion';
import QuestionDetails from './pages/discussion/QuestionDetails';
import AskQuestion from './pages/discussion/AskQuestion';
import Profile from './pages/profile/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="App">
      {isAuthenticated && (
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
        </>
      )}
      <div 
        className={`
          ${isAuthenticated ? 'ml-20' : ''}
          ${sidebarOpen ? 'blur-sm pointer-events-none' : ''}
          transition-all duration-300
        `}
      >
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion" 
            element={
              <ProtectedRoute>
                <Discussion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion/ask" 
            element={
              <ProtectedRoute>
                <AskQuestion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/discussion/:id" 
            element={
              <ProtectedRoute>
                <QuestionDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
