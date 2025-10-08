// @noErrors
import { createConfig, cookieStorage } from "@account-kit/react";
import { QueryClient } from "@tanstack/react-query";
import { sepolia, alchemy } from "@account-kit/infra";

export const config = createConfig(
  {
    transport: alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!,
    }),
    chain: sepolia,
    ssr: true,
    storage: cookieStorage,
    enablePopupOauth: true,
    sessionConfig: {
      expirationTimeMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    },
    // For gas sponsorship
    // Learn more here: https://www.alchemy.com/docs/wallets/transactions/sponsor-gas/sponsor-gas-evm
    policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
  },
  {
    auth: {
      sections: [
        [{ type: "email" }]
      ],
      addPasskeyOnSignup: true,
    },
  },
);

export const queryClient = new QueryClient();