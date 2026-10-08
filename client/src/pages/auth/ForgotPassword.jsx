import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import AuthShell, { authButtonClass, authInputClass, Spinner } from '../../components/layout/AuthShell';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      setInfo(res.data.message || 'If an account with that email exists, a reset code has been sent.');
      setStep(2);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the 6-digit code');
      return;
    }
    if (code.trim().length !== 6) {
      setError('Code must be exactly 6 digits');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/auth/reset-password', {
        email,
        code: code.trim(),
        newPassword,
      });
      setInfo(res.data.message || 'Password has been reset successfully');
      setStep(3);
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 3 ? 'All done!' : 'Reset password'}
      subtitle={
        step === 1
          ? 'Enter your email to receive a reset code'
          : step === 2
            ? 'Enter the code sent to your email'
            : 'Your password has been reset'
      }
    >
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {info && !error && step === 2 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm mb-4">
            {info}
          </div>
        )}

        {/* Step 1 – Enter email */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass(false)}
                placeholder="Enter your email"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={authButtonClass}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Spinner />
                  Sending...
                </span>
              ) : (
                'Send Reset Code'
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Step 2 – Enter code + new password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-semibold text-gray-700">
                6-Digit Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${authInputClass(false)} text-center text-2xl tracking-widest`}
                placeholder="------"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={authInputClass(false)}
                placeholder="At least 6 characters"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={authInputClass(false)}
                placeholder="Re-enter new password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={authButtonClass}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Spinner />
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setInfo(''); setCode(''); }}
                className="text-blue-600 hover:text-blue-700 font-medium bg-transparent border-none p-0 cursor-pointer"
              >
                Resend code
              </button>
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Step 3 – Success */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-gray-600">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className={`inline-block text-center ${authButtonClass}`}
            >
              Go to Sign In
            </Link>
          </div>
        )}
    </AuthShell>
  );
};

export default ForgotPassword;
