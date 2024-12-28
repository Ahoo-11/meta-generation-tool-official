import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const keyData = key instanceof ArrayBuffer ? key : new TextEncoder().encode(key);
  const messageData = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, messageData);
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256('AWS4' + key, dateStamp);
  const kRegion = await hmacSha256(kDate, regionName);
  const kService = await hmacSha256(kRegion, serviceName);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return kSigning;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      throw new Error('No file uploaded')
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader)
    if (userError || !user) {
      throw new Error('Invalid user')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Get file data as ArrayBuffer
    const fileData = await file.arrayBuffer()

    // AWS S3/R2 signing process
    const method = 'PUT'
    const region = 'auto'
    const service = 's3'
    const host = Deno.env.get('R2_ENDPOINT_URL')?.replace('https://', '')
    const bucket = Deno.env.get('R2_BUCKET_NAME')
    const accessKey = Deno.env.get('R2_ACCESS_KEY_ID')
    const secretKey = Deno.env.get('R2_SECRET_ACCESS_KEY')

    if (!host || !bucket || !accessKey || !secretKey) {
      throw new Error('Missing R2 configuration')
    }

    const date = new Date()
    const amzdate = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
    const dateStamp = amzdate.slice(0, 8)

    // Create canonical request
    const canonicalUri = `/${bucket}/${filePath}`
    const canonicalQueryString = ''
    const canonicalHeaders = [
      `content-type:${file.type}`,
      `host:${host}`,
      `x-amz-acl:public-read`,
      `x-amz-content-sha256:UNSIGNED-PAYLOAD`,
      `x-amz-date:${amzdate}`,
    ].join('\n') + '\n'
    
    const signedHeaders = 'content-type;host;x-amz-acl;x-amz-content-sha256;x-amz-date'
    const payloadHash = 'UNSIGNED-PAYLOAD'
    const canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join('\n')

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [algorithm, amzdate, credentialScope, encodeHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)))].join('\n')

    // Calculate signature
    const signingKey = await getSignatureKey(secretKey, dateStamp, region, service)
    const signature = encodeHex(new Uint8Array(await hmacSha256(signingKey, stringToSign)))

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    console.log('Uploading to R2:', `${Deno.env.get('R2_ENDPOINT_URL')}/${bucket}/${filePath}`)

    // Upload to R2
    const r2Response = await fetch(
      `${Deno.env.get('R2_ENDPOINT_URL')}/${bucket}/${filePath}`,
      {
        method,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
          'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
          'x-amz-date': amzdate,
          'Authorization': authorizationHeader,
        },
        body: fileData,
      }
    )

    console.log('R2 Response:', r2Response.status, await r2Response.text())

    if (!r2Response.ok) {
      throw new Error('Failed to upload to R2')
    }

    // Save metadata to Supabase
    const { error: dbError } = await supabaseAdmin
      .from('images')
      .insert({
        user_id: user.id,
        file_path: filePath,
        title: file.name,
        status: 'processing'
      })

    if (dbError) {
      throw new Error('Failed to save to database')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        filePath 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})