import { createClient } from '@/lib/supabase/client'

type BucketName = 'kyc-documents' | 'payment-proofs'

export async function uploadFile(
  file: File,
  bucket: BucketName,
  path: string
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filePath = `${path}.${ext}`
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true })
  
  if (error) throw new Error(error.message)
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export async function uploadKyc(
  file: File,
  memberId: string,
  type: 'aadhaar' | 'pan' | 'photo' | 'signature'
): Promise<string> {
  return uploadFile(
    file, 'kyc-documents', 
    `${memberId}/${type}`
  )
}

export async function uploadPaymentProof(
  file: File,
  memberId: string
): Promise<string> {
  return uploadFile(
    file, 'payment-proofs',
    `${memberId}/${Date.now()}`
  )
}

export function validateFile(
  file: File,
  opts: { maxMB?: number; types?: string[] }
): string | null {
  const maxBytes = (opts.maxMB ?? 5) * 1024 * 1024
  if (file.size > maxBytes) 
    return `File must be under ${opts.maxMB ?? 5}MB`
  if (opts.types && !opts.types.includes(file.type))
    return `Invalid file type. Allowed: ${opts.types.join(', ')}`
  return null
}
