import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, signature, accountAddress, chainId, calls } = body;

    if (!sessionId || !signature || !accountAddress || !chainId || !calls) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }


    if (!process.env.ALCHEMY_API_KEY) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured' },
        { status: 500 }
      );
    }

    // Concatenate the context: 0x00 + sessionId + signature
    const context = `0x00${sessionId.slice(2)}${signature.slice(2)}`;
    

    const prepareCallsRequest = {
      id: 1,
      jsonrpc: '2.0',
      method: 'wallet_prepareCalls',
      params: [
        {
          capabilities: {
            permissions: {
              context: context
            },
            paymasterService: {
              policyId: process.env.NEXT_PUBLIC_ALCHEMY_POLICY_ID,
            }
          },
          calls: calls,
          from: accountAddress,
          chainId: chainId
        }
      ]
    };

    console.log('prepareCallsRequest', prepareCallsRequest);

    // Use the correct Alchemy Smart Wallet API endpoint
    const endpoint = `https://api.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
    
    const alchemyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(prepareCallsRequest)
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
      userOpRequest: result.result.data,
      signatureRequest: result.result.signatureRequest,
      chainId: result.result.chainId
    });

  } catch (error) {
    console.error('Error preparing calls:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to prepare calls' },
      { status: 500 }
    );
  }
}
