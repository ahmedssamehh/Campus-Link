// Campus Link - Main Application Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import NotificationContainer from './components/common/NotificationContainer';
import UserLayout from './components/layout/UserLayout';
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
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import GroupsManagement from './pages/admin/GroupsManagement';
import JoinRequests from './pages/admin/JoinRequests';
import ActivityPage from './pages/admin/ActivityPage';

function AppContent() {
  return (
    <Routes>
      {/* Public Routes - No Layout */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes - Wrapped in UserLayout */}
      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupChat />} />
        <Route path="/discussion" element={<Discussion />} />
        <Route path="/discussion/ask" element={<AskQuestion />} />
        <Route path="/discussion/:id" element={<QuestionDetails />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin Routes - Wrapped in AdminRoute and AdminLayout */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/groups" element={<GroupsManagement />} />
        <Route path="/admin/requests" element={<JoinRequests />} />
        <Route path="/admin/activity" element={<ActivityPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <NotificationContainer />
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;
