import { useState } from 'react';
import { generateSessionKey, SessionKey } from '../utils/sessionKey';

interface SessionResult {
  sessionId: string;
  signatureRequest: {
    type: string;
    data: {
      raw: string;
    };
  };
  sessionKey: SessionKey; // Store the generated session key
}

interface CreateSessionParams {
  account: string;
  chainId: string;
  sessionKeyAddress?: string; // Make optional since we'll generate it
  expiry?: number; // Unix timestamp, defaults to 24 hours from now
}

export function useSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  const createSession = async ({ account, chainId, sessionKeyAddress, expiry }: CreateSessionParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a new session key if not provided
      const sessionKey = sessionKeyAddress ? 
        { privateKey: '0x' as `0x${string}`, address: sessionKeyAddress as `0x${string}` } : 
        generateSessionKey();
      
      console.log('Generated session key:', {
        address: sessionKey.address,
        privateKey: sessionKey.privateKey.slice(0, 10) + '...' // Don't log full private key
      });

      // Default to 24 hours from now if no expiry provided
      const sessionExpiry = expiry || Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      
      console.log('Creating session for account:', account);
      console.log('Chain ID:', chainId);
      console.log('Session Key Address:', sessionKey.address);
      console.log('Expiry:', new Date(sessionExpiry * 1000).toISOString());
      
      const response = await fetch('/api/wallet-create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account,
          chainId,
          expiry: sessionExpiry,
          publicKey: sessionKey.address, // Use the generated session key address
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Check if the response has the expected structure
        const sessionData = data.result || data;
        
        // Use the signatureRequest directly from the API response
        // The Alchemy API returns the correct structure with type, data, and rawPayload
        const signatureRequest = sessionData.signatureRequest;
        
        if (!signatureRequest) {
          throw new Error('No signatureRequest found in session creation response');
        }
        
        const sessionResult = {
          sessionId: sessionData.sessionId,
          signatureRequest,
          sessionKey, // Include the session key in the result
        };
        
        setResult(sessionResult);
        console.log('Session created successfully:', sessionResult);
        
        return sessionResult;
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      console.error('Error creating session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createSession,
    isLoading,
    error,
    result,
  };
}
