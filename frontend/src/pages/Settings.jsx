import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  Shield,
  Mail,
  Calendar,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { logoutAfterPasswordReset } from '../utils/logout';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    isEditing: false,
    isSaving: false
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    isChanging: false
  });

  // Force password change state
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setProfileForm(prev => ({
      ...prev,
      name: parsedUser.name || '',
      email: parsedUser.email || ''
    }));
    
    // Check if user must change password
    if (parsedUser.mustChangePassword || parsedUser.isTemporaryPassword) {
      setForcePasswordChange(true);
      setActiveTab('password');
      toast.error('You must change your password before using the app', {
        duration: 5000
      });
    }
    
    setLoading(false);
  }, [navigate]);

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateProfileForm = () => {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    if (!profileForm.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!profileForm.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    // Current password is always required unless it's a force password change
    if (!forcePasswordChange && !passwordForm.currentPassword.trim()) {
      toast.error('Current password is required');
      return false;
    }
    if (!passwordForm.newPassword.trim()) {
      toast.error('New password is required');
      return false;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return false;
    }
    if (!forcePasswordChange && passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setProfileForm(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Make actual API call to update profile
      const response = await api.put('/auth/profile', {
        name: profileForm.name,
        email: profileForm.email
      });
      
      // Update local storage with the response data
      const updatedUser = {
        ...user,
        name: response.data.user.name,
        email: response.data.user.email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: updatedUser 
      }));
      
      setProfileForm(prev => ({ ...prev, isEditing: false }));
      toast.success('Profile updated successfully');
      
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileForm(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setPasswordForm(prev => ({ ...prev, isChanging: true }));
    
    try {
      console.log('Starting password change...', {
        forcePasswordChange,
        userRole: user.role,
        hasCurrentPassword: !!passwordForm.currentPassword,
        currentPasswordLength: passwordForm.currentPassword.length,
        newPasswordLength: passwordForm.newPassword.length
      });

      let endpoint = '/auth/change-password';
      let payload = {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      };

      // If this is a force password change (temporary password), use different endpoint
      if (forcePasswordChange) {
        endpoint = '/auth/force-password-change';
        payload = {
          newPassword: passwordForm.newPassword
        };
        console.log('Using force password change endpoint');
      }

      console.log('Making API call to:', endpoint);
      console.log('Payload (without passwords):', { 
        hasCurrentPassword: !!payload.currentPassword,
        hasNewPassword: !!payload.newPassword 
      });

      const response = await api.put(endpoint, payload);
      console.log('Password change response:', response.data);
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        isChanging: false
      });

      // Update user state to remove temporary password flags
      const updatedUser = { ...user, mustChangePassword: false, isTemporaryPassword: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setForcePasswordChange(false);
      
      // Automatic logout for security after password change
      logoutAfterPasswordReset(navigate);
      
    } catch (error) {
      console.error('Password change error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);
      
      let errorMessage = 'Failed to change password';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid password format';
      } else if (error.response?.status === 404) {
        errorMessage = 'Password change endpoint not found. Please check your connection.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check if the server is running.';
      }
      
      toast.error(errorMessage);
      setPasswordForm(prev => ({ ...prev, isChanging: false }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen py-20 bg-gray-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 min-h-screen pt-24">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3" />
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and security settings
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === 'profile'
                      ? 'bg-medical-50 text-medical-700 border border-medical-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile Info</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left ${
                    activeTab === 'password'
                      ? 'bg-medical-50 text-medical-700 border border-medical-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </button>
              </nav>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
                    <p className="text-xs text-gray-500">Account Type</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.analysisCount || 0}</p>
                    <p className="text-xs text-gray-500">Total Analyses</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'First time'}
                    </p>
                    <p className="text-xs text-gray-500">Last Login</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </h2>
                  {!profileForm.isEditing && (
                    <button
                      onClick={() => setProfileForm(prev => ({ ...prev, isEditing: true }))}
                      className="text-medical-600 hover:text-medical-700 font-medium"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        disabled={!profileForm.isEditing}
                        className={`input-field ${
                          !profileForm.isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          onChange={handleProfileChange}
                          disabled={!profileForm.isEditing}
                          className={`input-field pl-10 ${
                            !profileForm.isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    {/* Role Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Role
                      </label>
                      <div className="flex items-center space-x-3">
                        <Shield className={`w-4 h-4 ${
                          user.role === 'admin' ? 'text-red-600' : 'text-green-600'
                        }`} />
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Contact administrator to change your role
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {profileForm.isEditing && (
                      <div className="flex space-x-4 pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={profileForm.isSaving}
                          className="flex items-center space-x-2 bg-medical-600 text-white px-6 py-2 rounded-lg hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {profileForm.isSaving ? (
                            <>
                              <div className="rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm(prev => ({
                              ...prev,
                              isEditing: false,
                              name: user.name || '',
                              email: user.email || ''
                            }));
                          }}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === 'password' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </h2>

                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-6">
                    {/* Current Password */}
                    {!forcePasswordChange && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type={passwordForm.showCurrentPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className="input-field pl-10 pr-10"
                            placeholder="Enter your current password"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('showCurrentPassword')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {passwordForm.showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter your current password to verify your identity
                        </p>
                      </div>
                    )}

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={passwordForm.showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="input-field pl-10 pr-10"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('showNewPassword')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {passwordForm.showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="input-field pl-10 pr-10"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('showConfirmPassword')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {passwordForm.showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li className="flex items-center space-x-2">
                          {passwordForm.newPassword.length >= 6 ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span>At least 6 characters long</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {passwordForm.newPassword && passwordForm.newPassword !== passwordForm.currentPassword ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span>Different from current password</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span>Passwords match</span>
                        </li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={passwordForm.isChanging}
                        className="flex items-center space-x-2 bg-medical-600 text-white px-6 py-2 rounded-lg hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {passwordForm.isChanging ? (
                          <>
                            <div className="rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Changing Password...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Change Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;