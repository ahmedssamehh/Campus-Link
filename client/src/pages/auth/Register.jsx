import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertBanner from '../../components/ui/AlertBanner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showTerms, setShowTerms] = useState(false);

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
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
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setApiError('');
    
    // Call real register API with correct field mapping
    const result = await register({
      name: formData.name,        // Backend expects 'name'
      email: formData.email,      // Backend expects 'email'
      password: formData.password // Backend expects 'password'
      // confirmPassword NOT sent to backend (frontend validation only)
    });
    
    setIsLoading(false);
    
    if (result.success) {
      setShowSuccess(true);
      
      // Redirect to login after showing success message
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setApiError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 py-10 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-md transition-shadow duration-300 hover:shadow-2xl">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Campus Link logo"
            className="w-20 h-20 rounded-xl object-cover mx-auto mb-4 border border-gray-200 dark:border-gray-700"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join Campus Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your account to get started
          </p>
        </div>

        {showSuccess ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded-md">
            <div className="flex items-center justify-center flex-col">
              <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-center text-green-800 font-semibold">
                Account created successfully!
              </p>
              <p className="text-center text-green-700 text-sm mt-2">
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* API Error Message */}
            {apiError && (
              <div className="mb-4">
                <AlertBanner variant="error">{apiError}</AlertBanner>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700 dark:text-white`}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700 dark:text-white`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700 dark:text-white`}
                placeholder="Create a password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 dark:bg-gray-700 dark:text-white`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <button type="button" onClick={() => setShowTerms(true)} className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium underline cursor-pointer bg-transparent border-none p-0">
                  Terms and Conditions
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition duration-200 font-semibold ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          </>
        )}

        {/* Login Link */}
        {!showSuccess && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 dark:text-gray-300 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: March 2026</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h3>
              <p>By creating an account on Campus Link, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">2. Account Registration</h3>
              <p>You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">3. Acceptable Use</h3>
              <p>You agree to use Campus Link only for lawful, educational purposes. You shall not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post offensive, abusive, or inappropriate content</li>
                <li>Harass, bully, or intimidate other users</li>
                <li>Share copyrighted material without authorization</li>
                <li>Attempt to gain unauthorized access to other accounts</li>
                <li>Use the platform for commercial advertising or spam</li>
              </ul>

              <h3 className="font-semibold text-gray-900 dark:text-white">4. Privacy and Data</h3>
              <p>We collect and process your personal data (name, email, profile photo) to provide our services. Your data will not be sold to third parties. Messages and files shared within study groups are stored securely on our servers.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">5. Content Ownership</h3>
              <p>You retain ownership of content you post. By posting content, you grant Campus Link a non-exclusive license to display and distribute it within the platform for its intended purpose.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">6. Study Groups</h3>
              <p>Group administrators and owners have the right to manage membership and content within their groups. Campus Link administrators may remove groups or content that violate these terms.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">7. Account Termination</h3>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your profile settings, which will permanently remove your data.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">8. Disclaimer</h3>
              <p>Campus Link is provided "as is" without warranties of any kind. We are not responsible for the accuracy of user-generated content or any damages arising from use of the platform.</p>

              <h3 className="font-semibold text-gray-900 dark:text-white">9. Changes to Terms</h3>
              <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
