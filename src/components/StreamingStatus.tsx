import React from 'react';

type StreamingConfig = {
  borderColor: string;
  bgColor: string;
  glowColor: string;
  ringColor: string;
  animation: string;
  bgGlow: string;
  pulseColor: string;
  glowAnimation: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  intensity: string;
  speed: string;
};

interface StreamingStatusProps {
  isStreaming: boolean;
  tokensPerSecond: number;
  totalTokens: number;
  streamingConfig: StreamingConfig;
}

/**
 * StreamingStatus renders the status overlays for streaming (tok/s and total tokens).
 */
export const StreamingStatus: React.FC<StreamingStatusProps> = ({
  isStreaming,
  tokensPerSecond,
  totalTokens,
  streamingConfig,
}) => {
  if (!isStreaming) return null;
  return (
    <div className="absolute bottom-3 left-4 flex items-center gap-3 pointer-events-none z-20">
      <div
        className="flex items-center gap-2 backdrop-blur-xl px-3 py-1.5 rounded-lg border shadow-lg animate-breathe"
        style={{
          background: `linear-gradient(135deg, \
            ${streamingConfig.primaryColor}10 0%, \
            ${streamingConfig.accentColor}05 100%)`,
          borderColor: `${streamingConfig.primaryColor}20`,
          boxShadow: `0 4px 20px ${streamingConfig.primaryColor}15`,
        }}
      >
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full animate-pulse"
              style={{
                backgroundColor: streamingConfig.primaryColor,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s',
                boxShadow: `0 0 4px ${streamingConfig.primaryColor}60`,
              }}
            />
          ))}
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: streamingConfig.primaryColor }}
        >
          {tokensPerSecond > 0
            ? `${tokensPerSecond.toFixed(0)} tok/s`
            : 'Streaming'}
        </span>
      </div>
      {totalTokens > 0 && (
        <div
          className="backdrop-blur-xl px-3 py-1.5 rounded-lg border shadow-lg"
          style={{
            background: `linear-gradient(135deg, \
              ${streamingConfig.primaryColor}08 0%, \
              ${streamingConfig.accentColor}03 100%)`,
            borderColor: `${streamingConfig.primaryColor}15`,
          }}
        >
          <span className="text-xs text-muted-foreground font-medium">
            {totalTokens.toLocaleString()} tokens
          </span>
        </div>
      )}
    </div>
  );
};
