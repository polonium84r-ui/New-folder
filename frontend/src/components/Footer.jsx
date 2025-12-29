// Footer component for the ALL Screening System

const Footer = ({ variant = 'default' }) => {
  const isCompact = variant === 'compact';
  
  return (
    <footer className={`bg-white border-t border-gray-200 ${isCompact ? 'py-8' : 'py-12'} mt-auto`}>
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Built Validation By Section */}
        <div className="text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-6">
            BUILT VALIDATION BY
          </p>
          
          {/* Team Members */}
          <div className={`grid md:grid-cols-3 gap-${isCompact ? '6' : '8'} max-w-4xl mx-auto`}>
            {/* UI Designer */}
            <div className="text-center">
              <div className={`bg-gray-50 rounded-lg ${isCompact ? 'p-4' : 'p-6'} hover:bg-gray-100 transition-colors`}>
                <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-1`}>
                  Aravindan
                </h3>
                <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
                  UI DESIGNER
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Crafting intuitive medical interfaces
                </p>
              </div>
            </div>

            {/* Frontend Developer */}
            <div className="text-center">
              <div className={`bg-gray-50 rounded-lg ${isCompact ? 'p-4' : 'p-6'} hover:bg-gray-100 transition-colors`}>
                <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-1`}>
                  Ashwin Karthik
                </h3>
                <p className="text-sm text-green-600 font-medium uppercase tracking-wide mb-2">
                  FRONTEND DEVELOPER
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Building responsive clinical workflows
                </p>
              </div>
            </div>

            {/* Backend Developer */}
            <div className="text-center">
              <div className={`bg-gray-50 rounded-lg ${isCompact ? 'p-4' : 'p-6'} hover:bg-gray-100 transition-colors`}>
                <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-1`}>
                  Devaprakash
                </h3>
                <p className="text-sm text-purple-600 font-medium uppercase tracking-wide mb-2">
                  BACKEND DEVELOPER
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ensuring secure data processing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;