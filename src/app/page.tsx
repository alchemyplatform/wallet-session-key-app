'use client';

import {
  useAuthModal,
  useLogout,
  useSignerStatus,
  useUser,
} from "@account-kit/react";
import { useSignerAddress } from '../hooks/useSignerAddress';
import { useSmartAccount } from '../hooks/useSmartAccount';
import { useSession } from '../hooks/useSession';
import { useSessionAuthorization } from '../hooks/useSessionAuthorization';
import { usePrepareCalls } from '../hooks/usePrepareCalls';
import { useSendPreparedCalls } from '../hooks/useSendPreparedCalls';
import { useSessionKeySigner } from '../hooks/useSessionKeySigner';

export default function Home() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { logout } = useLogout();
  
  const { getAddress: getSignerAddress, isLoading: isGettingAddress, error: addressError } = useSignerAddress();
  const { requestAccount, isLoading: isRequestingAccount, error: accountError, result: smartAccountResult } = useSmartAccount();
  const { createSession, isLoading: isCreatingSession, error: sessionError, result: sessionResult } = useSession();
  const { signSessionAuthorization, isLoading: isSigningAuthorization, error: authorizationError, result: authorizationResult } = useSessionAuthorization();
  const { prepareCalls, isLoading: isPreparingCalls, error: prepareCallsError, result: prepareCallsResult } = usePrepareCalls();
  const { sendPreparedCalls, isLoading: isSendingCalls, error: sendCallsError, result: sendCallsResult } = useSendPreparedCalls();
  const { signWithSessionKey, isLoading: isSigningWithSessionKey, error: sessionKeySignError } = useSessionKeySigner();

  return (
    <div className="flex min-h-screen flex-col items-center p-24 gap-4 justify-center text-center">
      {signerStatus.isInitializing ? (
        <>Loading...</>
      ) : user ? (
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <p className="text-xl font-bold">Success!</p>
            You&apos;re logged in as {user.email ?? "anon"}.
          </div>
          
          {addressError && (
            <p className="text-red-500 text-sm text-center mb-4">Address Error: {addressError}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 1: Get Alchemy Signer Address</h3>
              <button
                className="akui-btn akui-btn-primary w-full"
                onClick={async () => {
                  try {
                    // Hook: useSignerAddress -> No API route (uses Account Kit directly)
                    const address = await getSignerAddress();
                    console.log('Signer address:', address);
                  } catch (error) {
                    // Error is handled by the hook
                  }
                }}
                disabled={isGettingAddress}
              >
                {isGettingAddress ? 'Getting Address...' : 'Get Address'}
              </button>
            </div>
            
            {/* Step 2 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 2: Request Smart Account</h3>
              <button
                className="akui-btn akui-btn-primary w-full"
                onClick={async () => {
                  try {
                    // Hook: useSignerAddress -> No API route (uses Account Kit directly)
                    const signerAddress = await getSignerAddress();
                    // Hook: useSmartAccount -> /api/wallet-request-account
                    await requestAccount(signerAddress);
                  } catch (error) {
                    // Errors are handled by the hooks
                  }
                }}
                disabled={isRequestingAccount || isGettingAddress}
              >
                {isRequestingAccount ? 'Requesting Account...' : 'Request Smart Account'}
              </button>
              
              {accountError && (
                <p className="text-red-500 text-sm mt-2">Account Error: {accountError}</p>
              )}
              
              {smartAccountResult && (
                <div className="bg-green-100 p-3 rounded mt-3">
                  <p className="text-green-800 font-semibold text-base">Smart Account Retrieved!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm"><strong>Address:</strong> {smartAccountResult.accountAddress.slice(0, 10)}...{smartAccountResult.accountAddress.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(smartAccountResult.accountAddress)}
                      className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>ID:</strong> {smartAccountResult.id.slice(0, 10)}...{smartAccountResult.id.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(smartAccountResult.id)}
                      className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 3 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 3: Create Session</h3>
              <button
                className="akui-btn akui-btn-primary w-full"
                onClick={async () => {
                  try {
                    if (!smartAccountResult?.accountAddress) {
                      console.error('No smart account available. Please create one first.');
                      return;
                    }
                    
                    // Hook: useSession -> /api/wallet-create-session
                    // Generate a new session key and create session
                    // The session key will be generated using viem.fromPrivateKey()
                    await createSession({
                      account: smartAccountResult.accountAddress,
                      chainId: '0xaa36a7', // Ethereum Sepolia chain ID
                      // sessionKeyAddress will be auto-generated
                    });
                  } catch (error) {
                    // Errors are handled by the hooks
                  }
                }}
                disabled={isCreatingSession || !smartAccountResult}
              >
                {isCreatingSession ? 'Creating Session...' : 'Create Session'}
              </button>
              
              {sessionError && (
                <p className="text-red-500 text-sm mt-2">Session Error: {sessionError}</p>
              )}
              
              {sessionResult && (
                <div className="bg-blue-100 p-3 rounded mt-3">
                  <p className="text-blue-800 font-semibold text-base">Session Created!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm"><strong>Session ID:</strong> {sessionResult.sessionId.slice(0, 10)}...{sessionResult.sessionId.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(sessionResult.sessionId)}
                      className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Session Key:</strong> {sessionResult.sessionKey.address.slice(0, 10)}...{sessionResult.sessionKey.address.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(sessionResult.sessionKey.address)}
                      className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm mt-1"><strong>Signature Type:</strong> {sessionResult.signatureRequest.type}</p>
                </div>
              )}
            </div>
            
            {/* Step 4 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 4: Sign Session Authorization</h3>
              <button
                className="akui-btn akui-btn-primary w-full"
                onClick={async () => {
                  try {
                    if (!sessionResult?.sessionId || !sessionResult?.signatureRequest) {
                      console.error('No session available. Please create a session first.');
                      return;
                    }
                    
                    // Hook: useSessionAuthorization -> No API route (uses Account Kit directly)
                    await signSessionAuthorization(
                      sessionResult.sessionId,
                      sessionResult.signatureRequest
                    );
                  } catch (error) {
                    // Errors are handled by the hooks
                  }
                }}
                disabled={isSigningAuthorization || !sessionResult}
              >
                {isSigningAuthorization ? 'Signing Authorization...' : 'Sign Session Authorization'}
              </button>
              
              {authorizationError && (
                <p className="text-red-500 text-sm mt-2">Authorization Error: {authorizationError}</p>
              )}
              
              {authorizationResult && (
                <div className="bg-purple-100 p-3 rounded mt-3">
                  <p className="text-purple-800 font-semibold text-base">Session Authorized!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm"><strong>Session ID:</strong> {authorizationResult.sessionId.slice(0, 10)}...{authorizationResult.sessionId.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(authorizationResult.sessionId)}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Signature:</strong> {authorizationResult.signature.slice(0, 10)}...{authorizationResult.signature.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(authorizationResult.signature)}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Authorization:</strong> {authorizationResult.authorization.slice(0, 10)}...{authorizationResult.authorization.slice(-8)}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(authorizationResult.authorization)}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 5 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 5: Prepare Background Tasks</h3>
              <div className="space-y-2 mb-3">
                <button
                  className="akui-btn akui-btn-primary w-full text-sm"
                  onClick={async () => {
                    try {
                      if (!authorizationResult?.sessionId || !authorizationResult?.signature || !smartAccountResult?.accountAddress) {
                        console.error('Missing required data from previous steps');
                        return;
                      }
                      
                      // Hook: usePrepareCalls -> /api/wallet-prepare-calls
                      // Sample limit order call - simple contract interaction
                      await prepareCalls({
                        sessionId: authorizationResult.sessionId,
                        signature: authorizationResult.signature,
                        accountAddress: smartAccountResult.accountAddress,
                        chainId: '0xaa36a7', // Ethereum Sepolia
                        calls: [{
                          to: '0x0000000000000000000000000000000000000000', // Burn address (always valid)
                          value: '0x0',
                          data: '0x' // Empty data for simple call
                        }]
                      });
                    } catch (error) {
                      console.error('Error preparing calls:', error);
                    }
                  }}
                  disabled={isPreparingCalls || !authorizationResult}
                >
                  {isPreparingCalls ? 'Preparing...' : 'Prepare Limit Order'}
                </button>
                
                <button
                  className="akui-btn akui-btn-secondary w-full text-sm"
                  onClick={async () => {
                    try {
                      if (!authorizationResult?.sessionId || !authorizationResult?.signature || !smartAccountResult?.accountAddress) {
                        console.error('Missing required data from previous steps');
                        return;
                      }
                      
                      // Hook: usePrepareCalls -> /api/wallet-prepare-calls
                      // Sample background task - update user preferences
                      await prepareCalls({
                        sessionId: authorizationResult.sessionId,
                        signature: authorizationResult.signature,
                        accountAddress: smartAccountResult.accountAddress,
                        chainId: '0xaa36a7', // Ethereum Sepolia
                        calls: [{
                          to: '0x0000000000000000000000000000000000000000', // Mock contract
                          value: '0x0',
                          data: '0x' // Empty data for demo - could be updatePreferences()
                        }]
                      });
                    } catch (error) {
                      console.error('Error preparing calls:', error);
                    }
                  }}
                  disabled={isPreparingCalls || !authorizationResult}
                >
                  {isPreparingCalls ? 'Preparing...' : 'Prepare Background Task'}
                </button>
              </div>
              
              {prepareCallsError && (
                <p className="text-red-500 text-sm mt-2">Prepare Calls Error: {prepareCallsError}</p>
              )}
              
              {prepareCallsResult && (
                <div className="bg-orange-100 p-3 rounded mt-3">
                  <p className="text-orange-800 font-semibold text-base">Calls Prepared!</p>
                  
                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">UserOp Request:</p>
                    <div className="bg-orange-50 p-2 rounded text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <span className="font-mono">user-operation-v070</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Chain ID:</span>
                        <span className="font-mono">{prepareCallsResult.chainId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Sender:</span>
                        <span className="font-mono">{prepareCallsResult.userOpRequest.sender?.slice(0, 10)}...{prepareCallsResult.userOpRequest.sender?.slice(-8)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Nonce:</span>
                        <span className="font-mono">{prepareCallsResult.userOpRequest.nonce}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Call Gas Limit:</span>
                        <span className="font-mono">{prepareCallsResult.userOpRequest.callGasLimit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Max Fee Per Gas:</span>
                        <span className="font-mono">{prepareCallsResult.userOpRequest.maxFeePerGas}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-semibold mb-2">Signature Request:</p>
                    <div className="bg-orange-50 p-2 rounded text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Type:</span>
                        <span className="font-mono">{prepareCallsResult.signatureRequest.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Hash to Sign:</span>
                        <span className="font-mono">{prepareCallsResult.signatureRequest.data.raw.slice(0, 10)}...{prepareCallsResult.signatureRequest.data.raw.slice(-8)}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(prepareCallsResult.signatureRequest.data.raw)}
                          className="text-xs bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 6 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-lg">Step 6: Sign & Send Transaction</h3>
              <button
                className="akui-btn akui-btn-primary w-full"
                onClick={async () => {
                  try {
                    if (!prepareCallsResult || !authorizationResult?.sessionId || !authorizationResult?.signature || !sessionResult?.sessionKey) {
                      console.error('Missing prepared calls, session data, or session key');
                      return;
                    }
                    
                    // Hook: useSessionKeySigner -> No API route (uses viem directly)
                    // Sign the hash with the session key


                    // ask peter here how to sign the hash with the session key
                    // i need to sign the hash with the session key
                    // i need to return the signature
                    // i need to use the session key address to sign the hash
                    // i need to use the session key private key to sign the hash
                    // i need to use the session key public key to sign the hash
                    const hashToSign = prepareCallsResult.signatureRequest.data.raw;
                    const sessionKeySignature = await signWithSessionKey(
                      sessionResult.sessionKey.privateKey,
                      hashToSign
                    );
                    
                    // Hook: useSendPreparedCalls -> /api/wallet-send-prepared-calls
                    await sendPreparedCalls({
                      sessionId: authorizationResult.sessionId,
                      signature: authorizationResult.signature,
                      userOpSignature: sessionKeySignature, // Sign with the actual session key
                      userOpRequest: prepareCallsResult.userOpRequest,
                      chainId: prepareCallsResult.chainId
                    });
                  } catch (error) {
                    console.error('Error sending calls:', error);
                  }
                }}
                disabled={isSendingCalls || isSigningWithSessionKey || !prepareCallsResult}
              >
                {isSigningWithSessionKey ? 'Signing with Session Key...' : isSendingCalls ? 'Sending...' : 'Sign & Send Transaction'}
              </button>
              
              {sessionKeySignError && (
                <p className="text-red-500 text-sm mt-2">Session Key Sign Error: {sessionKeySignError}</p>
              )}
              
              {sendCallsError && (
                <p className="text-red-500 text-sm mt-2">Send Calls Error: {sendCallsError}</p>
              )}
              
              {sendCallsResult && (
                <div className="bg-emerald-100 p-3 rounded mt-3">
                  <p className="text-emerald-800 font-semibold text-base">Transaction Sent!</p>
                  <div className="mt-2">
                    <p className="text-sm"><strong>Call IDs:</strong></p>
                    {sendCallsResult.map((callId: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 mt-1">
                        <p className="text-sm">{callId.slice(0, 10)}...{callId.slice(-8)}</p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(callId)}
                          className="text-xs bg-emerald-200 hover:bg-emerald-300 px-2 py-1 rounded"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mt-8">
            <button
              className="akui-btn akui-btn-primary"
              onClick={() => logout()}
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <button className="akui-btn akui-btn-primary" onClick={openAuthModal}>
          Step 1: Login
        </button>
      )}
    </div>
  );
}
