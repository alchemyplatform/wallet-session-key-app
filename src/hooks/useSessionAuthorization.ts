import { useSigner } from '@account-kit/react';
import { useState } from 'react';

interface SessionAuthorizationResult {
  sessionId: string;
  signature: string;
  authorization: string; // The hex-concatenation of 0x00 + sessionId + signature
}

export function useSessionAuthorization() {
  const signer = useSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionAuthorizationResult | null>(null);

  const signSessionAuthorization = async (sessionId: string, signatureRequest: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!signer) {
        throw new Error('No signer available');
      }

      console.log('Signing session authorization for session:', sessionId);
      console.log('Signature request:', signatureRequest);

      // Sign the signature request using the signer
      const signature = await signer.signTypedData(signatureRequest.data);
      
      console.log('Signature created:', signature);

      // Create the hex-concatenation of 0x00 + sessionId + signature
      const authorization = `0x00${sessionId.slice(2)}${signature.slice(2)}`;
      
      const authorizationResult = {
        sessionId,
        signature,
        authorization,
      };

      setResult(authorizationResult);
      console.log('Session authorization completed:', authorizationResult);
      console.log('Authorization (0x00 + sessionId + signature):', authorization);
      
      return authorizationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign session authorization';
      setError(errorMessage);
      console.error('Error signing session authorization:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signSessionAuthorization,
    isLoading,
    error,
    result,
  };
}
