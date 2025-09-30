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

  const signSessionAuthorization = async (sessionId: string, signatureRequest: {
    type: string;
    data?: {
      raw?: string;
      domain?: {
        chainId?: number;
        verifyingContract?: string;
        name?: string;
        version?: string;
      };
      types?: Record<string, Array<{ name: string; type: string }>>;
      primaryType?: string;
      message?: Record<string, unknown>;
    };
    rawPayload?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!signer) {
        throw new Error('No signer available');
      }

      console.log('Signing session authorization for session:', sessionId);
      console.log('Signature request type:', signatureRequest.type);

      // Validate the signature request data before signing
      if (!signatureRequest) {
        throw new Error('signatureRequest is undefined or null');
      }

      // Check if we have the required data for signing
      const hasTypedData = signatureRequest.type === 'eth_signTypedData_v4' && signatureRequest.data;
      const hasSimpleMessage = signatureRequest.data?.raw && typeof signatureRequest.data.raw === 'string';
      const hasRawPayload = signatureRequest.rawPayload && typeof signatureRequest.rawPayload === 'string';

      if (!hasTypedData && !hasSimpleMessage && !hasRawPayload) {
        throw new Error('No valid signing data found in signatureRequest');
      }

      // Sign the signature request using the signer
      // Check if this is EIP-712 typed data signing or simple message signing
      let signature: string;
      
      if (signatureRequest.type === 'eth_signTypedData_v4') {
        // This is EIP-712 typed data signing
        // For EIP-712, we need to sign the typed data structure
        if (!signatureRequest.data) {
          throw new Error('EIP-712 typed data is missing from signature request');
        }
        
        // Ensure we have the required EIP-712 structure
        const typedData = {
          domain: signatureRequest.data.domain || {},
          types: signatureRequest.data.types || {},
          primaryType: signatureRequest.data.primaryType || '',
          message: signatureRequest.data.message || {}
        };
        
        signature = await signer.signTypedData(typedData);
      } else if (signatureRequest.data?.raw) {
        // This is simple message signing
        signature = await signer.signMessage(signatureRequest.data.raw);
      } else if (signatureRequest.rawPayload) {
        // Fallback: use rawPayload as the message to sign
        signature = await signer.signMessage(signatureRequest.rawPayload);
      } else {
        throw new Error('No valid signing data found in signatureRequest');
      }
      
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
