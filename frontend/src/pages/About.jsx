import React from 'react';
import { Activity } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col pt-16">
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="icon-wrapper bg-gradient-to-br from-medical-500 to-primary-600">
                  <Activity className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold gradient-text mb-6">
                AI-powered Acute Lymphoblastic Leukemia Screening System
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Our AI-powered system screens for Acute Lymphoblastic Leukemia through automated 
                blood smear analysis, providing healthcare professionals with rapid and accurate 
                diagnostic capabilities to improve patient outcomes.
              </p>
            </div>

            {/* How It Works Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold gradient-text text-center mb-12">
                How It Works
              </h2>
              
              {/* Workflow Steps */}
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-white rounded-xl shadow-soft">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload Blood Smear</h3>
                  <p className="text-gray-600">Upload high-quality blood smear images for analysis</p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-xl shadow-soft">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Analysis</h3>
                  <p className="text-gray-600">Advanced AI algorithms analyze cellular structures</p>
                </div>
                
                <div className="text-center p-6 bg-white rounded-xl shadow-soft">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Results</h3>
                  <p className="text-gray-600">Receive detailed diagnostic results and recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;