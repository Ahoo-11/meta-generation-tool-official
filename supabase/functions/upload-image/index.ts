import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
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

    // Create AWS signature headers
    const date = new Date().toISOString().split('T')[0]
    const amzDate = date.replace(/-/g, '')
    
    const r2Headers = new Headers({
      'Content-Type': file.type,
      'x-amz-date': amzDate,
      'x-amz-acl': 'public-read',
      'Authorization': `AWS4-HMAC-SHA256 Credential=${Deno.env.get('R2_ACCESS_KEY_ID')}/${date}/auto/s3/aws4_request`,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
    })

    console.log('Uploading to R2 with URL:', `${Deno.env.get('R2_ENDPOINT_URL')}/${Deno.env.get('R2_BUCKET_NAME')}/${filePath}`)
    
    // Upload to R2
    const r2Response = await fetch(
      `${Deno.env.get('R2_ENDPOINT_URL')}/${Deno.env.get('R2_BUCKET_NAME')}/${filePath}`,
      {
        method: 'PUT',
        headers: r2Headers,
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
        status: 'complete'
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