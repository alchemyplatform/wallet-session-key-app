import { useState } from 'react';
import { SessionKey } from '../utils/sessionKey';

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
  expiry?: number; // Unix timestamp, defaults to 24 hours from now
  permissionType?: 'root' | 'native-token-transfer' | 'erc20-token-transfer'; // Permission type for the session
}

export function useSession() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  const createSession = async ({ account, chainId, expiry, permissionType = 'root' }: CreateSessionParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Default to 24 hours from now if no expiry provided
      const sessionExpiry = expiry || Math.floor(Date.now() / 1000) + (24 * 60 * 60);
      
      console.log('Creating session for account:', account);
      console.log('Chain ID:', chainId);
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
          permissionType, // Pass the selected permission type
        }),
      });

      const data = await response.json();
      
      console.log('=== SESSION CREATION RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Full response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Check if the response has the expected structure
        const sessionData = data.result || data;
        
        console.log('Session data:', JSON.stringify(sessionData, null, 2));
        
        // Use the signatureRequest directly from the API response
        // The Alchemy API returns the correct structure with type, data, and rawPayload
        const signatureRequest = sessionData.signatureRequest;
        
        if (!signatureRequest) {
          console.error('No signatureRequest found in session creation response');
          console.error('Available fields in sessionData:', Object.keys(sessionData));
          console.error('Full sessionData structure:', JSON.stringify(sessionData, null, 2));
          console.error('Permission type:', permissionType);
          
          // Check if the session creation actually failed
          if (sessionData.error) {
            throw new Error(`Session creation failed: ${sessionData.error.message || sessionData.error}`);
          }
          
          throw new Error('No signatureRequest found in session creation response');
        }
        
        // Get session key from backend response
        const sessionKey = data.sessionKey;
        if (!sessionKey) {
          throw new Error('No session key returned from backend');
        }
        
        const sessionResult = {
          sessionId: sessionData.sessionId,
          signatureRequest,
          sessionKey, // Use session key from backend
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
