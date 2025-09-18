import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { account, chainId, expiry, publicKey } = await request.json();
    // this public key is the session key address

    if (!account || !chainId || !expiry || !publicKey) {
      return NextResponse.json(
        { error: 'account, chainId, expiry, and publicKey (session key address) are required' },
        { status: 400 }
      );
    }

    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://api.g.alchemy.com/v2/${alchemyApiKey}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'wallet_createSession',
        params: [
          {
            account,
            chainId,
            expiry,
            key: {
              publicKey,
              type: 'secp256k1',
            },
            permissions: [
              {
                type: 'root',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create session', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
