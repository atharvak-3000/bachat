import crypto from "crypto"

export const MERCHANT_ID = "PGTESTPAYUAT86"
export const SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"
export const SALT_INDEX = "1"
export const BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"

export const PLANS = {
  BASIC: {
    id: "BASIC",
    name: "Basic Plan",
    amount: 15000, // Stored in paise (₹150)
    maxMembers: 10,
  },
  STANDARD: {
    id: "STANDARD",
    name: "Standard Plan",
    amount: 25000, // Stored in paise (₹250)
    maxMembers: 15,
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium Plan",
    amount: 50000, // Stored in paise (₹500)
    maxMembers: 999999, // 15+ members
  },
} as const

export type PlanId = keyof typeof PLANS

export function getPlanForMembers(count: number) {
  if (count <= 10) return PLANS.BASIC
  if (count <= 15) return PLANS.STANDARD
  return PLANS.PREMIUM
}

/**
 * Generates the X-VERIFY checksum for /pg/v1/pay
 */
export function generateChecksum(payload: any, endpoint: string): { base64Payload: string, checksum: string } {
  const payloadString = JSON.stringify(payload)
  const base64Payload = Buffer.from(payloadString, "utf8").toString("base64")
  const stringToHash = base64Payload + endpoint + SALT_KEY
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex")
  const checksum = `${hash}###${SALT_INDEX}`
  return { base64Payload, checksum }
}

/**
 * Generates the X-VERIFY checksum for check transaction status API
 */
export function generateStatusChecksum(merchantTransactionId: string): string {
  const endpoint = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`
  const stringToHash = endpoint + SALT_KEY
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex")
  return `${hash}###${SALT_INDEX}`
}

/**
 * Verifies PhonePe server-to-server webhook callback payload X-VERIFY checksum
 */
export function verifyChecksum(xVerify: string, responseBody: string): boolean {
  if (!xVerify) return false
  const stringToHash = responseBody + SALT_KEY
  const hash = crypto.createHash("sha256").update(stringToHash).digest("hex")
  const calculatedChecksum = `${hash}###${SALT_INDEX}`
  return calculatedChecksum === xVerify
}
