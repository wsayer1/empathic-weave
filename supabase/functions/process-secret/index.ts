import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { secret_text, user_id } = await req.json();

    if (!secret_text || secret_text.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Secret text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing secret for user:', user_id || 'anonymous');
    console.log('Secret text:', secret_text.substring(0, 50) + '...');

    // Generate embedding using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: secret_text,
      }),
    });

    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log('Generated embedding, length:', embedding.length);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Save the secret with embedding
    const { data: newSecret, error: insertError } = await supabase
      .from('secrets')
      .insert({
        secret_text,
        embedding,
        user_id: user_id || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting secret:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save secret' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Secret saved with ID:', newSecret.id);

    // Find similar secrets using cosine similarity
    // Exclude the just-inserted secret and user's own secrets if user_id is provided
    let query = supabase
      .from('secrets')
      .select('id, secret_text, created_at, user_id, embedding')
      .neq('id', newSecret.id);

    // If user is authenticated, exclude their own secrets AND anonymous secrets from similar results
    // (since you can't message anonymous users)
    if (user_id) {
      query = query.neq('user_id', user_id).not('user_id', 'is', null);
    }

    const { data: allSecrets, error: selectError } = await query;

    if (selectError) {
      console.error('Error fetching secrets for similarity:', selectError);
      return new Response(
        JSON.stringify({ 
          secret: newSecret,
          similar_secrets: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to safely validate embeddings
    const validateEmbedding = (embedding: any): number[] | null => {
      try {
        if (Array.isArray(embedding) && embedding.length === 1536 && embedding.every(n => typeof n === 'number')) {
          return embedding;
        }
        if (typeof embedding === 'string') {
          const parsed = JSON.parse(embedding);
          if (Array.isArray(parsed) && parsed.length === 1536 && parsed.every(n => typeof n === 'number')) {
            return parsed;
          }
        }
        return null;
      } catch (error) {
        console.error('Error validating embedding:', error);
        return null;
      }
    };

    // Calculate cosine similarity in JavaScript (since we can't use pgvector functions in JS client)
    const calculateCosineSimilarity = (a: number[], b: number[]) => {
      const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dotProduct / (magnitudeA * magnitudeB);
    };

    // Calculate similarities for all secrets that have embeddings
    const similarities = allSecrets
      .map(secret => {
        const parsedEmbedding = validateEmbedding(secret.embedding);
        if (!parsedEmbedding) return null;
        
        return {
          ...secret,
          parsedEmbedding,
          similarity: calculateCosineSimilarity(embedding, parsedEmbedding)
        };
      })
      .filter(secret => secret !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // Get top 3 most similar

    console.log(`Found ${similarities.length} similar secrets for user ${user_id || 'anonymous'}`);
    if (user_id) {
      console.log('Excluded user own secrets and anonymous secrets from results');
    }

    // Remove embedding from response to keep it clean
    const responseSecret = {
      id: newSecret.id,
      secret_text: newSecret.secret_text,
      created_at: newSecret.created_at,
      user_id: newSecret.user_id
    };

    const responseSimilar = similarities.map(s => ({
      id: s.id,
      secret_text: s.secret_text,
      created_at: s.created_at,
      user_id: s.user_id,
      similarity: s.similarity
    }));

    return new Response(
      JSON.stringify({
        secret: responseSecret,
        similar_secrets: responseSimilar
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-secret function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
