import { useState } from 'react';

interface SmartAccountResult {
  accountAddress: string;
  id: string;
}

export function useSmartAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SmartAccountResult | null>(null);

  const requestAccount = async (signerAddress: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Requesting account for signer:', signerAddress);
      
      const response = await fetch('/api/wallet-request-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signerAddress: signerAddress,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const smartAccountResult = {
          accountAddress: data.result?.accountAddress,
          id: data.result?.id,
        };
        
        setResult(smartAccountResult);
        console.log('Account request successful:', data);
        console.log('Smart Account Address:', smartAccountResult.accountAddress);
        console.log('Account ID:', smartAccountResult.id);
        
        return smartAccountResult;
      } else {
        throw new Error(data.error || 'Failed to request smart account');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request smart account';
      setError(errorMessage);
      console.error('Error requesting smart account:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestAccount,
    isLoading,
    error,
    result,
  };
}
