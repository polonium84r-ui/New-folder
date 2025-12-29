import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  Filter,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  User,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }
    
    setUser(JSON.parse(userData));
    
    fetchAnalyses();
  }, [navigate, currentPage, filterResult, sortBy]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/analysis', {
        params: {
          page: currentPage,
          limit: 10,
          result: filterResult !== 'all' ? filterResult : undefined,
          sort: sortBy
        }
      });
      
      setAnalyses(response.data.analyses || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
      toast.error('Failed to load analysis history');
      // Set empty arrays on error
      setAnalyses([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from actual analysis data
  const calculateStats = () => {
    // Use total count from API if available, otherwise use current page data
    const totalAnalyses = totalCount > 0 ? totalCount : analyses.length;
    
    // Calculate this week's analyses from current page data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekAnalyses = analyses.filter(analysis => {
      const analysisDate = new Date(analysis.createdAt);
      return analysisDate >= oneWeekAgo;
    }).length;
    
    // Calculate positive results from current page data
    const positiveResults = analyses.filter(analysis => 
      analysis.analysisResults?.prediction === 'positive'
    ).length;
    
    return {
      totalAnalyses,
      thisWeekAnalyses,
      positiveResults
    };
  };

  const stats = calculateStats();

  const getResultIcon = (prediction) => {
    switch (prediction) {
      case 'positive':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'negative':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'uncertain':
        return <Info className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getResultColor = (prediction) => {
    switch (prediction) {
      case 'positive':
        return 'text-red-600 bg-red-50';
      case 'negative':
        return 'text-green-600 bg-green-50';
      case 'uncertain':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getResultText = (prediction) => {
    switch (prediction) {
      case 'positive':
        return 'Leukemia';
      case 'negative':
        return 'No Leukemia';
      case 'uncertain':
        return 'Uncertain';
      default:
        return 'Processing';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = searchTerm === '' || 
      analysis.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.patientId?.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterResult === 'all' || 
      analysis.analysisResults?.prediction === filterResult;
    
    return matchesSearch && matchesFilter;
  });

  const handleRefresh = () => {
    fetchAnalyses();
    toast.success('Analysis history refreshed');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen py-20 bg-gray-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 min-h-screen pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <History className="w-8 h-8 mr-3" />
                Analysis History
              </h1>
              <p className="text-gray-600">
                Review your past blood smear analyses and results
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleRefresh}
                className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <Link 
                to="/analysis"
                className="flex items-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700"
              >
                <FileText className="w-4 h-4" />
                <span>New Analysis</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAnalyses}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekAnalyses}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Positive Results</p>
                <p className="text-2xl font-bold text-red-600">{stats.positiveResults}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalAnalyses > 0 ? Math.round(((stats.totalAnalyses - stats.positiveResults) / stats.totalAnalyses) * 100) : 0}%
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              {/* Result Filter */}
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              >
                <option value="all">All Results</option>
                <option value="positive">Leukemia Detected</option>
                <option value="negative">No Leukemia</option>
                <option value="uncertain">Uncertain</option>
              </select>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="confidence">Highest Confidence</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredAnalyses.length} of {stats.totalAnalyses} analyses
            </div>
          </div>
        </div>

        {/* Analysis Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analysis history...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterResult !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by uploading your first blood smear image for analysis'
                }
              </p>
              <Link 
                to="/analysis"
                className="inline-flex items-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-lg hover:bg-medical-700"
              >
                <FileText className="w-4 h-4" />
                <span>New Analysis</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-11 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Result</div>
                  <div className="col-span-2">Confidence</div>
                  <div className="col-span-2">Status</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredAnalyses.map((analysis) => {
                  const dateTime = formatDate(analysis.createdAt);
                  return (
                    <div key={analysis._id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="grid grid-cols-11 gap-4 items-center">
                        {/* Patient */}
                        <div className="col-span-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-full">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {analysis.patientId?.name || 'Unknown Patient'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {analysis.patientId?.patientId || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{dateTime.date}</p>
                              <p className="text-xs text-gray-500">{dateTime.time}</p>
                            </div>
                          </div>
                        </div>

                        {/* Result */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            {getResultIcon(analysis.analysisResults?.prediction)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(analysis.analysisResults?.prediction)}`}>
                              {getResultText(analysis.analysisResults?.prediction)}
                            </span>
                          </div>
                        </div>

                        {/* Confidence */}
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  analysis.analysisResults?.prediction === 'positive' ? 'bg-red-500' :
                                  analysis.analysisResults?.prediction === 'negative' ? 'bg-green-500' : 'bg-yellow-500'
                                }`}
                                style={{ width: `${(analysis.analysisResults?.confidence || 0) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round((analysis.analysisResults?.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                            analysis.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {analysis.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {analysis.status === 'processing' && <Clock className="w-3 h-3 mr-1" />}
                            <span className="capitalize">{analysis.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;