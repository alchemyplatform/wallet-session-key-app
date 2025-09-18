import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export interface SessionKey {
  privateKey: `0x${string}`;
  address: `0x${string}`;
}

export function generateSessionKey(): SessionKey {
  // Generate a new private key
  const privateKey = generatePrivateKey();
  
  // Create an account from the private key to get the address
  const account = privateKeyToAccount(privateKey);
  
  return {
    privateKey,
    address: account.address,
  };
}

export function createSessionKeyFromPrivateKey(privateKey: `0x${string}`): SessionKey {
  const account = privateKeyToAccount(privateKey);
  
  return {
    privateKey,
    address: account.address,
  };
}
