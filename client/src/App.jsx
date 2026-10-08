import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import NotificationContainer from './components/common/NotificationContainer';
import MessageToast from './components/common/MessageToast';
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import PageLoader from './components/ui/PageLoader';
import RouteTitle from './components/brand/RouteTitle';
import lazyWithRetry from './utils/lazyWithRetry';

const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));
const Home = lazyWithRetry(() => import('./pages/home/Home'));
const AnnouncementsPage = lazyWithRetry(() => import('./pages/announcements/AnnouncementsPage'));
const Chat = lazyWithRetry(() => import('./pages/chat/Chat'));
const Groups = lazyWithRetry(() => import('./pages/groups/Groups'));
const GroupChat = lazyWithRetry(() => import('./pages/groups/GroupChat'));
const Discussion = lazyWithRetry(() => import('./pages/discussion/Discussion'));
const QuestionDetails = lazyWithRetry(() => import('./pages/discussion/QuestionDetails'));
const AskQuestion = lazyWithRetry(() => import('./pages/discussion/AskQuestion'));
const Profile = lazyWithRetry(() => import('./pages/profile/Profile'));
const AdminLayout = lazyWithRetry(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazyWithRetry(() => import('./pages/admin/UsersManagement'));
const GroupsManagement = lazyWithRetry(() => import('./pages/admin/GroupsManagement'));
const JoinRequests = lazyWithRetry(() => import('./pages/admin/JoinRequests'));
const ActivityPage = lazyWithRetry(() => import('./pages/admin/ActivityPage'));

function LoadingFallback() {
  return <PageLoader message="Loading Campus Link…" />;
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

          {/* Admin lives inside the main shell so navigation stays consistent */}
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
          <RouteTitle />
          <NotificationContainer />
          <MessageToast />
          <AppContent />
        </SocketProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
