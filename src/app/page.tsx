'use client';

import { useState } from 'react';
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
import { useGetCallsStatus } from '../hooks/useGetCallsStatus';
import { useEthBalance } from '../hooks/useEthBalance';

export default function Home() {
  const user = useUser();
  const { openAuthModal } = useAuthModal();
  const signerStatus = useSignerStatus();
  const { logout } = useLogout();
  
  const { getAddress: getSignerAddress, isLoading: isGettingAddress, error: addressError } = useSignerAddress();
  const [signerAddress, setSignerAddress] = useState<string | null>(null);
  const { requestAccount, isLoading: isRequestingAccount, error: accountError, result: smartAccountResult } = useSmartAccount();
  const { createSession, isLoading: isCreatingSession, error: sessionError, result: sessionResult } = useSession();
  const { signSessionAuthorization, isLoading: isSigningAuthorization, error: authorizationError, result: authorizationResult } = useSessionAuthorization();
  const { prepareCalls, isLoading: isPreparingCalls, error: prepareCallsError, result: prepareCallsResult } = usePrepareCalls();
  const { sendPreparedCalls, isLoading: isSendingCalls, error: sendCallsError, result: sendCallsResult } = useSendPreparedCalls();
  const { signWithSessionKey, isLoading: isSigningWithSessionKey, error: sessionKeySignError } = useSessionKeySigner();
  const { getCallsStatus, error: statusError } = useGetCallsStatus();
  const { balance: ethBalance, isLoading: isBalanceLoading, error: balanceError, refetch: refetchBalance } = useEthBalance(smartAccountResult?.accountAddress || null);

  // Step completion tracking
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  
  // Collapsible steps state - completed steps are collapsed by default
  const [collapsedSteps, setCollapsedSteps] = useState<Set<number>>(new Set());
  
  // Transaction hash tracking
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isPollingForHash, setIsPollingForHash] = useState(false);
  
  // Permission type selection for Step 3
  const [selectedPermissionType, setSelectedPermissionType] = useState<'root' | 'native-token-transfer' | 'erc20-token-transfer'>('root');
  
  // Session time selection for Step 3
  const [selectedSessionTime, setSelectedSessionTime] = useState<'5min' | '1hour' | '1day'>('1hour');
  
  // Helper function to get session time in seconds
  const getSessionTimeInSeconds = (time: string) => {
    switch (time) {
      case '5min': return 5 * 60; // 5 minutes
      case '1hour': return 60 * 60; // 1 hour
      case '1day': return 24 * 60 * 60; // 1 day
      default: return 60 * 60; // default to 1 hour
    }
  };
  
  // Copy to clipboard with feedback
  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => new Set([...prev, itemId]));
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Poll for transaction hash
  const pollForTransactionHash = async (callId: string): Promise<string> => {
    setIsPollingForHash(true);
    setTransactionHash(null);

    const maxAttempts = 30; // Poll for up to 30 attempts (30 seconds)
    const pollInterval = 1000; // Poll every 1 second

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await getCallsStatus(callId);
        console.log(`Polling attempt ${attempt + 1}:`, status);

        // Check if transaction is completed (status 200) and has receipts
        if (status.status === 200 && status.receipts && status.receipts.length > 0) {
          // Extract transaction hash from receipts
          const receipt = status.receipts[0] as { transactionHash?: string; hash?: string; id?: string };
          const txHash = receipt.transactionHash || receipt.hash || receipt.id;
          
          if (txHash) {
            console.log('Transaction hash found:', txHash);
            setTransactionHash(txHash);
            setIsPollingForHash(false);
            return txHash;
          }
        }

        // If status is 400, 500, or 600, the transaction failed
        if (status.status === 400 || status.status === 500 || status.status === 600) {
          throw new Error(`Transaction failed with status ${status.status}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          setIsPollingForHash(false);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    setIsPollingForHash(false);
    throw new Error('Transaction hash not found after maximum polling attempts');
  };
  
  // Determine current step (next incomplete step)
  const getCurrentStep = () => {
    if (!signerAddress) return 1;
    if (!smartAccountResult) return 2;
    if (!sessionResult) return 3;
    if (!authorizationResult) return 4;
    if (!prepareCallsResult) return 5;
    if (!sendCallsResult) return 6;
    return 7; // All steps completed
  };
  
  const currentStep = getCurrentStep();
  
  // Check if a step is accessible (current step or previous completed steps)
  const isStepAccessible = (stepNumber: number) => {
    return stepNumber <= currentStep;
  };
  
  // Check if a step is completed
  const isStepCompleted = (stepNumber: number) => {
    return completedSteps.has(stepNumber);
  };
  
  // Check if a step is collapsed
  const isStepCollapsed = (stepNumber: number) => {
    return collapsedSteps.has(stepNumber);
  };
  
  // Toggle step collapse state
  const toggleStepCollapse = (stepNumber: number) => {
    setCollapsedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };
  
  // Mark step as completed (without auto-collapsing)
  const markStepCompleted = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
  };
  
  // Collapse previous step when starting next step
  const startNextStep = (stepNumber: number) => {
    // Collapse the previous step (stepNumber - 1) if it exists and is completed
    if (stepNumber > 1) {
      const previousStep = stepNumber - 1;
      if (completedSteps.has(previousStep)) {
        setCollapsedSteps(prev => new Set([...prev, previousStep]));
      }
    }
  };

  return (
    <div className="min-h-screen">
      {signerStatus.isInitializing ? (
        <div className="flex min-h-screen items-center justify-center">
          <>Loading...</>
        </div>
      ) : user ? (
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <div className="sticky top-6 flex flex-col h-[calc(100vh-3rem)]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Account</h3>
                  <div className="relative group">
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <button
                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2 cursor-pointer"
                        onClick={() => logout()}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                        Log out
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Logged in as <span className="font-medium">{user.email ?? "anon"}</span>
                </p>
                {smartAccountResult && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-800 mb-2">Smart Account</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-semibold text-blue-900">
                        {smartAccountResult.accountAddress.slice(0, 6)}...{smartAccountResult.accountAddress.slice(-4)}
                      </p>
                      <button 
                        onClick={() => handleCopy(smartAccountResult.accountAddress, 'sidebar-smart-account')}
                        className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-800 px-2 py-1 rounded cursor-pointer transition-colors font-medium"
                      >
                        {copiedItems.has('sidebar-smart-account') ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    
                    {/* ETH Balance Display */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-blue-800">ETH Balance</p>
                        <button 
                          onClick={refetchBalance}
                          className="text-xs bg-blue-200 hover:bg-blue-300 text-blue-800 px-2 py-1 rounded cursor-pointer transition-colors font-medium"
                          disabled={isBalanceLoading}
                        >
                          {isBalanceLoading ? '...' : 'Refresh'}
                        </button>
                      </div>
                      <div className="mt-1">
                        {isBalanceLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                            <p className="text-sm text-blue-700">Loading...</p>
                          </div>
                        ) : balanceError ? (
                          <p className="text-sm text-red-600">Error loading balance</p>
                        ) : ethBalance !== null ? (
                          <p className="text-sm font-mono font-semibold text-blue-900">
                            {ethBalance} ETH
                          </p>
                        ) : (
                          <p className="text-sm text-blue-700">No balance data</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer Links */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <a 
                    href="https://github.com/alchemyplatform/wallet-session-key-app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    GitHub Repository
                  </a>
                  <a 
                    href="https://www.alchemy.com/docs/wallets" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Alchemy Docs
                  </a>
                  <a 
                    href="https://sandbox.alchemy.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 2h10a1 1 0 011 1v9a1 1 0 01-1 1H7V4z" clipRule="evenodd" />
                    </svg>
                    Alchemy Sandbox
                  </a>
                  <a 
                    href="mailto:al@alchemy.com" 
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Questions? al@alchemy.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="text-left mb-12">
              <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Alchemy Smart Wallets
                </h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Session Key Demo
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
            </div>
          
          {addressError && (
            <p className="text-red-500 text-sm text-center mb-4">Address Error: {addressError}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(1) ? 'bg-gray-100 opacity-75' : isStepAccessible(1) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 1: Get Alchemy Signer Address
                    {isStepCompleted(1) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(1) && (
                    <button
                      onClick={() => toggleStepCollapse(1)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(1) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(1) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  SDK Hook: <a href="https://www.alchemy.com/docs/wallets/reference/account-kit/react/hooks/useSigner" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">useSigner().getAddress()</code></a>
                </p>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(1) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(1) && (
                  <button
                    className="btn-gradient w-full"
                    onClick={async () => {
                      try {
                        // Hook: useSignerAddress -> No API route (uses Account Kit directly)
                        const address = await getSignerAddress();
                        setSignerAddress(address);
                        markStepCompleted(1);
                        console.log('Signer address:', address);
                      } catch (error) {
                        console.error('Error getting signer address:', error);
                      }
                    }}
                    disabled={isGettingAddress || !isStepAccessible(1)}
                  >
                    {isGettingAddress ? 'Getting Address...' : 'Get Address'}
                  </button>
                )}
                
                {signerAddress && (
                  <div className="bg-green-100 p-3 rounded mt-3">
                    <p className="text-green-800 font-semibold text-base">Signer Address Retrieved!</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm"><strong>Address:</strong> {signerAddress.slice(0, 6)}...{signerAddress.slice(-4)}</p>
                      <button 
                        onClick={() => handleCopy(signerAddress, 'signer-address')}
                        className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        {copiedItems.has('signer-address') ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step 2 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(2) ? 'bg-gray-100 opacity-75' : isStepAccessible(2) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 2: Request Smart Account
                    {isStepCompleted(2) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(2) && (
                    <button
                      onClick={() => toggleStepCollapse(2)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(2) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(2) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  API Endpoint: <a href="https://docs.alchemy.com/reference/wallet-requestaccount" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">wallet_requestAccount</code></a>
                </p>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(2) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(2) && (
                  <button
                    className="btn-gradient w-full"
                    onClick={async () => {
                      try {
                        startNextStep(2); // Collapse previous step
                        // Hook: useSignerAddress -> No API route (uses Account Kit directly)
                        const signerAddress = await getSignerAddress();
                        // Hook: useSmartAccount -> /api/wallet-request-account
                        await requestAccount(signerAddress);
                        markStepCompleted(2);
                      } catch (error) {
                        console.error('Error requesting smart account:', error);
                      }
                    }}
                    disabled={isRequestingAccount || isGettingAddress || !isStepAccessible(2)}
                  >
                    {isRequestingAccount ? 'Requesting Account...' : 'Request Smart Account'}
                  </button>
                )}
                
                {accountError && (
                  <p className="text-red-500 text-sm mt-2">Account Error: {accountError}</p>
                )}
                
                {smartAccountResult && (
                  <div className="bg-green-100 p-3 rounded mt-3">
                    <p className="text-green-800 font-semibold text-base">Smart Account Retrieved!</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm"><strong>Address:</strong> {smartAccountResult.accountAddress.slice(0, 6)}...{smartAccountResult.accountAddress.slice(-4)}</p>
                      <button 
                        onClick={() => handleCopy(smartAccountResult.accountAddress, 'smart-account-address')}
                        className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        {copiedItems.has('smart-account-address') ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm"><strong>ID:</strong> {smartAccountResult.id.slice(0, 6)}...{smartAccountResult.id.slice(-4)}</p>
                      <button 
                        onClick={() => handleCopy(smartAccountResult.id, 'smart-account-id')}
                        className="text-xs bg-green-200 hover:bg-green-300 px-2 py-1 rounded cursor-pointer transition-colors"
                      >
                        {copiedItems.has('smart-account-id') ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step 3 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(3) ? 'bg-gray-100 opacity-75' : isStepAccessible(3) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 3: Create Session
                    {isStepCompleted(3) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(3) && (
                    <button
                      onClick={() => toggleStepCollapse(3)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(3) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(3) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  API Endpoint: <a href="https://docs.alchemy.com/reference/wallet-createsession" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">wallet_createSession</code></a>
                </p>
                
                {/* Permission Type Selection */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission Type:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="permissionType"
                        value="root"
                        checked={selectedPermissionType === 'root'}
                        onChange={(e) => setSelectedPermissionType(e.target.value as 'root')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Root</strong> - Full access to all operations
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="permissionType"
                        value="native-token-transfer"
                        checked={selectedPermissionType === 'native-token-transfer'}
                        onChange={(e) => setSelectedPermissionType(e.target.value as 'native-token-transfer')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>Native Token Transfer</strong> - Send ETH only
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="permissionType"
                        value="erc20-token-transfer"
                        checked={selectedPermissionType === 'erc20-token-transfer'}
                        onChange={(e) => setSelectedPermissionType(e.target.value as 'erc20-token-transfer')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>ERC20 Token Transfer</strong> - Transfer ERC20 tokens
                      </span>
                    </label>
                  </div>
                </div>
                
                {/* Session Time Selection */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Duration:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionTime"
                        value="5min"
                        checked={selectedSessionTime === '5min'}
                        onChange={(e) => setSelectedSessionTime(e.target.value as '5min')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>5 Minutes</strong>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionTime"
                        value="1hour"
                        checked={selectedSessionTime === '1hour'}
                        onChange={(e) => setSelectedSessionTime(e.target.value as '1hour')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>1 Hour</strong>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sessionTime"
                        value="1day"
                        checked={selectedSessionTime === '1day'}
                        onChange={(e) => setSelectedSessionTime(e.target.value as '1day')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        <strong>1 Day</strong>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(3) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(3) && (
                <button
                  className="btn-gradient w-full"
                  onClick={async () => {
                    try {
                      startNextStep(3); // Collapse previous step
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
                        permissionType: selectedPermissionType, // Pass the selected permission type
                        expiry: Math.floor(Date.now() / 1000) + getSessionTimeInSeconds(selectedSessionTime), // Use selected session time
                        // sessionKeyAddress will be auto-generated
                      });
                      markStepCompleted(3);
                    } catch (error) {
                      console.error('Error creating session:', error);
                    }
                  }}
                  disabled={isCreatingSession || !smartAccountResult || !isStepAccessible(3)}
                >
                  {isCreatingSession ? 'Creating Session...' : 'Create Session'}
                </button>
              )}
              
              {sessionError && (
                <p className="text-red-500 text-sm mt-2">Session Error: {sessionError}</p>
              )}
              
              {sessionResult && (
                <div className="bg-blue-100 p-3 rounded mt-3">
                  <p className="text-blue-800 font-semibold text-base">Session Created!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm"><strong>Session ID:</strong> {sessionResult.sessionId.slice(0, 6)}...{sessionResult.sessionId.slice(-4)}</p>
                    <button 
                      onClick={() => handleCopy(sessionResult.sessionId, 'session-id')}
                      className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {copiedItems.has('session-id') ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Session Key:</strong> {sessionResult.sessionKey.address.slice(0, 6)}...{sessionResult.sessionKey.address.slice(-4)}</p>
                    <button 
                      onClick={() => handleCopy(sessionResult.sessionKey.address, 'session-key-address')}
                      className="text-xs bg-blue-200 hover:bg-blue-300 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {copiedItems.has('session-key-address') ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-sm mt-1"><strong>Signature Type:</strong> {sessionResult.signatureRequest.type}</p>
                  <p className="text-sm mt-1"><strong>Permission Type:</strong> {selectedPermissionType}</p>
                </div>
              )}
              </div>
            </div>
            
            {/* Step 4 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(4) ? 'bg-gray-100 opacity-75' : isStepAccessible(4) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 4: Sign Session Authorization
                    {isStepCompleted(4) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(4) && (
                    <button
                      onClick={() => toggleStepCollapse(4)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(4) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(4) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  SDK Hook: <a href="https://www.alchemy.com/docs/wallets/reference/account-kit/wallet-client/functions/signTypedData" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">useSigner().signTypedData()</code></a>
                </p>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(4) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(4) && (
                <button
                  className="btn-gradient w-full"
                  onClick={async () => {
                    try {
                      startNextStep(4); // Collapse previous step
                      if (!sessionResult?.sessionId || !sessionResult?.signatureRequest) {
                        console.error('No session available. Please create a session first.');
                        return;
                      }
                      
                      // Hook: useSessionAuthorization -> No API route (uses Account Kit directly)
                      await signSessionAuthorization(
                        sessionResult.sessionId,
                        sessionResult.signatureRequest
                      );
                      markStepCompleted(4);
                    } catch (error) {
                      console.error('Error signing session authorization:', error);
                    }
                  }}
                  disabled={isSigningAuthorization || !sessionResult || !isStepAccessible(4)}
                >
                  {isSigningAuthorization ? 'Signing Authorization...' : 'Sign Session Authorization'}
                </button>
              )}
              
              {authorizationError && (
                <p className="text-red-500 text-sm mt-2">Authorization Error: {authorizationError}</p>
              )}
              
              {authorizationResult && (
                <div className="bg-purple-100 p-3 rounded mt-3">
                  <p className="text-purple-800 font-semibold text-base">Session Authorized!</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-sm"><strong>Session ID:</strong> {authorizationResult.sessionId.slice(0, 6)}...{authorizationResult.sessionId.slice(-4)}</p>
                    <button 
                      onClick={() => handleCopy(authorizationResult.sessionId, 'auth-session-id')}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {copiedItems.has('auth-session-id') ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Signature:</strong> {authorizationResult.signature.slice(0, 6)}...{authorizationResult.signature.slice(-4)}</p>
                    <button 
                      onClick={() => handleCopy(authorizationResult.signature, 'auth-signature')}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {copiedItems.has('auth-signature') ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm"><strong>Authorization:</strong> {authorizationResult.authorization.slice(0, 6)}...{authorizationResult.authorization.slice(-4)}</p>
                    <button 
                      onClick={() => handleCopy(authorizationResult.authorization, 'auth-authorization')}
                      className="text-xs bg-purple-200 hover:bg-purple-300 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      {copiedItems.has('auth-authorization') ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
            
            {/* Step 5 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(5) ? 'bg-gray-100 opacity-75' : isStepAccessible(5) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 5: Prepare User Operation
                    {isStepCompleted(5) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(5) && (
                    <button
                      onClick={() => toggleStepCollapse(5)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(5) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(5) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  API Endpoint: <a href="https://docs.alchemy.com/reference/wallet-preparecalls" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">wallet_prepareCalls</code></a>
                </p>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(5) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(5) && (
                <button
                  className="btn-gradient w-full"
                  onClick={async () => {
                    try {
                      startNextStep(5); // Collapse previous step
                      if (!authorizationResult?.sessionId || !authorizationResult?.signature || !smartAccountResult?.accountAddress) {
                        console.error('Missing required data from previous steps');
                        return;
                      }
                      
                      // =====================================================
                      // Prepare a user operation with session authorization
                      // Hook: usePrepareCalls -> /api/wallet-prepare-calls
                      // =====================================================
                      await prepareCalls({
                        // Session details from previous authorization step
                        sessionId: authorizationResult.sessionId,
                        signature: authorizationResult.signature,
                        accountAddress: smartAccountResult.accountAddress,
                        
                        // Chain configuration 
                        chainId: '0xaa36a7', // Ethereum Sepolia testnet
                        
                        // Array of calls to make - in this case just a single empty call
                        calls: [{
                          // Example recipient address (can be replaced with actual target)
                          to: '0x4Ff840AC60adbdCa20e5640fC2124F5d639Ea501',
                          
                          // No ETH transfer in this example
                          value: '0x0',
                          
                          // No calldata - just a basic transaction
                          data: '0x'
                        }]
                      });
                      markStepCompleted(5);
                    } catch (error) {
                      console.error('Error preparing calls:', error);
                    }
                  }}
                  disabled={isPreparingCalls || !authorizationResult || !isStepAccessible(5)}
                >
                  {isPreparingCalls ? 'Preparing...' : 'Prepare User Operation'}
                </button>
              )}
              
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
                        <span className="font-mono">{prepareCallsResult.userOpRequest.sender?.slice(0, 6)}...{prepareCallsResult.userOpRequest.sender?.slice(-4)}</span>
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
                        <span className="font-mono">{prepareCallsResult.signatureRequest.data.raw.slice(0, 6)}...{prepareCallsResult.signatureRequest.data.raw.slice(-4)}</span>
                        <button 
                          onClick={() => handleCopy(prepareCallsResult.signatureRequest.data.raw, 'hash-to-sign')}
                          className="text-xs bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded cursor-pointer transition-colors"
                        >
                          {copiedItems.has('hash-to-sign') ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
            
            {/* Step 6 */}
            <div className={`p-4 rounded-lg ${isStepCompleted(6) ? 'bg-gray-100 opacity-75' : isStepAccessible(6) ? 'bg-gray-50' : 'bg-gray-200 opacity-50'}`}>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    Step 6: Sign & Send Transaction
                    {isStepCompleted(6) && <span className="ml-2 text-green-600">✓</span>}
                  </h3>
                  {isStepCompleted(6) && (
                    <button
                      onClick={() => toggleStepCollapse(6)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                      title={isStepCollapsed(6) ? "Expand step" : "Collapse step"}
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isStepCollapsed(6) ? 'rotate-180' : ''}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  API Endpoint: <a href="https://docs.alchemy.com/reference/wallet-sendpreparedcalls" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline"><code className="bg-gray-200 px-1 rounded text-xs">wallet_sendPreparedCalls</code></a>
                </p>
              </div>
              
              {/* Collapsible content */}
              <div className={`transition-all duration-300 ease-in-out ${isStepCollapsed(6) ? 'max-h-0 overflow-hidden' : 'max-h-96'}`}>
                {!isStepCompleted(6) && (
                <button
                  className="btn-gradient w-full"
                  onClick={async () => {
                    try {
                      startNextStep(6); // Collapse previous step
                      if (!prepareCallsResult || !authorizationResult?.sessionId || !authorizationResult?.signature || !sessionResult?.sessionKey) {
                        console.error('Missing prepared calls, session data, or session key');
                        return;
                      }
                      
                      // Hook: useSessionKeySigner -> No API route (uses viem directly)
                      // Sign the hash with the session key
                      const hashToSign = prepareCallsResult.signatureRequest.data.raw;
                      const sessionKeySignature = await signWithSessionKey(
                        sessionResult.sessionKey.privateKey,
                        hashToSign
                      );
                      
                      // Hook: useSendPreparedCalls -> /api/wallet-send-prepared-calls
                      const response = await sendPreparedCalls({
                        sessionId: authorizationResult.sessionId,
                        signature: authorizationResult.signature,
                        userOpSignature: sessionKeySignature, // Sign with the actual session key
                        userOpRequest: prepareCallsResult.userOpRequest,
                        chainId: prepareCallsResult.chainId
                      });

                      console.log('Send prepared calls response:', response);

                      // Extract call IDs from the nested structure
                      let callIds: string[] = [];
                      if (response && typeof response === 'object') {
                        if (response.preparedCallIds && Array.isArray(response.preparedCallIds)) {
                          callIds = response.preparedCallIds;
                        } else if (Array.isArray(response)) {
                          callIds = response;
                        }
                      }

                      console.log('Extracted call IDs:', callIds);

                      // Poll for transaction hash using the first call ID
                      if (callIds && callIds.length > 0) {
                        const callId = callIds[0];
                        console.log('Starting to poll for transaction hash with call ID:', callId);
                        
                        try {
                          const txHash = await pollForTransactionHash(callId);
                          console.log('Final transaction hash:', txHash);
                        } catch (pollError) {
                          console.error('Error polling for transaction hash:', pollError);
                        }
                      } else {
                        console.error('No call IDs found in response:', response);
                      }

                      markStepCompleted(6);
                    } catch (error) {
                      console.error('Error sending calls:', error);
                    }
                  }}
                  disabled={isSendingCalls || isSigningWithSessionKey || isPollingForHash || !prepareCallsResult || !isStepAccessible(6)}
                >
                  {isSigningWithSessionKey ? 'Signing with Session Key...' : 
                   isSendingCalls ? 'Sending...' : 
                   isPollingForHash ? 'Waiting for Transaction Hash...' : 
                   'Sign and Send User Operation'}
                </button>
              )}
              
              {sessionKeySignError && (
                <p className="text-red-500 text-sm mt-2">Session Key Sign Error: {sessionKeySignError}</p>
              )}
              
              {statusError && (
                <p className="text-red-500 text-sm mt-2">Status Check Error: {statusError}</p>
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
              
              {transactionHash && (
                <div className="bg-emerald-100 p-3 rounded mt-3">
                  <p className="text-emerald-800 font-semibold text-base">Transaction Confirmed!</p>
                  <div className="mt-2">
                    <div className="bg-emerald-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-emerald-800">
                          {transactionHash.slice(0, 6)}...{transactionHash.slice(-4)}
                        </p>
                        <button 
                          onClick={() => handleCopy(transactionHash, 'final-tx-hash')}
                          className="text-xs bg-emerald-200 hover:bg-emerald-300 px-2 py-1 rounded transition-colors cursor-pointer"
                          title="Copy full transaction hash"
                        >
                          {copiedItems.has('final-tx-hash') ? 'Copied!' : 'Copy Hash'}
                        </button>
                      </div>
                      <div className="mt-1">
                        <p className="text-xs text-emerald-700 font-mono break-all">
                          Full Hash: {transactionHash}
                        </p>
                      </div>
                      <div className="mt-1">
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                        >
                          View on Etherscan
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {isPollingForHash && (
                <div className="bg-blue-100 p-3 rounded mt-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-blue-800 font-semibold text-sm">Polling for transaction hash...</p>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">This may take a few moments while the transaction is processed on the blockchain.</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="flex min-h-screen">
          {/* Left Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
            <div className="sticky top-6 flex flex-col h-[calc(100vh-3rem)]">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Welcome</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Sign in to explore session key functionality with Alchemy Smart Wallets
                </p>
                
                {/* Features Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">What you&apos;ll learn:</h4>
                  <ul className="text-xs text-blue-700 space-y-2">
                    <li className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Create and manage session keys
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Set spending limits and permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Execute transactions with session keys
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Footer Links */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <a 
                    href="https://github.com/alchemyplatform/wallet-session-key-app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    GitHub Repository
                  </a>
                  <a 
                    href="https://www.alchemy.com/docs/wallets" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Alchemy Docs
                  </a>
                  <a 
                    href="https://sandbox.alchemy.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3 2h10a1 1 0 011 1v9a1 1 0 01-1 1H7V4z" clipRule="evenodd" />
                    </svg>
                    Alchemy Sandbox
                  </a>
                  <a 
                    href="mailto:al@alchemy.com" 
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Questions? al@alchemy.com
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="text-left mb-12">
              <div className="mb-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Alchemy Smart Wallets
                </h1>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Session Key Demo
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
            </div>

            {/* Login Section */}
            <div className="max-w-md">
              <button 
                className="btn-gradient w-full text-lg py-4 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={openAuthModal}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sign In to Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
