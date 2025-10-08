import { useState } from 'react';

interface CallsStatusResult {
  atomic: boolean;
  chainId: `0x${string}`;
  id: `0x${string}`;
  receipts?: object[];
  status: 100 | 200 | 400 | 500 | 600;
}

export function useGetCallsStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CallsStatusResult | null>(null);

  const getCallsStatus = async (callId: string): Promise<CallsStatusResult> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
        throw new Error('Alchemy API key not configured');
      }

      const request = {
        id: 1,
        jsonrpc: '2.0',
        method: 'wallet_getCallsStatus',
        params: [callId]
      };

      const endpoint = `https://api.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API error: ${errorData}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`API error: ${data.error.message}`);
      }

      const statusResult = data.result as CallsStatusResult;
      setResult(statusResult);
      return statusResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get calls status';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getCallsStatus,
    isLoading,
    error,
    result,
  };
}
