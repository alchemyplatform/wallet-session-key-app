import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, signature, userOpSignature, userOpRequest, chainId } = body;

    if (!sessionId || !signature || !userOpSignature || !userOpRequest || !chainId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured' },
        { status: 500 }
      );
    }

    // Concatenate the context: 0x00 + sessionId + signature
    const context = `0x00${sessionId.slice(2)}${signature.slice(2)}`;

    const sendCallsRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'wallet_sendPreparedCalls',
      params: [
        {
          type: 'user-operation-v070',
          data: userOpRequest,
          capabilities: {
            permissions: {
              context: context
            }
          },
          signature: {
            signature: userOpSignature
          }
        }
      ]
    };

    // Use the correct Alchemy Smart Wallet API endpoint
    const endpoint = `https://api.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
    
    const alchemyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sendCallsRequest)
    });

    if (!alchemyResponse.ok) {
      const errorData = await alchemyResponse.text();
      console.error('Alchemy API error:', errorData);
      throw new Error(`Alchemy API error: ${errorData}`);
    }

    const result = await alchemyResponse.json();

    if (result.error) {
      console.error('Alchemy API result error:', result.error);
      throw new Error(`Alchemy API error: ${result.error.message}`);
    }

    return NextResponse.json({
      success: true,
      callIds: result.result
    });

  } catch (error) {
    console.error('Error sending prepared calls:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send prepared calls' },
      { status: 500 }
    );
  }
}
