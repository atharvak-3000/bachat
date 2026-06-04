import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/subscription/callback
 * Handles PhonePe secure Server-to-Server Webhook Callbacks.
 * Verifies payload signatures and logs transactions in the database.
 */
export async function POST(req) {
  console.log('[PHONEPE_WEBHOOK] Received webhook callback request');
  try {
    const body = await req.json();
    const { response: base64Response } = body;

    if (!base64Response) {
      console.error('[PHONEPE_WEBHOOK] Missing response payload in webhook body');
      return NextResponse.json({ success: false, error: 'Missing response payload' }, { status: 400 });
    }

    const saltKey = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';

    // 1. Retrieve and Validate the X-VERIFY header signature
    const xVerifyHeader = req.headers.get('X-VERIFY') || req.headers.get('x-verify') || '';
    if (!xVerifyHeader) {
      console.error('[PHONEPE_WEBHOOK] Missing X-VERIFY signature header');
      return NextResponse.json({ success: false, error: 'Missing X-VERIFY header' }, { status: 400 });
    }

    const [receivedHash, receivedIndex] = xVerifyHeader.split('###');
    console.log(`[PHONEPE_WEBHOOK] Received hash: ${receivedHash}, index: ${receivedIndex}`);

    // Compute signature: SHA256(Base64Response + SaltKey)
    const stringToHash = base64Response + saltKey;
    const computedHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

    const isValidSignature = computedHash === receivedHash;
    console.log(`[PHONEPE_WEBHOOK] Computed verification hash: ${computedHash}`);

    if (!isValidSignature) {
      console.error('[PHONEPE_WEBHOOK] Checksum signature validation failed! Rejecting callback request.');
      return NextResponse.json({ success: false, error: 'Signature verification failed' }, { status: 400 });
    }

    console.log('[PHONEPE_WEBHOOK] Checksum signature validated successfully.');

    // 2. Decode the Base64 payload
    const decodedPayloadStr = Buffer.from(base64Response, 'base64').toString('utf-8');
    const payload = JSON.parse(decodedPayloadStr);
    console.log('[PHONEPE_WEBHOOK] Decoded payload:', JSON.stringify(payload, null, 2));

    const success = payload.success;
    const code = payload.code;
    const merchantTransactionId = payload.data?.merchantTransactionId || payload.merchantTransactionId;
    const subscriptionId = payload.data?.subscriptionId || null;
    const merchantUserId = payload.data?.merchantUserId || 'UNKNOWN_USER';

    // 3. Mock Database Integration Log
    if (success && code === 'PAYMENT_SUCCESS') {
      console.log('==================================================');
      console.log('[PHONEPE_WEBHOOK] DB TRANSACTION RECORD (SUCCESS)');
      console.log(`- Mandate ID (subscriptionId): ${subscriptionId}`);
      console.log(`- Transaction ID: ${merchantTransactionId}`);
      console.log(`- User ID: ${merchantUserId}`);
      console.log(`- Active Status: ACTIVE`);
      console.log(`- Created At: ${new Date().toISOString()}`);
      console.log('==================================================');
    } else {
      console.warn('==================================================');
      console.warn('[PHONEPE_WEBHOOK] DB TRANSACTION RECORD (FAILED/DECLINED)');
      console.warn(`- Transaction ID: ${merchantTransactionId}`);
      console.warn(`- Code: ${code}`);
      console.warn(`- Message: ${payload.message || 'Mandate declined or failed.'}`);
      console.warn('==================================================');
    }

    // Server-to-server callbacks require returning a success acknowledgment back to PhonePe
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[PHONEPE_WEBHOOK] Exception occurred in webhook POST handler:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/subscription/callback
 * Handles user GET redirection from the PhonePe checkout page.
 * Reads response status query parameters and redirects the user back to the home page.
 */
export async function GET(req) {
  console.log('[PHONEPE_REDIRECT] Received browser redirect GET request');
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL(req.url);
    
    // Parse redirect parameters sent by PhonePe Sandbox
    const code = url.searchParams.get('code') || url.searchParams.get('status');
    const transactionId = url.searchParams.get('transactionId') || url.searchParams.get('merchantTransactionId') || 'UNKNOWN';
    const subscriptionId = url.searchParams.get('subscriptionId');

    console.log('[PHONEPE_REDIRECT] Query parameters extracted:', {
      code,
      transactionId,
      subscriptionId
    });

    const isSuccess = code === 'PAYMENT_SUCCESS' || code === 'SUCCESS';
    const statusParam = isSuccess ? 'SUCCESS' : 'FAILED';
    
    // Setup redirection back to the frontend homepage
    const redirectUrl = new URL(baseUrl);
    redirectUrl.searchParams.set('status', statusParam);
    redirectUrl.searchParams.set('transactionId', transactionId);
    
    if (subscriptionId) {
      redirectUrl.searchParams.set('subscriptionId', subscriptionId);
    } else if (transactionId && isSuccess) {
      // Setup fallback mandate ID if standard pay redirect lacks subscriptionId parameter
      redirectUrl.searchParams.set('subscriptionId', 'MOCK_SUB_' + transactionId);
    }
    
    console.log(`[PHONEPE_REDIRECT] Redirecting user browser to: ${redirectUrl.toString()}`);
    return NextResponse.redirect(redirectUrl.toString(), 303);

  } catch (error) {
    console.error('[PHONEPE_REDIRECT] Exception occurred in redirect GET handler:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/?status=ERROR&error=${encodeURIComponent(error.message)}`, 303);
  }
}
