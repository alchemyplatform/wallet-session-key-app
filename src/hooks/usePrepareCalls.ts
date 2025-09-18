import { useState } from 'react';

interface PrepareCallsParams {
  sessionId: string;
  signature: string;
  accountAddress: string;
  chainId: string;
  calls: Array<{
    to: string;
    value?: string;
    data?: string;
  }>;
}

interface PrepareCallsResult {
  userOpRequest: any;
  signatureRequest: {
    type: string;
    data: {
      raw: string;
    };
  };
  chainId: string;
}

export function usePrepareCalls() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrepareCallsResult | null>(null);

  const prepareCalls = async (params: PrepareCallsParams) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/wallet-prepare-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare calls');
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to prepare calls';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    prepareCalls,
    isLoading,
    error,
    result,
  };
}
