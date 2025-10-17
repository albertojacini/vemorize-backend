import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://deno.land/x/openai@v4.20.1/mod.ts';
import { ttsRequestSchema, TtsErrorResponse } from '../_shared/shared/contracts/api/tts.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' } as TtsErrorResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' } as TtsErrorResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate request
    const body = await req.json();
    const validation = ttsRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.message
        } as TtsErrorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, speed } = validation.data;

    // 3. Call OpenAI TTS
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

    const mp3Response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',  // Fixed voice for simplicity
      input: text,
      speed: speed,
    });

    // 4. Stream audio
    const audioBuffer = await mp3Response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return new Response(
      JSON.stringify({
        error: 'TTS generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      } as TtsErrorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
