import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertBanner from '../../components/ui/AlertBanner';
import AuthShell, { authButtonClass, authInputClass, Spinner } from '../../components/layout/AuthShell';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    // Call real login API
    const result = await login({
      email: formData.email,
      password: formData.password
    });
    
    setIsLoading(false);
    
    if (result.success) {
      // Redirect to dashboard
      navigate('/home');
    } else {
      setApiError(result.message || 'Login failed. Please try again.');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to Campus Link">
      {apiError && (
        <div className="mb-5">
          <AlertBanner variant="error">{apiError}</AlertBanner>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : 'false'}
            className={authInputClass(errors.email)}
            placeholder="you@university.edu"
            disabled={isLoading}
          />
          {errors.email && <p className="mt-1.5 text-sm text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            aria-invalid={errors.password ? 'true' : 'false'}
            className={authInputClass(errors.password)}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          {errors.password && <p className="mt-1.5 text-sm text-rose-600">{errors.password}</p>}
        </div>

        <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Remember me
        </label>

        <button type="submit" disabled={isLoading} aria-busy={isLoading} className={authButtonClass}>
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Spinner />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          Create account
        </Link>
      </p>
    </AuthShell>
  );
};

export default Login;
