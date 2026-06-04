import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  console.log('[PHONEPE_SETUP] Incoming request for subscription setup');
  try {
    const { userId, mobileNumber } = await req.json();

    const merchantId = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT86';
    const saltKey = process.env.PHONEPE_SALT_KEY || '96434309-7796-489d-8924-ab56988a6076';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Generate unique transaction ID
    const txnId = 'MT' + Date.now() + Math.floor(Math.random() * 1000);

    // Payload for VARIABLE Autopay Mandate setup
    // PhonePe UPI Autopay variable mandates are initiated with amount: 0 for free trials.
    const payload = {
      merchantId,
      merchantTransactionId: txnId,
      merchantUserId: userId || 'USER_' + Date.now(),
      amount: 0, // ₹0 for Free Trial mandate setup validation
      recurringType: 'VARIABLE',
      mobileNumber: mobileNumber || '9999999999',
      callbackUrl: `${baseUrl}/api/subscription/callback`,
      redirectUrl: `${baseUrl}/api/subscription/callback`,
      redirectMode: 'REDIRECT', // GET redirect back to our callback GET handler
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    console.log('[PHONEPE_SETUP] Generated request payload:', JSON.stringify(payload, null, 2));

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    console.log('[PHONEPE_SETUP] Base64 payload string:', base64Payload);

    const endpoint = '/pg/v1/subscription/create';
    
    // Checksum: SHA256(Base64Payload + Endpoint + SaltKey)###SaltIndex
    const stringToHash = base64Payload + endpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const xVerify = `${sha256}###${saltIndex}`;
    console.log(`[PHONEPE_SETUP] Computed X-VERIFY for endpoint ${endpoint}: ${xVerify}`);

    // Request PhonePe Sandbox API
    console.log(`[PHONEPE_SETUP] Fetching PhonePe endpoint: https://api-preprod.phonepe.com/apis/pg-sandbox${endpoint}`);
    const response = await fetch(`https://api-preprod.phonepe.com/apis/pg-sandbox${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json'
      },
      body: JSON.stringify({ request: base64Payload })
    });

    const data = await response.json();
    console.log('[PHONEPE_SETUP] PhonePe API Response:', JSON.stringify(data, null, 2));

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      console.log('[PHONEPE_SETUP] Subscription mandate initiated successfully. Redirecting to:', data.data.instrumentResponse.redirectInfo.url);
      return NextResponse.json({
        success: true,
        redirectUrl: data.data.instrumentResponse.redirectInfo.url,
        transactionId: txnId
      });
    } else {
      // In case sandbox account does not have UPI Autopay / subscription API mapping configured,
      // fallback to a standard ₹1 payment page checkout simulator to test redirect/webhook flow.
      console.warn('[PHONEPE_SETUP] /subscription/create failed or returned no redirect URL. Falling back to standard pay checkout page simulation...');
      
      const payPayload = { ...payload, amount: 100 }; // fallback to ₹1 (100 paise)
      console.log('[PHONEPE_SETUP] Generated fallback pay request payload:', JSON.stringify(payPayload, null, 2));

      const payBase64 = Buffer.from(JSON.stringify(payPayload)).toString('base64');
      const payEndpoint = '/pg/v1/pay';
      
      const payHash = crypto.createHash('sha256').update(payBase64 + payEndpoint + saltKey).digest('hex');
      const payVerify = `${payHash}###${saltIndex}`;
      console.log(`[PHONEPE_SETUP] Computed Fallback X-VERIFY for endpoint ${payEndpoint}: ${payVerify}`);

      console.log(`[PHONEPE_SETUP] Fetching PhonePe endpoint: https://api-preprod.phonepe.com/apis/pg-sandbox${payEndpoint}`);
      const payResponse = await fetch(`https://api-preprod.phonepe.com/apis/pg-sandbox${payEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': payVerify,
          'accept': 'application/json'
        },
        body: JSON.stringify({ request: payBase64 })
      });
      
      const payData = await payResponse.json();
      console.log('[PHONEPE_SETUP] PhonePe Fallback API Response:', JSON.stringify(payData, null, 2));
      
      if (payData.success && payData.data?.instrumentResponse?.redirectInfo?.url) {
        console.log('[PHONEPE_SETUP] Fallback payment checkout initiated successfully. Redirecting to:', payData.data.instrumentResponse.redirectInfo.url);
        return NextResponse.json({
          success: true,
          redirectUrl: payData.data.instrumentResponse.redirectInfo.url,
          transactionId: txnId,
          fallbackUsed: true
        });
      }

      console.error('[PHONEPE_SETUP] Both subscription and fallback pay checkout flows failed.');
      return NextResponse.json({
        success: false,
        message: data.message || payData.message || 'Failed to initiate mandate setup.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('[PHONEPE_SETUP] Exception occurred in setup route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
