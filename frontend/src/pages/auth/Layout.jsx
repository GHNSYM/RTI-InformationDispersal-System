import { Fragment } from 'react';
import titleImage from '/src/assets/title.png';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0">
              <img
                className="h-8 w-auto"
                src={titleImage}
                alt="RTI System"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;