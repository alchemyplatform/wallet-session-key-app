import { useState, useEffect } from 'react';

interface UseEthBalanceResult {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEthBalance(address: string | null): UseEthBalanceResult {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching ETH balance for address:', address);
      
      // Using Alchemy's RPC endpoint for Sepolia testnet
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
      if (!alchemyApiKey) {
        throw new Error('Alchemy API key not found in environment variables');
      }
      
      const response = await fetch(`https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1,
        }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch balance');
      }

      // Convert from wei to ETH (1 ETH = 10^18 wei)
      const balanceInWei = data.result;
      const balanceInEth = (parseInt(balanceInWei, 16) / Math.pow(10, 18)).toFixed(6);
      
      console.log('Balance in wei:', balanceInWei, 'Balance in ETH:', balanceInEth);
      setBalance(balanceInEth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching ETH balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
