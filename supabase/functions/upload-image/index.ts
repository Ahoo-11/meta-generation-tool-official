import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Sharp from 'https://esm.sh/sharp@0.32.6'

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

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Compress image using Sharp
    const compressedImage = await Sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer()

    // Generate unique filename
    const fileExt = 'jpg' // We're converting everything to JPEG
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload to R2
    const r2Response = await fetch(`${Deno.env.get('R2_ENDPOINT_URL')}/${Deno.env.get('R2_BUCKET_NAME')}/${filePath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'x-amz-acl': 'public-read',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${Deno.env.get('R2_ACCESS_KEY_ID')}`,
      },
      body: compressedImage,
    })

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