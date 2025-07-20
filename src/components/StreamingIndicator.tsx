'use client';

import { Activity, Clock, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

// Types
interface StreamingIndicatorProps {
  tokensPerSecond: number;
  totalTokens: number;
  elapsedTime: number;
  isActive: boolean;
  className?: string;
  variant?: 'compact' | 'full';
  alwaysVisible?: boolean;
  showLabels?: boolean;
  animate?: boolean;
}

type SpeedCategory = 'very-slow' | 'slow' | 'medium' | 'medium-fast' | 'fast';

interface SpeedConfig {
  category: SpeedCategory;
  color: string;
  bgColor: string;
  glowColor: string;
  pulseColor: string;
  label: string;
  intensity: 'very-low' | 'low' | 'medium' | 'medium-high' | 'high';
}

// Constants
const SPEED_THRESHOLDS = {
  FAST: 200,
  MEDIUM_FAST: 100,
  MEDIUM: 50,
  SLOW: 20,
} as const;

const SPEED_CONFIGS: Record<SpeedCategory, SpeedConfig> = {
  fast: {
    category: 'fast',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    glowColor: 'shadow-green-500/50',
    pulseColor: 'bg-green-500',
    label: 'Fast',
    intensity: 'high',
  },
  'medium-fast': {
    category: 'medium-fast',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    glowColor: 'shadow-emerald-500/50',
    pulseColor: 'bg-emerald-500',
    label: 'Good',
    intensity: 'medium-high',
  },
  medium: {
    category: 'medium',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    glowColor: 'shadow-orange-500/50',
    pulseColor: 'bg-orange-500',
    label: 'Medium',
    intensity: 'medium',
  },
  slow: {
    category: 'slow',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    glowColor: 'shadow-red-500/50',
    pulseColor: 'bg-red-500',
    label: 'Slow',
    intensity: 'low',
  },
  'very-slow': {
    category: 'very-slow',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    glowColor: 'shadow-gray-500/50',
    pulseColor: 'bg-gray-500',
    label: 'Very Slow',
    intensity: 'very-low',
  },
};

const IDLE_CONFIG = {
  color: 'text-gray-500',
  bgColor: 'bg-gray-50 border-gray-200',
  label: 'Idle',
};

// Helper functions
const getSpeedCategory = (tokensPerSecond: number): SpeedCategory => {
  if (tokensPerSecond >= SPEED_THRESHOLDS.FAST) return 'fast';
  if (tokensPerSecond >= SPEED_THRESHOLDS.MEDIUM_FAST) return 'medium-fast';
  if (tokensPerSecond >= SPEED_THRESHOLDS.MEDIUM) return 'medium';
  if (tokensPerSecond >= SPEED_THRESHOLDS.SLOW) return 'slow';
  return 'very-slow';
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};

const formatTokensPerSecond = (tokensPerSecond: number): string => {
  return tokensPerSecond.toFixed(1);
};

// Sub-components
interface LiveIndicatorProps {
  isVisible: boolean;
  animate?: boolean;
}

const LiveIndicator = ({ isVisible, animate = true }: LiveIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-1.5" role="status" aria-label="Currently streaming">
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full bg-green-500 ${
            animate ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 rounded-full bg-green-500 opacity-50 ${
            animate ? 'animate-ping' : ''
          }`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

interface SpeedBadgeProps {
  speedConfig: SpeedConfig;
  tokensPerSecond: number;
  showIdleState: boolean;
  isActive: boolean;
  showLabels?: boolean;
  animate?: boolean;
}

const SpeedBadge = ({
  speedConfig,
  tokensPerSecond,
  showIdleState,
  isActive,
  showLabels = false,
  animate = true,
}: SpeedBadgeProps) => {
  const displayText = showIdleState
    ? IDLE_CONFIG.label
    : showLabels
    ? speedConfig.label
    : `${formatTokensPerSecond(tokensPerSecond)} tok/s`;

  const colorClass = showIdleState ? IDLE_CONFIG.color : speedConfig.color;
  const bgColorClass = showIdleState ? IDLE_CONFIG.bgColor : speedConfig.bgColor;

  return (
    <div className="relative">
      <Badge
        variant="secondary"
        className={`gap-1 font-mono transition-all duration-500 ${colorClass} ${bgColorClass} ${
          isActive && !showIdleState && animate
            ? `shadow-2xl ${speedConfig.glowColor}`
            : ''
        }`}
        role="status"
        aria-label={`Speed: ${displayText}`}
      >
        <Activity className="h-3 w-3" aria-hidden="true" />
        {displayText}
      </Badge>

      {/* High-speed outer glow ring */}
      {isActive &&
        !showIdleState &&
        speedConfig.intensity === 'high' &&
        animate && (
          <div
            className={`absolute inset-0 rounded-md ${speedConfig.glowColor} animate-ping opacity-40`}
            aria-hidden="true"
          />
        )}

      {/* Additional glow layer for visibility when active */}
      {isActive && !showIdleState && animate && (
        <div
          className={`absolute inset-0 rounded-md ${speedConfig.glowColor} opacity-30 blur-sm`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

interface MetricBadgeProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  showIdleState: boolean;
}

const MetricBadge = ({ icon: Icon, value, label, showIdleState }: MetricBadgeProps) => (
  <Badge
    variant="outline"
    className="gap-1 font-mono transition-all duration-300"
    role="status"
    aria-label={`${label}: ${value}`}
  >
    <Icon className="h-3 w-3" aria-hidden="true" />
    {showIdleState ? (label === 'Total tokens' ? '0 tokens' : '0.0s') : value}
  </Badge>
);

// Main component
export function StreamingIndicator({
  tokensPerSecond,
  totalTokens,
  elapsedTime,
  isActive,
  className = '',
  variant = 'full',
  alwaysVisible = false,
  showLabels = false,
  animate = true,
}: StreamingIndicatorProps) {
  // Memoized calculations
  const speedConfig = useMemo(
    () => SPEED_CONFIGS[getSpeedCategory(tokensPerSecond)],
    [tokensPerSecond]
  );

  const showIdleState = useMemo(
    () => alwaysVisible && !isActive && totalTokens === 0,
    [alwaysVisible, isActive, totalTokens]
  );

  const shouldShow = useMemo(
    () => alwaysVisible || isActive || totalTokens > 0,
    [alwaysVisible, isActive, totalTokens]
  );

  const formattedTime = useMemo(
    () => formatTime(elapsedTime),
    [elapsedTime]
  );

  // Early return if component shouldn't be shown
  if (!shouldShow) {
    return null;
  }

  const baseClassName = `flex items-center text-xs ${className}`;

  if (variant === 'compact') {
    return (
      <div className={`${baseClassName} gap-2`}>
        <SpeedBadge
          speedConfig={speedConfig}
          tokensPerSecond={tokensPerSecond}
          showIdleState={showIdleState}
          isActive={isActive}
          showLabels={showLabels}
          animate={animate}
        />
        <LiveIndicator isVisible={isActive && !showIdleState} animate={animate} />
      </div>
    );
  }

  return (
    <div className={`${baseClassName} gap-3`} role="region" aria-label="Streaming statistics">
      <SpeedBadge
        speedConfig={speedConfig}
        tokensPerSecond={tokensPerSecond}
        showIdleState={showIdleState}
        isActive={isActive}
        showLabels={showLabels}
        animate={animate}
      />

      <MetricBadge
        icon={Hash}
        value={`${totalTokens} tokens`}
        label="Total tokens"
        showIdleState={showIdleState}
      />

      <MetricBadge
        icon={Clock}
        value={formattedTime}
        label="Elapsed time"
        showIdleState={showIdleState}
      />

      <LiveIndicator isVisible={isActive && !showIdleState} animate={animate} />
    </div>
  );
}