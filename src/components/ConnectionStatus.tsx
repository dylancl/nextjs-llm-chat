'use client';

import { Circle, CheckCircle, XCircle } from 'lucide-react';
import { ConnectionStatus } from '@/hooks/useApiConfig';

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus;
  mockMode?: boolean;
  className?: string;
}

export function ConnectionStatusIndicator({
  status,
  mockMode = false,
  className = '',
}: ConnectionStatusIndicatorProps) {
  const getIcon = () => {
    if (mockMode) {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }

    switch (status) {
      case 'connecting':
        return <Circle className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'model-error':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getText = () => {
    if (mockMode) {
      return 'Mock Mode';
    }

    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'model-error':
        return 'Model Unavailable';
      default:
        return 'Not Connected';
    }
  };

  const getStatusColor = () => {
    if (mockMode) {
      return 'text-blue-600';
    }

    switch (status) {
      case 'connected':
        return 'text-emerald-600';
      case 'connecting':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      case 'model-error':
        return 'text-orange-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className} animate-pulse`}>
      {getIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getText()}
      </span>
    </div>
  );
}
