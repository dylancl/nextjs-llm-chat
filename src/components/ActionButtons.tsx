import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ActionButtonsProps {
  hasMessages: boolean;
  onClear: () => void;
  totalConversationTokens: number;
}

/**
 * ActionButtons renders the Send, Stop, and Clear buttons for ChatInput.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  hasMessages,
  onClear,
  totalConversationTokens,
}) => (
  <>
    {hasMessages && (
      <div className="flex flex-col justify-end gap-3 min-h-[72px] animate-in slide-in-from-right-2 fade-in duration-500">
        {/* Enhanced total tokens indicator */}
        {totalConversationTokens > 0 && (
          <div className="bg-background/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/30 shadow-sm self-center animate-in slide-in-from-bottom-1 fade-in duration-300 delay-100">
            <span className="text-xs text-muted-foreground font-medium">
              {totalConversationTokens.toLocaleString()}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          onClick={onClear}
          disabled={!hasMessages}
          className={`$ {
            totalConversationTokens > 0
              ? 'h-14 w-12'
              : 'h-[72px] w-14'
          } p-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-400 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 rounded-xl border-2 shadow-sm hover:shadow-md disabled:opacity-50 animate-in slide-in-from-bottom-2 fade-in duration-300 delay-200`}
        >
          <Trash2
            className={totalConversationTokens > 0 ? 'h-4 w-4' : 'h-5 w-5'}
          />
        </Button>
      </div>
    )}
  </>
);
