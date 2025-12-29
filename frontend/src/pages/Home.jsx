import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  ArrowRight,
  Shield,
  Heart
} from 'lucide-react';
import BloodCellAI from '../components/icons/BloodCellAI';

const Home = () => {
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
  }, [navigate]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen py-20 bg-gradient-to-br from-[#3FC5FA] via-[#9095CF] to-[#E864A6]">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Role-based content
  const getHeroContent = () => {
    if (user.role === 'admin') {
      return {
        title: 'AI-powered Acute Lymphoblastic Leukemia Screening System: Administration',
        subtitle: 'Advanced AI-powered analytics for managing medical professionals, monitoring system performance, and overseeing leukemia screening operations with hospital-grade precision and control.',
        buttonText: 'Manage System',
        buttonLink: '/admin-dashboard',
        buttonIcon: Shield
      };
    } else {
      return {
        title: 'AI-powered Acute Lymphoblastic Leukemia Screening System',
        subtitle: 'Advanced AI-powered analysis for detecting lymphoblast cells, blood smear abnormalities, and hematological malignancies with hospital-grade precision and speed.',
        buttonText: 'Upload Blood Smear',
        buttonLink: '/analysis',
        buttonIcon: Upload
      };
    }
  };

  const heroContent = getHeroContent();

  return (
    <div className="bg-gradient-to-br from-[#3FC5FA] via-[#9095CF] to-[#E864A6] relative overflow-hidden min-h-screen pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-white/20 rounded-full"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-white/15 rounded-full"></div>
        <div className="absolute bottom-32 left-16 w-2 h-2 bg-white/25 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-white/10 rounded-full"></div>
        
        {/* Medical cross */}
        <div className="absolute top-32 right-16 w-6 h-6 text-white/20">
          <div className="w-full h-0.5 bg-current absolute top-1/2" style={{transform: 'translateY(-50%)'}}></div>
          <div className="h-full w-0.5 bg-current absolute left-1/2" style={{transform: 'translateX(-50%)'}}></div>
        </div>
        
        {/* DNA helix pattern */}
        <div className="absolute bottom-40 left-32 w-8 h-8 text-white/15">
          <div className="w-1 h-1 bg-current rounded-full absolute top-0 left-0"></div>
          <div className="w-1 h-1 bg-current rounded-full absolute top-0 right-0"></div>
          <div className="w-1 h-1 bg-current rounded-full absolute bottom-0 left-0"></div>
          <div className="w-1 h-1 bg-current rounded-full absolute bottom-0 right-0"></div>
        </div>
        
        {/* Additional gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#E864A6]/20 via-transparent to-[#3FC5FA]/20"></div>
      </div>

      {/* Main Content - Adjusted for navbar and full height */}
      <div className="relative z-10 flex flex-col py-16">
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 md:py-16">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center">
              {/* Hero Section */}
              <div className="mb-8 sm:mb-12">
                {/* Medical Icon */}
                <div className="mb-6 sm:mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/25 backdrop-blur-sm rounded-2xl mb-4 sm:mb-6 border border-white/30">
                    {user.role === 'admin' ? (
                      <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    ) : (
                      <BloodCellAI className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    )}
                  </div>
                </div>

                {/* Main Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight px-4">
                  {heroContent.title}
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                  {heroContent.subtitle}
                </p>

                {/* CTA Button */}
                <div className="px-4">
                  <Link
                    to={heroContent.buttonLink}
                    className="inline-flex items-center space-x-2 sm:space-x-3 bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold hover:bg-gray-100 shadow-xl hover:shadow-2xl"
                  >
                    <heroContent.buttonIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{heroContent.buttonText}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="px-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/25 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
                    {user.role === 'admin' ? (
                      <>
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <div className="w-2 h-2 bg-[#E864A6] rounded-full"></div>
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <div className="w-2 h-2 bg-[#3FC5FA] rounded-full"></div>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Welcome back, {user.name}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {user.role === 'admin' 
                      ? 'System Administrator • Full Access Control' 
                      : 'Medical Professional • AI Analysis Ready'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;