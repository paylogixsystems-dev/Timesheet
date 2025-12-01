import React, { useState } from 'react';
import { UserRole } from './types';
import { EmployeeView } from './components/EmployeeView';
import { HRView } from './components/HRView';
import { Briefcase, UserCircle, LayoutDashboard, Info } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Demo Banner */}
      {showBanner && (
        <div className="bg-indigo-900 text-indigo-100 px-4 py-3 text-sm flex items-start justify-center relative">
            <div className="flex items-center gap-2 max-w-4xl">
                <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                <p>
                    <strong>Demo Mode:</strong> Data is saved locally in your browser. To sync data between multiple users in production, you must connect this app to a backend database (see <code>services/storageService.ts</code>).
                </p>
            </div>
            <button onClick={() => setShowBanner(false)} className="absolute right-4 top-3 text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                TeamSync
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setRole(UserRole.EMPLOYEE)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === UserRole.EMPLOYEE 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <UserCircle className="w-4 h-4" /> Employee
                </button>
                <button
                  onClick={() => setRole(UserRole.HR)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    role === UserRole.HR
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" /> HR Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in-up">
          {role === UserRole.EMPLOYEE ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">My Timesheet</h1>
                  <p className="text-slate-500">Log your work hours easily using our smart form.</p>
                </div>
              </div>
              <EmployeeView />
            </div>
          ) : (
             <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">HR Dashboard</h1>
                  <p className="text-slate-500">Overview of team submissions and project hours.</p>
                </div>
              </div>
              <HRView />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
