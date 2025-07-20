import { useState, useEffect, useCallback } from "react";
import { BonzaiUsage } from "@/app/api/bonzai-usage/route";
import { BraveUsage } from "@/app/api/brave-usage/route";

export interface UsageData {
  bonzai: BonzaiUsage | null;
  brave: BraveUsage | null;
  loading: boolean;
  error: string | null;
}

export function useUsageTracking() {
  const [data, setData] = useState<UsageData>({
    bonzai: null,
    brave: null,
    loading: true,
    error: null,
  });

  const fetchUsage = useCallback(async () => {
    try {
      const [bonzaiResponse, braveResponse] = await Promise.all([
        fetch("/api/bonzai-usage"),
        fetch("/api/brave-usage"),
      ]);

      const bonzaiData = bonzaiResponse.ok ? await bonzaiResponse.json() : null;
      const braveData = braveResponse.ok ? await braveResponse.json() : null;

      setData({
        bonzai: bonzaiData?.usage || null,
        brave: braveData?.usage || null,
        loading: false,
        error: null,
      });
    } catch {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch usage data",
      }));
    }
  }, []);

  const refreshUsage = useCallback(() => {
    setData((prev) => ({ ...prev, loading: true }));
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    fetchUsage();
    // Refresh every minute
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  return {
    ...data,
    refreshUsage,
  };
}
