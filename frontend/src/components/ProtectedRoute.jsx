import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        // No authentication, redirect to login
        navigate('/');
        return;
      }

      try {
        const user = JSON.parse(userData);
        
        // Check if user has temporary password
        if (user.mustChangePassword || user.isTemporaryPassword) {
          toast.error('Please change your temporary password first');
          // Clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
          return;
        }

        // Make a test API call to verify token is still valid
        // This will trigger the password reset check in the backend
        try {
          await api.get('/auth/me');
        } catch (error) {
          if (error.response?.status === 403 && error.response?.data?.passwordReset) {
            // Password was reset, user will be redirected by API interceptor
            return;
          }
          // Other API errors, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/');
          return;
        }

        // User is properly authenticated
        setIsChecking(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear corrupted data and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    };

    checkUserStatus();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen py-20 bg-gray-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;