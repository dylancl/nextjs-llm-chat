"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, AlertTriangle } from "lucide-react";
import { BonzaiUsage } from "@/app/api/bonzai-usage/route";

export function BonzaiUsageIndicator() {
  const [usage, setUsage] = useState<BonzaiUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/bonzai-usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
        setError(null);
      } else {
        setError("Failed to fetch usage data");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded w-full mb-2"></div>
          <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Bonzai Usage Unavailable</span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
      </Card>
    );
  }

  const timeUntilReset =
    new Date(usage.nextReset).getTime() - new Date().getTime();
  const hoursUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60));

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
            Bonzai API Usage
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          Tracking
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Total Requests */}
        <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Total Requests
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {usage.totalRequests.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Today: {usage.requestsToday.toLocaleString()}
          </div>
        </div>

        {/* Input Tokens */}
        <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              Input Tokens
            </span>
            <span className="text-lg font-bold text-green-900 dark:text-green-100">
              {usage.totalInputTokens.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Today: {usage.inputTokensToday.toLocaleString()}
          </div>
        </div>

        {/* Output Tokens */}
        <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-800 dark:text-purple-200">
              Output Tokens
            </span>
            <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
              {usage.totalOutputTokens.toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            Today: {usage.outputTokensToday.toLocaleString()}
          </div>
        </div>

        {/* Total Tokens Summary */}
        <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Total Tokens
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {(
                usage.totalInputTokens + usage.totalOutputTokens
              ).toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Today:{" "}
            {(
              usage.inputTokensToday + usage.outputTokensToday
            ).toLocaleString()}
          </div>
        </div>

        {/* Reset Timer */}
        <div className="flex items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
          <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Daily counters reset in {hoursUntilReset}h
          </span>
        </div>
      </div>
    </Card>
  );
}
