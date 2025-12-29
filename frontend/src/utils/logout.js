import { toast } from 'react-hot-toast';

/**
 * Utility function to handle user logout
 * Clears authentication data and redirects to login page
 * @param {Function} navigate - React Router navigate function
 * @param {string} message - Optional custom message to display
 * @param {boolean} isPasswordReset - Whether this logout is due to password reset
 */
export const handleLogout = (navigate, message = 'Logged out successfully', isPasswordReset = false) => {
  // Clear all authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Show appropriate message
  if (isPasswordReset) {
    toast.success('Password changed successfully! Please log in with your new password.');
  } else {
    toast.success(message);
  }
  
  // Redirect to login page
  navigate('/');
};

/**
 * Automatic logout after password reset with delay
 * @param {Function} navigate - React Router navigate function
 * @param {number} delay - Delay in milliseconds before logout (default: 2000)
 */
export const logoutAfterPasswordReset = (navigate, delay = 2000) => {
  toast.success('Password changed successfully! You will be logged out for security.');
  
  setTimeout(() => {
    handleLogout(navigate, 'Please log in with your new password.', true);
  }, delay);
};

export default { handleLogout, logoutAfterPasswordReset };