import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import NotificationContainer from './components/common/NotificationContainer';
import MessageToast from './components/common/MessageToast';
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Home = lazy(() => import('./pages/home/Home'));
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'));
const Chat = lazy(() => import('./pages/chat/Chat'));
const Groups = lazy(() => import('./pages/groups/Groups'));
const GroupChat = lazy(() => import('./pages/groups/GroupChat'));
const Discussion = lazy(() => import('./pages/discussion/Discussion'));
const QuestionDetails = lazy(() => import('./pages/discussion/QuestionDetails'));
const AskQuestion = lazy(() => import('./pages/discussion/AskQuestion'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const GroupsManagement = lazy(() => import('./pages/admin/GroupsManagement'));
const JoinRequests = lazy(() => import('./pages/admin/JoinRequests'));
const ActivityPage = lazy(() => import('./pages/admin/ActivityPage'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

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

        <Route
          element={
            <AdminRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminLayout />
              </Suspense>
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
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <SocketProvider>
          <NotificationContainer />
          <MessageToast />
          <AppContent />
        </SocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
