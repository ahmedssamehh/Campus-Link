import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertBanner from '../../components/ui/AlertBanner';
import AuthShell, { authButtonClass, authInputClass, Spinner } from '../../components/layout/AuthShell';

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
    <AuthShell title="Create your account" subtitle="Join your classmates on Campus Link">
        {showSuccess ? (
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <div className="flex items-center justify-center flex-col">
              <svg className="w-12 h-12 text-emerald-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-center text-emerald-800 font-semibold">
                Account created successfully!
              </p>
              <p className="text-center text-emerald-700 text-sm mt-2">
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
              <label htmlFor="name" className="mb-2 block text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={authInputClass(errors.name)}
                placeholder="Enter your full name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={authInputClass(errors.email)}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={authInputClass(errors.password)}
                placeholder="Create a password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={authInputClass(errors.confirmPassword)}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:text-blue-700 font-medium underline cursor-pointer bg-transparent border-none p-0">
                  Terms and Conditions
                </button>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={authButtonClass}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Spinner />
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
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        )}

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="modal-scrim-in fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/50 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
          <div className="modal-panel-in bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Terms and Conditions</h2>
              <button onClick={() => setShowTerms(false)} className="p-1 rounded-full hover:bg-gray-100 transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4">
              <p className="text-xs text-gray-500">Last updated: March 2026</p>

              <h3 className="font-semibold text-gray-900">1. Acceptance of Terms</h3>
              <p>By creating an account on Campus Link, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform.</p>

              <h3 className="font-semibold text-gray-900">2. Account Registration</h3>
              <p>You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>

              <h3 className="font-semibold text-gray-900">3. Acceptable Use</h3>
              <p>You agree to use Campus Link only for lawful, educational purposes. You shall not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post offensive, abusive, or inappropriate content</li>
                <li>Harass, bully, or intimidate other users</li>
                <li>Share copyrighted material without authorization</li>
                <li>Attempt to gain unauthorized access to other accounts</li>
                <li>Use the platform for commercial advertising or spam</li>
              </ul>

              <h3 className="font-semibold text-gray-900">4. Privacy and Data</h3>
              <p>We collect and process your personal data (name, email, profile photo) to provide our services. Your data will not be sold to third parties. Messages and files shared within study groups are stored securely on our servers.</p>

              <h3 className="font-semibold text-gray-900">5. Content Ownership</h3>
              <p>You retain ownership of content you post. By posting content, you grant Campus Link a non-exclusive license to display and distribute it within the platform for its intended purpose.</p>

              <h3 className="font-semibold text-gray-900">6. Study Groups</h3>
              <p>Group administrators and owners have the right to manage membership and content within their groups. Campus Link administrators may remove groups or content that violate these terms.</p>

              <h3 className="font-semibold text-gray-900">7. Account Termination</h3>
              <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through your profile settings, which will permanently remove your data.</p>

              <h3 className="font-semibold text-gray-900">8. Disclaimer</h3>
              <p>Campus Link is provided "as is" without warranties of any kind. We are not responsible for the accuracy of user-generated content or any damages arising from use of the platform.</p>

              <h3 className="font-semibold text-gray-900">9. Changes to Terms</h3>
              <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
};

export default Register;
