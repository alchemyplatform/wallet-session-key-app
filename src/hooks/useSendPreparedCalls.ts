import { useState } from 'react';

interface SendPreparedCallsParams {
  sessionId: string;
  signature: string;
  userOpSignature: string;
  userOpRequest: {
    sender: string;
    nonce: string;
    initCode: string;
    callData: string;
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    paymasterAndData: string;
    signature: string;
  };
  chainId: string;
}

export function useSendPreparedCalls() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);

  const sendPreparedCalls = async (params: SendPreparedCallsParams) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/wallet-send-prepared-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send prepared calls');
      }

      setResult(data.callIds);
      return data.callIds;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send prepared calls';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendPreparedCalls,
    isLoading,
    error,
    result,
  };
}
