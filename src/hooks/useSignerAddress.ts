import { useSigner } from '@account-kit/react';
import { useState } from 'react';

export function useSignerAddress() {
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAddress = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const address = await signer?.getAddress();
      if (!address) {
        throw new Error('No signer address available');
      }
      return address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get signer address';
      setError(errorMessage);
      console.error('Error getting signer address:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAddress,
    isLoading,
    error,
  };
}
