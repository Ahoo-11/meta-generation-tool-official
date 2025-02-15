
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    const apiKey = Deno.env.get('GOOGLE_API_KEY')

    if (!apiKey) {
      throw new Error('Google API key not found')
    }

    // Fetch the image data
    const imageResponse = await fetch(imageUrl)
    const imageData = await imageResponse.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)))

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-8b:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: "Analyze this image and provide the following metadata in JSON format: title (a descriptive title), category (a single category that best describes the image), and keywords (an array of relevant keywords, maximum 5). Make sure to only return valid JSON."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }]
      })
    })

    const data = await response.json()
    console.log('Gemini API response:', data)

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    const textResponse = data.candidates[0].content.parts[0].text
    let metadata

    try {
      // Extract JSON from the response text
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
      metadata = jsonMatch ? JSON.parse(jsonMatch[0]) : null

      if (!metadata) {
        throw new Error('No valid JSON found in response')
      }
    } catch (error) {
      console.error('Error parsing metadata:', error)
      throw new Error('Failed to parse metadata from Gemini response')
    }

    // Update the image record with the generated metadata
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseAdmin
      .from('images')
      .update({ 
        metadata,
        title: metadata.title,
        status: 'complete'
      })
      .eq('file_path', imageUrl.split('/').pop())

    if (updateError) {
      console.error('Error updating image metadata:', updateError)
      throw new Error('Failed to update image metadata')
    }

    return new Response(
      JSON.stringify({ success: true, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-image function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
