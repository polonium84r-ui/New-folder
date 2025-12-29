import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Home, 
  Activity, 
  Users,
  Shield,
  Info,
  Upload,
  Settings,
  BarChart3,
  UserCheck
} from 'lucide-react';
import BloodCellAI from './icons/BloodCellAI';
import { handleLogout as logoutUtil } from '../utils/logout';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for user data updates
    const handleUserDataUpdate = (event) => {
      setUser(event.detail);
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);

    // Also listen for storage changes (in case user data is updated in another tab)
    const handleStorageChange = (event) => {
      if (event.key === 'user' && event.newValue) {
        setUser(JSON.parse(event.newValue));
      } else if (event.key === 'user' && !event.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    logoutUtil(navigate);
  };

  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/') return false;
    if (path === '/admin-dashboard' && location.pathname === '/admin-dashboard') return true;
    return location.pathname === path;
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return [];

    if (user.role === 'admin') {
      return [
        { to: '/admin-dashboard', label: 'Dashboard', icon: BarChart3 },
        { to: '/about', label: 'About', icon: Info },
        { to: '/analysis', label: 'Upload', icon: Upload },
        { to: '/analysis', label: 'Analysis', icon: Activity },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/admin-dashboard', label: 'Admins', icon: UserCheck }
      ];
    } else {
      return [
        { to: '/home', label: 'Dashboard', icon: Home },
        { to: '/about', label: 'About', icon: Info },
        { to: '/analysis', label: 'Upload', icon: Upload },
        { to: '/analysis', label: 'Analysis', icon: Activity },
        { to: '/settings', label: 'Settings', icon: Settings },
        { to: '/dashboard', label: 'History', icon: Users }
      ];
    }
  };

  const NavButton = ({ to, children, icon: Icon, onClick, isActive: active }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </Link>
  );

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 fixed top-0 left-0 right-0 z-[60] min-h-[64px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to={user?.role === 'admin' ? '/admin-dashboard' : '/home'} className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-medical-500 to-primary-600 p-2 rounded-xl shadow-lg">
                  <BloodCellAI className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-800">ALL Screening</h1>
                  <p className="text-xs text-gray-600">AI Medical System</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navigationItems.map((item, index) => (
                <NavButton
                  key={index}
                  to={item.to}
                  icon={item.icon}
                  isActive={isActive(item.to)}
                >
                  {item.label}
                </NavButton>
              ))}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="hidden md:flex items-center space-x-3 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
                    <div className="flex items-center space-x-2">
                      {user.role === 'admin' ? (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-red-600" />
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-medical-600" />
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.role === 'admin' ? 'System Administrator' : user.name}
                        </p>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/"
                  className="bg-gradient-to-r from-medical-500 to-primary-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-medical-600 hover:to-primary-700 shadow-md hover:shadow-lg"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-600 hover:text-gray-800 focus:outline-none p-2 rounded-md hover:bg-gray-100"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive(item.to)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Mobile User Info */}
              {user && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-xl">
                    {user.role === 'admin' ? (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-red-600" />
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-medical-600" />
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {user.role === 'admin' ? 'System Administrator' : user.name}
                      </p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
  );
};

export default Navbar;