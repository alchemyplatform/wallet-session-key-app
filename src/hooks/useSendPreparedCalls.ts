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

      console.log('=== SEND PREPARED CALLS RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Full response data:', JSON.stringify(data, null, 2));
      console.log('data.callIds:', data.callIds);
      console.log('data.callIds type:', typeof data.callIds);
      console.log('data.callIds is array:', Array.isArray(data.callIds));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send prepared calls');
      }

      // Handle different possible response structures
      let callIds = data.callIds;
      
      console.log('=== PROCESSING CALL IDS ===');
      console.log('Initial callIds:', callIds);
      console.log('callIds type:', typeof callIds);
      console.log('callIds is array:', Array.isArray(callIds));
      
      // If callIds is not an array, try to extract it from the result
      if (!Array.isArray(callIds)) {
        console.log('callIds is not an array, checking alternatives...');
        console.log('callIds object:', callIds);
        console.log('callIds object keys:', Object.keys(callIds || {}));
        
        // Check if it's a single value that should be wrapped in an array
        if (callIds && typeof callIds === 'string') {
          callIds = [callIds];
          console.log('Wrapped single callId in array:', callIds);
        }
        // Check if callIds is an object with transaction data
        else if (callIds && typeof callIds === 'object') {
          console.log('callIds is an object, checking for transaction data...');
          
          // First check for preparedCallIds array (the actual structure we're getting)
          if (callIds.preparedCallIds && Array.isArray(callIds.preparedCallIds)) {
            callIds = callIds.preparedCallIds;
            console.log('Found preparedCallIds array:', callIds);
          }
          // Check for common transaction hash field names
          else {
            const possibleTxFields = ['hash', 'txHash', 'transactionHash', 'id', 'callId', 'result'];
            for (const field of possibleTxFields) {
              if (callIds[field]) {
                console.log(`Found transaction field '${field}':`, callIds[field]);
                if (typeof callIds[field] === 'string') {
                  callIds = [callIds[field]];
                  console.log('Extracted transaction hash:', callIds);
                  break;
                } else if (Array.isArray(callIds[field])) {
                  callIds = callIds[field];
                  console.log('Extracted transaction array:', callIds);
                  break;
                }
              }
            }
          }
          
          // If we still haven't found anything, check if the object itself contains useful data
          if (!Array.isArray(callIds)) {
            console.log('No transaction fields found, checking object structure...');
            console.log('Full callIds object:', JSON.stringify(callIds, null, 2));
            
            // Try to extract any string values that look like transaction hashes
            const allValues = Object.values(callIds);
            const hashValues = allValues.filter(val => 
              typeof val === 'string' && 
              val.startsWith('0x') && 
              val.length >= 20
            );
            
            if (hashValues.length > 0) {
              callIds = hashValues;
              console.log('Extracted hash values:', callIds);
            } else {
              console.warn('No valid transaction hashes found in object');
              callIds = [];
            }
          }
        }
        // Check if there's a result field that might contain the array
        else if (data.result && Array.isArray(data.result)) {
          callIds = data.result;
          console.log('Using data.result as callIds:', callIds);
        }
        // If still not an array, create an empty array to prevent crashes
        else {
          console.warn('No valid callIds found, using empty array');
          console.log('Available data fields:', Object.keys(data));
          callIds = [];
        }
      }

      console.log('=== FINAL RESULT ===');
      console.log('Final callIds:', callIds);
      console.log('Final callIds type:', typeof callIds);
      console.log('Final callIds is array:', Array.isArray(callIds));

      setResult(callIds);
      return callIds;
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to send prepared calls';
      
      // Check for insufficient balance error and provide a clearer message
      if (errorMessage.includes('precheck failed') && errorMessage.includes('sender balance and deposit together is 0')) {
        errorMessage = 'You must fund the smart account retrieved in Step 2 with Sepolia ETH! The account needs ETH to pay for transaction fees.';
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
        errorMessage = 'Insufficient balance: Please fund your smart account with Sepolia ETH to cover transaction fees.';
      }
      
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
