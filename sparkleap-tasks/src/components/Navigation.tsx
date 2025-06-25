import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between py-4 border-b border-gray-200 bg-white">
      <div className="text-2xl font-bold">SparkLeap</div>
      <div className="flex space-x-2">
        <Link
          href="/kpi"
          className={`px-4 py-2 rounded-t-md font-medium transition-colors duration-150 ${
            pathname === '/kpi'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-100 text-blue-700 hover:bg-blue-50'
          }`}
        >
          KPI Dashboard
        </Link>
        <Link
          href="/tasks"
          className={`px-4 py-2 rounded-t-md font-medium transition-colors duration-150 ${
            pathname === '/tasks'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-gray-100 text-blue-700 hover:bg-blue-50'
          }`}
        >
          Task Manager
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
