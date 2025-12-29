import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Activity, 
  TrendingUp, 
  RefreshCw,
  User,
  Mail,
  FileText,
  Calendar,
  BarChart3,
  Award,
  Plus,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalAnalyses: 0,
    activeToday: 0,
    avgAnalysesPerDoctor: 0,
    topPerformer: null,
    recentActivity: 0
  });
  const [createDoctorForm, setCreateDoctorForm] = useState({
    name: '',
    email: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/home');
      return;
    }
    
    setUser(parsedUser);
    
    // Initial data fetch
    fetchDashboardData(false); // Don't show toast for initial load
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(false); // Don't show toast for auto-refresh
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchDashboardData = async (showToast = false) => {
    try {
      setRefreshing(true);
      
      // Fetch doctors data from real API
      const usersResponse = await api.get('/auth/users');
      const doctorsData = usersResponse.data.users?.filter(u => u.role === 'doctor') || [];
      
      setDoctors(doctorsData);
      
      // Calculate comprehensive stats
      const totalDoctors = doctorsData.length;
      const totalAnalyses = doctorsData.reduce((sum, doctor) => sum + (doctor.analysisCount || 0), 0);
      
      // Calculate active today (doctors who logged in today)
      const today = new Date();
      const activeToday = doctorsData.filter(doctor => {
        if (!doctor.lastLogin) return false;
        const lastLogin = new Date(doctor.lastLogin);
        return lastLogin.toDateString() === today.toDateString();
      }).length;
      
      // Calculate recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = doctorsData.filter(doctor => {
        if (!doctor.lastLogin) return false;
        const lastLogin = new Date(doctor.lastLogin);
        return lastLogin >= weekAgo;
      }).length;
      
      // Find top performer
      const topPerformer = doctorsData.length > 0 ? 
        doctorsData.reduce((prev, current) => 
          (prev.analysisCount || 0) > (current.analysisCount || 0) ? prev : current
        ) : null;
      
      const avgAnalysesPerDoctor = totalDoctors > 0 ? Math.round(totalAnalyses / totalDoctors) : 0;
      
      setStats({
        totalDoctors,
        totalAnalyses,
        activeToday,
        avgAnalysesPerDoctor,
        topPerformer,
        recentActivity
      });
      
      // Only show toast for manual refreshes
      if (showToast) {
        toast.success('Dashboard data refreshed successfully');
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data. Please check your connection.');
      
      // Set empty state on error
      setDoctors([]);
      setStats({
        totalDoctors: 0,
        totalAnalyses: 0,
        activeToday: 0,
        avgAnalysesPerDoctor: 0,
        topPerformer: null,
        recentActivity: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create new doctor account
  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    
    if (!createDoctorForm.name.trim() || !createDoctorForm.email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!createDoctorForm.email.includes('@')) {
      toast.error('Doctor email must include @ symbol (e.g., doctor@gmail.com)');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        name: createDoctorForm.name,
        email: createDoctorForm.email
      });

      toast.success('Doctor account created successfully!');
      
      // Show temporary password to admin
      setTemporaryPassword(response.data.temporaryPassword);
      setSelectedDoctor(response.data.user);
      setShowPasswordModal(true);
      setShowCreateDoctor(false);
      
      // Reset form
      setCreateDoctorForm({ name: '', email: '' });
      
      // Refresh dashboard data
      fetchDashboardData(false); // Don't show toast for automatic refresh after creating doctor
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create doctor account');
    }
  };

  // Reset doctor password
  const handleResetPassword = async (doctor) => {
    try {
      const response = await api.post('/auth/reset-password', {
        userId: doctor._id
      });

      toast.success('Password reset successfully!');
      
      // Show new temporary password to admin
      setTemporaryPassword(response.data.temporaryPassword);
      setSelectedDoctor(doctor);
      setShowPasswordModal(true);
      
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    }
  };

  // Copy password to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Password copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  // Delete doctor account
  const handleDeleteDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const confirmDeleteDoctor = async () => {
    if (!selectedDoctor) {
      toast.error('No doctor selected for deletion');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Attempting to delete doctor:', selectedDoctor);
      console.log('Doctor ID:', selectedDoctor._id);
      
      const response = await api.delete(`/auth/users/${selectedDoctor._id}`);
      console.log('Delete response:', response);
      
      toast.success(`Doctor ${selectedDoctor.name} deleted successfully!`);
      
      // Close modal and reset state
      setShowDeleteModal(false);
      setSelectedDoctor(null);
      
      // Refresh dashboard data
      await fetchDashboardData(false);
      
    } catch (error) {
      console.error('Delete error details:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      toast.error(error.response?.data?.error || 'Failed to delete doctor');
    } finally {
      setIsDeleting(false);
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchDashboardData(true); // Pass true to show toast notification
  };



  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getActivityStatus = (lastLogin) => {
    const lastLoginDate = new Date(lastLogin);
    const now = new Date();
    const diffInHours = (now - lastLoginDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) return { status: 'Active Today', color: 'bg-green-100 text-green-800' };
    if (diffInHours < 168) return { status: 'Active This Week', color: 'bg-blue-100 text-blue-800' };
    return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen py-20 bg-gray-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 min-h-screen pt-24">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-red-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor doctor activity and system usage • Auto-refreshes every 30 seconds
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateDoctor(true)}
                className="flex items-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Doctor</span>
              </button>
              <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Administrator</span>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? '' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
          
          {/* Real-time Status Banner */}
          <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-800 font-medium">Live Production Monitoring</span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="text-gray-700">Analysis counts update automatically when doctors complete analyses</span>
              </div>
              <div className="text-sm text-gray-600">
                Last updated: {refreshing ? 'Updating...' : 'Just now'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Doctors</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDoctors}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.recentActivity} active this week
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalAnalyses}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Automatically tracked
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeToday}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Logged in today
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg per Doctor</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgAnalysesPerDoctor}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Performance metric
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Activity Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Doctor Activity Table
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monitor doctor usage without accessing patient data
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading doctor activity...</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-11 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Doctor Name</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Total Analyses</div>
                  <div className="col-span-2">Last Active</div>
                  <div className="col-span-1">Status</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {doctors.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Doctors Found</h3>
                    <p className="text-gray-600 mb-4">
                      No doctor accounts have been created yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Create doctor accounts to start monitoring their activity.
                    </p>
                  </div>
                ) : (
                  doctors.map((doctor) => {
                    const activityStatus = getActivityStatus(doctor.lastLogin);
                    return (
                      <div key={doctor._id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="grid grid-cols-11 gap-4 items-center">
                          {/* Doctor Name */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gray-100 p-2 rounded-full">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{doctor.name}</p>
                                <p className="text-xs text-gray-500">
                                  Joined {formatDate(doctor.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="col-span-3">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <p className="text-sm text-gray-900">{doctor.email}</p>
                            </div>
                          </div>

                          {/* Total Analyses */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="text-lg font-bold text-gray-900">{doctor.analysisCount || 0}</p>
                                  {(doctor.analysisCount || 0) >= 30 && (
                                    <Award className="w-4 h-4 text-yellow-500" title="High Performer" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">analyses completed</p>
                              </div>
                            </div>
                          </div>

                          {/* Last Active */}
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {doctor.lastLogin ? formatDate(doctor.lastLogin) : 'Never'}
                                </p>
                                <p className="text-xs text-gray-500">last login</p>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="col-span-1">
                            <div className="flex flex-col items-center space-y-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activityStatus.color}`}>
                                {doctor.lastLogin ? activityStatus.status : 'Never'}
                              </span>
                              {(doctor.analysisCount || 0) >= 30 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Award className="w-3 h-3 mr-1" />
                                  Top
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <p>Showing {doctors.length} doctors</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Production data</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p>Total analyses: <span className="font-semibold text-gray-900">{stats.totalAnalyses}</span></p>
                    <p>Auto-counting: <span className="text-green-600 font-semibold">Active</span></p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Activity Summary */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <span className="text-gray-700 font-medium">Top Performer</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">
                    {stats.topPerformer ? stats.topPerformer.name : 'N/A'}
                  </span>
                  <span className="text-sm text-blue-600">
                    {stats.topPerformer ? `${stats.topPerformer.analysisCount} analyses` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Average per Doctor</span>
                <span className="font-bold text-gray-900">{stats.avgAnalysesPerDoctor}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <span className="text-gray-700 font-medium">Active Today</span>
                <span className="font-bold text-gray-900">{stats.activeToday} / {stats.totalDoctors}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                <span className="text-gray-700 font-medium">Weekly Activity</span>
                <span className="font-bold text-gray-900">{stats.recentActivity} doctors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Doctor Modal */}
      {showCreateDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Doctor Account</h3>
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Name
                </label>
                <input
                  type="text"
                  value={createDoctorForm.name}
                  onChange={(e) => setCreateDoctorForm({...createDoctorForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="Enter doctor's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gmail Address
                </label>
                <input
                  type="email"
                  value={createDoctorForm.email}
                  onChange={(e) => setCreateDoctorForm({...createDoctorForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="doctor@gmail.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must include @ symbol (e.g., doctor@gmail.com)
                </p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateDoctor(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Temporary Password Generated
              </h3>
              <p className="text-gray-600">
                Share this password with {selectedDoctor.name}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Email:</span>
                <span className="text-sm text-gray-900">{selectedDoctor.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Password:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                    {showPassword ? temporaryPassword : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(temporaryPassword)}
                    className="text-medical-600 hover:text-medical-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Doctor must change this password on first login</li>
                    <li>Cannot use the app fully until password is changed</li>
                    <li>This password will never be shown again</li>
                    <li>Doctor logs in using their Gmail with @ symbol</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPasswordModal(false);
                setSelectedDoctor(null);
                setTemporaryPassword('');
                setShowPassword(false);
              }}
              className="w-full px-4 py-2 bg-medical-600 text-white rounded-lg hover:bg-medical-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Delete Doctor Confirmation Modal */}
      {showDeleteModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Doctor Account
              </h3>
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-medium">{selectedDoctor.name}</span>'s account?
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Warning:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>This action cannot be undone</li>
                    <li>Doctor will lose access to the system immediately</li>
                    <li>All analysis history will be preserved but unlinked</li>
                    <li>Doctor will need a new account to access the system again</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDoctor(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDoctor}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center">
                    <div className="rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;