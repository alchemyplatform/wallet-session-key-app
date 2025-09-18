import { useState } from 'react';
import { privateKeyToAccount } from 'viem/accounts';

export function useSessionKeySigner() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signWithSessionKey = async (privateKey: `0x${string}`, message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create account from private key
      const account = privateKeyToAccount(privateKey);
      
      console.log('Signing with session key:', account.address);
      console.log('Message to sign:', message);

      // Sign the message using the account's signMessage method
      const signature = await account.signMessage({
        message: { raw: message as `0x${string}` },
      });

      console.log('Signature created:', signature);
      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign with session key';
      setError(errorMessage);
      console.error('Error signing with session key:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signWithSessionKey,
    isLoading,
    error,
  };
}
