import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Most specific first.
const TITLES = [
  [/^\/login/, 'Sign in'],
  [/^\/register/, 'Create account'],
  [/^\/forgot-password/, 'Reset password'],
  [/^\/home/, 'Home'],
  [/^\/chat/, 'Messages'],
  [/^\/groups\/.+/, 'Group chat'],
  [/^\/groups/, 'Study groups'],
  [/^\/discussion\/ask/, 'Ask a question'],
  [/^\/discussion\/.+/, 'Question'],
  [/^\/discussion/, 'Q&A'],
  [/^\/announcements/, 'Announcements'],
  [/^\/profile/, 'Profile'],
  [/^\/admin\/users/, 'People · Admin'],
  [/^\/admin\/groups/, 'Groups · Admin'],
  [/^\/admin\/requests/, 'Join requests · Admin'],
  [/^\/admin\/activity/, 'Activity · Admin'],
  [/^\/admin/, 'Admin'],
];

/** Keeps the browser tab title in sync with the current page: "Study groups · Campus Link". */
const RouteTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = TITLES.find(([re]) => re.test(pathname));
    document.title = match ? `${match[1]} · Campus Link` : 'Campus Link';
  }, [pathname]);

  return null;
};

export default RouteTitle;
