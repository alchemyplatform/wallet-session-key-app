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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h2 className="text-lg font-semibold text-blue-800">Alchemy Smart Wallet Session Key Demo</h2>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              This demo shows how to implement session keys with Alchemy Smart Wallets. 
              Each step demonstrates a different part of the session key workflow.
            </p>
            <div className="text-xs text-blue-600">
              <strong>Flow:</strong> Get Address → Create Smart Account → Create Session → Sign Authorization → Prepare Calls → Sign & Send
            </div>
          </div>
          
          {addressError && (
            <p className="text-red-500 text-sm text-center mb-4">Address Error: {addressError}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 1: Get Alchemy Signer Address</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-64 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Account Kit Integration</div>
                    <div className="mb-1">Uses: <code className="bg-gray-700 px-1 rounded">useSigner().getAddress()</code></div>
                    <div className="mb-1">Process: Direct Account Kit call</div>
                    <div className="text-gray-300">No API route needed - uses Account Kit directly</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 2: Request Smart Account</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Alchemy Smart Wallet API</div>
                    <div className="mb-1">Endpoint: <code className="bg-gray-700 px-1 rounded">wallet_requestAccount</code></div>
                    <div className="mb-1">API Route: <code className="bg-gray-700 px-1 rounded">/api/wallet-request-account</code></div>
                    <div className="mb-1">Process: Creates smart account for the signer</div>
                    <div className="mb-2">
                      <a href="https://docs.alchemy.com/reference/wallet-requestaccount" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                        📖 Alchemy Documentation
                      </a>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 3: Create Session</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Alchemy Smart Wallet API</div>
                    <div className="mb-1">Endpoint: <code className="bg-gray-700 px-1 rounded">wallet_createSession</code></div>
                    <div className="mb-1">API Route: <code className="bg-gray-700 px-1 rounded">/api/wallet-create-session</code></div>
                    <div className="mb-1">Process: Creates session key & EIP-712 signature request</div>
                    <div className="mb-2">
                      <a href="https://docs.alchemy.com/reference/wallet-createsession" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                        📖 Alchemy Documentation
                      </a>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 4: Sign Session Authorization</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Account Kit Integration</div>
                    <div className="mb-1">Uses: <code className="bg-gray-700 px-1 rounded">useSigner().signTypedData()</code></div>
                    <div className="mb-1">Process: Signs EIP-712 typed data with user's wallet</div>
                    <div className="mb-1">Creates: Authorization context (0x00 + sessionId + signature)</div>
                    <div className="text-gray-300">No API route needed - uses Account Kit directly</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 5: Prepare Background Tasks</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Alchemy Smart Wallet API</div>
                    <div className="mb-1">Endpoint: <code className="bg-gray-700 px-1 rounded">wallet_prepareCalls</code></div>
                    <div className="mb-1">API Route: <code className="bg-gray-700 px-1 rounded">/api/wallet-prepare-calls</code></div>
                    <div className="mb-1">Process: Prepares UserOp for session key signing</div>
                    <div className="mb-2">
                      <a href="https://docs.alchemy.com/reference/wallet-preparecalls" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                        📖 Alchemy Documentation
                      </a>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-lg">Step 6: Sign & Send Transaction</h3>
                <div className="relative inline-block group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-80 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">Two-Step Process:</div>
                    <div className="mb-1">1. <code className="bg-gray-700 px-1 rounded">viem.signMessage()</code> - Sign with session key</div>
                    <div className="mb-1">2. <code className="bg-gray-700 px-1 rounded">wallet_sendPreparedCalls</code> - Submit transaction</div>
                    <div className="mb-1">API Route: <code className="bg-gray-700 px-1 rounded">/api/wallet-send-prepared-calls</code></div>
                    <div className="mb-2">
                      <a href="https://docs.alchemy.com/reference/wallet-sendpreparedcalls" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                        📖 Alchemy Documentation
                      </a>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
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
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-red-800 font-semibold text-sm">Transaction Failed</p>
                      <p className="text-red-700 text-sm mt-1">{sendCallsError}</p>
                      {sendCallsError.includes('fund the smart account') && (
                        <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                          <p className="text-red-800 text-xs font-medium">💡 How to fix:</p>
                          <ol className="text-red-700 text-xs mt-1 ml-4 list-decimal">
                            <li>Copy the smart account address from Step 2</li>
                            <li>Send Sepolia ETH to that address using a faucet or exchange</li>
                            <li>You can use <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-900">Sepolia Faucet</a> to get test ETH</li>
                            <li>Try Step 6 again once the account has ETH</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {sendCallsResult && (
                <div className="bg-emerald-100 p-3 rounded mt-3">
                  <p className="text-emerald-800 font-semibold text-base">Transaction Sent!</p>
                  <div className="mt-2">
                    {Array.isArray(sendCallsResult) ? (
                      sendCallsResult.map((txHash: string, index: number) => (
                        <div key={index} className="bg-emerald-50 p-2 rounded mb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-emerald-800">
                              {txHash.slice(0, 10)}...{txHash.slice(-8)}
                            </p>
                            <button 
                              onClick={() => navigator.clipboard.writeText(txHash)}
                              className="text-xs bg-emerald-200 hover:bg-emerald-300 px-2 py-1 rounded transition-colors"
                              title="Copy full transaction hash"
                            >
                              Copy Hash
                            </button>
                          </div>
                          <div className="mt-1">
                            <p className="text-xs text-emerald-700 font-mono break-all">
                              Full Hash: {txHash}
                            </p>
                          </div>
                          <div className="mt-1">
                            <a 
                              href={`https://sepolia.etherscan.io/tx/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                            >
                              View on Etherscan
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-emerald-50 p-2 rounded">
                        <p className="text-sm text-gray-600">Result: {JSON.stringify(sendCallsResult)}</p>
                      </div>
                    )}
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
