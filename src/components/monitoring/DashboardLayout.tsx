import React, { useState, useEffect, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MonitoringService } from '@/services/monitoring.service';

// Lazily load dashboard components to improve initial load time
const PerformanceMonitor = React.lazy(() => import('./PerformanceMonitor'));
const AnomalyInsights = React.lazy(() => import('./AnomalyInsights'));
const TrendAnalyzer = React.lazy(() => import('./TrendAnalyzer'));
const PredictiveInsights = React.lazy(() => import('./PredictiveInsights'));
const SystemHealth = React.lazy(() => import('./SystemHealth'));

const LoadingFallback = () => (
  <div className="p-6 bg-white rounded-lg shadow animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-32 bg-gray-200 rounded"></div>
  </div>
);

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-red-800">
    <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
    <p className="text-sm mb-4">{error.message}</p>
    <button 
      onClick={resetErrorBoundary} 
      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
    >
      Try again
    </button>
  </div>
);

interface DashboardProps {
  defaultActivePanel?: string;
}

export default function DashboardLayout({ defaultActivePanel = 'performance' }: DashboardProps) {
  const [activePanel, setActivePanel] = useState(defaultActivePanel);
  const [systemStatus, setSystemStatus] = useState<{
    healthy: boolean,
    services: { name: string, status: 'up' | 'down' | 'degraded' }[]
  }>({ healthy: true, services: [] });
  
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const monitoringService = MonitoringService.getInstance();
        const status = await monitoringService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      }
    };
    
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const renderActivePanel = () => {
    switch (activePanel) {
      case 'performance':
        return <PerformanceMonitor />;
      case 'anomalies':
        return <AnomalyInsights anomalyId="latest" />;
      case 'trends':
        return <TrendAnalyzer metric="transaction_volume" period="7d" />;
      case 'predictions':
        return <PredictiveInsights />;
      case 'health':
        return <SystemHealth />;
      default:
        return <PerformanceMonitor />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with system status indicator */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-semibold text-gray-900">MT103 Monitoring Dashboard</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">System Status:</span>
              <div className={`h-3 w-3 rounded-full ${systemStatus.healthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${systemStatus.healthy ? 'text-green-700' : 'text-red-700'}`}>
                {systemStatus.healthy ? 'Healthy' : 'Issues Detected'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 overflow-x-auto">
          {[
            { id: 'performance', label: 'Performance' },
            { id: 'anomalies', label: 'Anomalies' },
            { id: 'trends', label: 'Trends' },
            { id: 'predictions', label: 'Predictions' },
            { id: 'health', label: 'System Health' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activePanel === tab.id 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setActivePanel('performance')}>
          <Suspense fallback={<LoadingFallback />}>
            {renderActivePanel()}
          </Suspense>
        </ErrorBoundary>
        
        {/* Service status list */}
        {systemStatus.services.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Service Status</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {systemStatus.services.map(service => (
                <li key={service.name} className="px-4 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.status === 'up' ? 'bg-green-100 text-green-800' : 
                      service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
