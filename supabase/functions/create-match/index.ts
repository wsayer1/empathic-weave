import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { userSecretId, targetSecretId } = await req.json()

    if (!userSecretId || !targetSecretId) {
      throw new Error('Missing required parameters: userSecretId and targetSecretId')
    }

    console.log('Creating match between secrets:', { userSecretId, targetSecretId, userId: user.id })

    // Get the secrets to verify ownership and get user IDs
    const { data: userSecret, error: userSecretError } = await supabaseClient
      .from('secrets')
      .select('*')
      .eq('id', userSecretId)
      .single()

    if (userSecretError || !userSecret) {
      console.error('Error fetching user secret:', userSecretError)
      throw new Error('User secret not found')
    }

    console.log('User secret found:', { 
      secretId: userSecret.id, 
      secretUserId: userSecret.user_id, 
      currentUserId: user.id 
    });

    // Check ownership - user must own the secret OR it must be anonymous (null user_id)
    if (userSecret.user_id !== null && userSecret.user_id !== user.id) {
      console.error('User does not own the specified secret:', {
        secretUserId: userSecret.user_id,
        currentUserId: user.id
      });
      throw new Error('User does not own the specified secret')
    }

    const { data: targetSecret, error: targetSecretError } = await supabaseClient
      .from('secrets')
      .select('user_id')
      .eq('id', targetSecretId)
      .single()

    if (targetSecretError || !targetSecret) {
      throw new Error('Target secret not found')
    }

    // Check if a match already exists between these secrets
    const { data: existingMatch, error: existingMatchError } = await supabaseClient
      .from('matches')
      .select('id')
      .or(`and(secret1_id.eq.${userSecretId},secret2_id.eq.${targetSecretId}),and(secret1_id.eq.${targetSecretId},secret2_id.eq.${userSecretId})`)
      .single()

    if (existingMatch) {
      console.log('Match already exists:', existingMatch.id)
      return new Response(
        JSON.stringify({ success: true, matchId: existingMatch.id, message: 'Match already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the match - use the actual user IDs from the secrets
    const user1Id = userSecret.user_id || user.id; // Fallback to current user if still null
    const user2Id = targetSecret.user_id;
    
    if (!user2Id) {
      throw new Error('Target secret has no associated user');
    }
    
    const { data: newMatch, error: matchError } = await supabaseClient
      .from('matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        secret1_id: userSecretId,
        secret2_id: targetSecretId,
        status: 'active'
      })
      .select()
      .single()

    if (matchError) {
      console.error('Error creating match:', matchError)
      throw new Error('Failed to create match: ' + matchError.message)
    }

    console.log('Match created successfully:', newMatch.id)

    return new Response(
      JSON.stringify({ success: true, matchId: newMatch.id, message: 'Match created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-match function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})