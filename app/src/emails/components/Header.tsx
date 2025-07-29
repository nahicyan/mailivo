import React from 'react';

interface HeaderProps {
  className?: string;
  showBottomBorder?: boolean;
}

function Header({ 
  className = '', 
  showBottomBorder = true
}: HeaderProps) {
  return (
    <header className={`w-full ${className}`}>
      {/* Email-optimized header with table-based layout for better compatibility */}
      <div className="bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Logo container - centered with proper spacing */}
          <div className="text-center">
            <table className="w-full" cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ padding: '20px 0' }}>
                    <img
                      src="https://cdn.landivo.com/wp-content/uploads/2025/04/logo.svg"
                      alt="Company Logo"
                      className="inline-block max-w-full h-auto"
                      style={{
                        display: 'block',
                        margin: '0 auto',
                        maxWidth: '250px',
                        width: 'auto',
                        height: 'auto',
                        maxHeight: '80px',
                      }}
                      width="250"
                      height="80"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Elegant bottom border */}
      {showBottomBorder && (
        <div className="border-b-2 border-gray-200" style={{ borderBottom: '2px solid #e5e7eb' }}></div>
      )}
    </header>
  );
}

// Named export to match your import pattern
export { Header };

// Default export for flexibility
export default Header;