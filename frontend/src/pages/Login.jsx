import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, Key } from 'lucide-react';
import BloodCellAI from '../components/icons/BloodCellAI';
import api from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Check for password reset message
    const passwordResetMessage = localStorage.getItem('passwordResetMessage');
    if (passwordResetMessage) {
      toast.error(passwordResetMessage);
      localStorage.removeItem('passwordResetMessage');
    }
    
    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/home');
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send login request to backend
      const response = await api.post('/auth/login', formData);
      
      // Check if user has temporary password
      if (response.data.user.mustChangePassword || response.data.user.isTemporaryPassword) {
        // Store user data temporarily and show password change modal
        setTempUser(response.data.user);
        setPasswordChangeForm({
          currentPassword: formData.password, // Pre-fill with the temporary password they just used
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChangeModal(true);
        
        // Store token temporarily (will be used for password change API call)
        localStorage.setItem('tempToken', response.data.token);
        
        toast.success('Login successful! Please change your temporary password to continue.');
      } else {
        // Normal login flow
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Role-based redirection
        if (response.data.user.role === 'admin') {
          toast.success('Welcome back, Administrator!');
          navigate('/admin-dashboard');
        } else {
          toast.success(`Welcome back, ${response.data.user.name}!`);
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Invalid username/email or password invalid';
      
      // Dismiss any existing toasts to prevent stacking
      toast.dismiss();
      
      // Show persistent error toast that stays until manually dismissed
      toast.error(errorMessage, {
        id: 'login-error',
        duration: Infinity, // Never auto-dismiss - user must click to close
        style: {
          cursor: 'pointer' // Show it's clickable
        },
        onClick: () => {
          toast.dismiss('login-error');
        }
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordChangeForm({
      ...passwordChangeForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);

    // Validation
    if (!passwordChangeForm.newPassword || !passwordChangeForm.confirmPassword) {
      toast.error('Please fill in all fields');
      setIsChangingPassword(false);
      return;
    }

    if (passwordChangeForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      setIsChangingPassword(false);
      return;
    }

    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      toast.error('New passwords do not match');
      setIsChangingPassword(false);
      return;
    }

    if (passwordChangeForm.newPassword === passwordChangeForm.currentPassword) {
      toast.error('New password must be different from current password');
      setIsChangingPassword(false);
      return;
    }

    try {
      // Use temporary token for password change
      const tempToken = localStorage.getItem('tempToken');
      
      await api.put('/auth/force-password-change', {
        newPassword: passwordChangeForm.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${tempToken}`
        }
      });

      toast.success('Password changed successfully! Welcome to the system.');
      
      // Clear temporary data
      localStorage.removeItem('tempToken');
      
      // Set permanent token and user data
      localStorage.setItem('token', tempToken);
      localStorage.setItem('user', JSON.stringify(tempUser));
      
      // Close modal
      setShowPasswordChangeModal(false);
      
      // Navigate based on role
      if (tempUser.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/home');
      }
      
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-medical-200 to-primary-300 rounded-full opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200 to-medical-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-success-200 to-medical-200 rounded-full opacity-10" style={{transform: 'translate(-50%, -50%)'}}></div>
        
        {/* Medical Cross */}
        <div className="absolute top-20 left-20 w-8 h-8 text-success-300">
          <div className="w-full h-1 bg-current absolute top-1/2" style={{transform: 'translateY(-50%)'}}></div>
          <div className="h-full w-1 bg-current absolute left-1/2" style={{transform: 'translateX(-50%)'}}></div>
        </div>
        
        {/* DNA Helix */}
        <div className="absolute bottom-32 right-32 w-6 h-6 text-purple-300">
          <div className="w-2 h-2 bg-current rounded-full absolute top-0 left-0"></div>
          <div className="w-2 h-2 bg-current rounded-full absolute top-0 right-0"></div>
          <div className="w-2 h-2 bg-current rounded-full absolute bottom-0 left-0"></div>
          <div className="w-2 h-2 bg-current rounded-full absolute bottom-0 right-0"></div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-medical-500 to-primary-600 p-4 rounded-2xl shadow-large">
                <BloodCellAI className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">
              AI-powered Acute Lymphoblastic Leukemia Screening System
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Advanced Medical Diagnosis Platform
            </p>
            <p className="text-sm text-gray-500">
              Secure access for healthcare professionals
            </p>
          </div>

          {/* Login Form */}
          <div className="card-colored">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    className="input-field pl-10"
                    placeholder="Enter your email or username"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input-field pl-10 pr-12"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield'
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Password Change Required Modal */}
      {showPasswordChangeModal && tempUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password Change Required
              </h2>
              <p className="text-gray-600 text-sm">
                You are using a temporary password. Please set a new password to continue.
              </p>
            </div>

            {/* User Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tempUser.name}</p>
                <p className="text-sm text-gray-600">{tempUser.email}</p>
              </div>
            </div>

            {/* Password Change Form */}
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current (Temporary) Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordChangeForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={passwordChangeForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={passwordChangeForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isChangingPassword ? (
                  <div className="flex items-center justify-center">
                    <div className="rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Changing Password...
                  </div>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Security Notice:</p>
                  <p>Your password will never be shown again after you set it. If you forget it, contact the administrator for a reset.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;