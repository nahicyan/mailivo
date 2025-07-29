import React from 'react';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`w-full ${className}`}>
      {/* Main header container with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Logo container with centered alignment */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Logo image */}
              <div className="flex-shrink-0">
                <img
                  src="https://cdn.landivo.com/wp-content/uploads/2025/04/logo.svg"
                  alt="Company Logo"
                  className="h-12 w-auto sm:h-16 md:h-20 transition-all duration-300 hover:scale-105"
                  style={{
                    maxWidth: '200px',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Optional tagline section */}
          <div className="mt-4 text-center">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom border accent */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
    </header>
  );
};

// Default export
export default Header;