import { NextRequest, NextResponse } from 'next/server';
import { generateSessionKey } from '../../../utils/sessionKey';

export async function POST(request: NextRequest) {
  try {
    const { account, chainId, expiry, permissionType = 'root' } = await request.json();

    if (!account || !chainId || !expiry) {
      return NextResponse.json(
        { error: 'account, chainId, and expiry are required' },
        { status: 400 }
      );
    }

    // Generate session key on the backend
    const sessionKey = generateSessionKey();
    const publicKey = sessionKey.address;

    console.log('Generated session key on backend:', {
      address: publicKey,
      privateKey: sessionKey.privateKey.slice(0, 10) + '...' // Don't log full private key
    });

    const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
    if (!alchemyApiKey) {
      return NextResponse.json(
        { error: 'Alchemy API key not configured' },
        { status: 500 }
      );
    }

    console.log('Creating session with permission type:', permissionType);

    // Build permissions based on type
    let permissions;
    if (permissionType === 'root') {
      permissions = [{ type: permissionType }];
    } else if (permissionType === 'native-token-transfer') {
      // Use native-token-transfer for native token transfers
      permissions = [
        {
          type: 'native-token-transfer',
          data: {
            allowance: '0x16345785D8A0000' // 0.1 ETH in wei
          }
        },
        {
          type: 'contract-access',
          data: {
            address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
          }
        }
      ];
    } else if (permissionType === 'erc20-token-transfer') {
      // Use erc20-token-transfer for ERC20 transfers

      // console.log('ERC20 token transfer permission typ!!!!e');
      permissions = [{
        type: 'erc20-token-transfer',
        data: {
          allowance: '0x16345785d8a0000', // 0.1 token in wei
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
        }
      }];
    } else {
      permissions = [{ type: 'root' }]; // fallback
    }

    // console.log('Permissions:', permissions);

    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method: 'wallet_createSession',
      params: [
        {
          account,
          chainId,
          key: {
            publicKey,
            type: 'secp256k1',
          },
          permissions,
          expirySec: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
        },
      ],
    };

    console.log('Permissions:', permissions);


    console.log('Alchemy API request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://api.g.alchemy.com/v2/${alchemyApiKey}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    console.log('Alchemy API response status:', response.status);
    console.log('Alchemy API response data:', JSON.stringify(data, null, 2));

    // Check for errors in the response data (even if status is 200)
    if (data.error) {
      console.error('Alchemy API error in response:', data.error);
      return NextResponse.json(
        { error: 'Failed to create session', details: data.error },
        { status: 400 }
      );
    }

    if (!response.ok) {
      console.error('Alchemy API error response:', data);
      return NextResponse.json(
        { error: 'Failed to create session', details: data },
        { status: response.status }
      );
    }

    // Add session key information to the response
    const responseData = {
      ...data,
      sessionKey: {
        privateKey: sessionKey.privateKey,
        address: sessionKey.address,
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
