const { supabaseCli } = require('../db/users.db');
const cryptoNode = require('crypto');

// Ephemeral cache for preview codes (not persisted). Key: 6-char code
// Value: { partyId: number, priceId: number, createdAt: number }
const previewCodeCache = new Map();
const PREVIEW_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/**
 * Test database connection and codes table
 */
const testConnection = async (req, res) => {
  try {
    console.log('[testConnection] Testing Supabase connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabaseCli
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('[testConnection] Users table error:', testError);
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
        error: testError.message
      });
    }
    
    console.log('[testConnection] Users table accessible');
    
    // Test codes table
    const { data: codesData, error: codesError } = await supabaseCli
      .from('Codes')
      .select('count')
      .limit(1);
    
    if (codesError) {
      console.error('[testConnection] Codes table error:', codesError);
      console.error('[testConnection] Error details:', {
        code: codesError.code,
        message: codesError.message,
        details: codesError.details
      });
      
      // Check if it's a table doesn't exist error
      if (codesError.code === '42P01' || codesError.message.includes('relation "codes" does not exist')) {
        return res.status(500).json({
          success: false,
          message: "Codes table does not exist. Please run the database setup script first.",
          error: "Table 'codes' not found",
          setup_required: true
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Codes table not accessible",
        error: codesError.message
      });
    }
    
    console.log('[testConnection] Codes table accessible');
    
    res.json({
      success: true,
      message: "Database connection successful",
      users_accessible: true,
      codes_accessible: true
    });
    
  } catch (error) {
    console.error('[testConnection] Error:', error);
    res.status(500).json({
      success: false,
      message: "Connection test failed",
      error: error.message
    });
  }
};

/**
 * Compose a code embedding party and price identifiers.
 * Format: P<partyId>-T<priceId>-<random>
 */
function embedCode(partyId, priceId, rawCode) {
  return `P${parseInt(partyId)}-T${parseInt(priceId)}-${String(rawCode)}`;
}

/**
 * Generate a short uppercase alphanumeric code of fixed length (default 6)
 */
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  // Prefer Node's crypto for uniform randomness
  for (let i = 0; i < length; i++) {
    const idx = cryptoNode.randomInt(0, chars.length);
    result += chars[idx];
  }
  return result;
}

/**
 * Generate unique entry codes for a party
 * Supports non-persist preview generation when `persist: false` is passed in body.
 */
const generateCodes = async (req, res) => {
  try {
    console.log('[generateCodes] Starting code generation...');
    console.log('[generateCodes] Supabase client available:', !!supabaseCli);
    
    const { party_id, price_id, price_name, quantity, persist } = req.body;
    
    console.log('[generateCodes] Request body:', req.body);
    console.log('[generateCodes] Parsed values:', { party_id, price_id, price_name, quantity });
    
    if (!party_id || (!price_id && !price_name) || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: party_id, price_id or price_name, quantity"
      });
    }

    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 100"
      });
    }

    // Resolve price_id (prefer provided, else look up by name)
    let resolvedPriceId = price_id ? parseInt(price_id) : null;

    if (!resolvedPriceId) {
      const { data: priceRow, error: priceLookupErr } = await supabaseCli
        .from('prices')
        .select('id, party_id')
        .eq('party_id', parseInt(party_id))
        .eq('price_name', String(price_name))
        .single();

      if (priceLookupErr) {
        console.error('[generateCodes] Price lookup error:', priceLookupErr);
        return res.status(500).json({ success: false, message: 'Error resolving ticket type' });
      }
      if (!priceRow) {
        return res.status(404).json({ success: false, message: 'Ticket type not found for this party' });
      }
      resolvedPriceId = priceRow.id;
    } else {
      // Validate that the provided price_id belongs to the party
      const { data: priceCheck, error: priceCheckErr } = await supabaseCli
        .from('prices')
        .select('id, party_id')
        .eq('id', resolvedPriceId)
        .single();
      if (priceCheckErr) {
        console.error('[generateCodes] Price check error:', priceCheckErr);
        return res.status(500).json({ success: false, message: 'Error verifying ticket type' });
      }
      if (!priceCheck || String(priceCheck.party_id) !== String(party_id)) {
        return res.status(400).json({ success: false, message: 'Ticket type does not belong to this party' });
      }
    }

    // If caller requests preview/non-persist, generate 6-char codes and cache metadata (no DB writes)
    if (persist === false) {
      console.log('[generateCodes] Persist=false: generating SHORT preview codes (6 chars) without saving');
      const codes = [];
      for (let i = 0; i < quantity; i++) {
        let code;
        // ensure uniqueness within this batch and current cache
        do {
          code = generateShortCode(6);
        } while (previewCodeCache.has(code) || codes.includes(code));

        // store ephemeral mapping
        previewCodeCache.set(code, {
          partyId: parseInt(party_id, 10),
          priceId: parseInt(resolvedPriceId, 10),
          createdAt: Date.now()
        });
        codes.push(code);
      }
      return res.json({
        success: true,
        message: `Successfully generated ${codes.length} codes (preview, not saved, 6-char)`,
        codes,
        saved_codes: []
      });
    }

    // First, get all existing codes from the database to ensure uniqueness
    console.log('[generateCodes] Checking existing codes in database...');
    let codesTableMissing = false;
    let existingCodeSet = new Set();
    const { data: existingCodes, error: fetchError } = await supabaseCli
      .from('Codes')
      .select('code');

    if (fetchError) {
      console.error('[generateCodes] Error fetching existing codes:', fetchError);
      console.error('[generateCodes] Error details:', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint
      });
      
      // If codes table doesn't exist or is missing from schema cache, continue without DB duplicate check
      const missingTable = (
        fetchError.code === '42P01' ||
        (fetchError.message || '').includes('relation "codes" does not exist') ||
        fetchError.code?.startsWith('PGRST') ||
        (fetchError.message || '').includes('Could not find the table') ||
        (fetchError.hint || '').includes('Perhaps you meant the table')
      );
      
      if (missingTable) {
        codesTableMissing = true;
        console.warn('[generateCodes] Codes table missing or not cached; proceeding without DB duplicate check and skipping insert.');
      } else {
        return res.status(500).json({
          success: false,
          message: "Error checking existing codes",
          error: fetchError.message
        });
      }
    } else {
      existingCodeSet = new Set(existingCodes.map(c => c.code));
      console.log('[generateCodes] Found', existingCodeSet.size, 'existing codes in database');
    }

    // Generate unique codes
    const codes = [];
    const usedCodes = new Set();
    let attempts = 0;
    const maxAttempts = quantity * 100; // Prevent infinite loops
    
    for (let i = 0; i < quantity; i++) {
      let code;
      let codeFound = false;
      
      do {
        // Generate a random 8-character alphanumeric code
        code = generateRandomCode();
        attempts++;
        
        // Check if code is unique (not in current batch AND not in database)
        if (!usedCodes.has(code) && !existingCodeSet.has(code)) {
          codeFound = true;
        }
        
        // If we're having trouble with random codes, try the unique code generator
        if (attempts > quantity * 10 && !codeFound) {
          console.log('[generateCodes] Switching to unique code generator for better uniqueness');
          code = generateUniqueCode();
          if (!usedCodes.has(code) && !existingCodeSet.has(code)) {
            codeFound = true;
          }
        }
        
        // Prevent infinite loops
        if (attempts > maxAttempts) {
          console.error('[generateCodes] Max attempts reached, cannot generate unique codes');
          return res.status(500).json({
            success: false,
            message: "Unable to generate unique codes. Please try with a smaller quantity."
          });
        }
      } while (!codeFound);
      
      usedCodes.add(code);
      codes.push(code);
      console.log(`[generateCodes] Generated unique code ${i + 1}/${quantity}: ${code}`);
    }

    console.log('[generateCodes] Generated codes:', codes.length);

    // Double-check uniqueness before insertion (additional safety measure)
    if (!codesTableMissing) {
      const finalCheck = await supabaseCli
        .from('codes')
        .select('code')
        .in('code', codes);

      if (finalCheck.data && finalCheck.data.length > 0) {
        console.error('[generateCodes] Found duplicate codes during final check:', finalCheck.data);
        return res.status(500).json({
          success: false,
          message: "Code generation failed due to unexpected duplicates. Please try again."
        });
      }
    }

    // Insert codes into database if table exists
    if (!codesTableMissing) {
      const codeRecords = codes.map(code => ({
        party_id: parseInt(party_id),
        code: embedCode(party_id, resolvedPriceId, code),
        price_id: resolvedPriceId,
        already_used: false,
        user_id: null // Will be set when code is used
      }));

      const { data: insertedCodes, error } = await supabaseCli
        .from('Codes')
        .insert(codeRecords)
        .select('id, code, price_id, already_used');

      if (error) {
        console.error('[generateCodes] Database error:', error);
        
        // Check if it's a unique constraint violation
        if (error.code === '23505' || (error.message || '').includes('duplicate key')) {
          return res.status(400).json({
            success: false,
            message: "Code generation failed due to duplicate codes. Please try again."
          });
        }
        
        return res.status(500).json({
          success: false,
          message: "Error saving codes to database"
        });
      }

      console.log('[generateCodes] Successfully saved codes:', insertedCodes.length);

      return res.json({
        success: true,
        message: `Successfully generated ${codes.length} codes`,
        codes: codeRecords.map(r => r.code),
        saved_codes: insertedCodes
      });
    } else {
      console.warn('[generateCodes] Returning generated codes without saving due to missing table');
      return res.json({
        success: true,
        message: `Successfully generated ${codes.length} codes (not saved; codes table missing)`,
        codes: codes,
        saved_codes: []
      });
    }

  } catch (error) {
    console.error('Error in generateCodes:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get codes for a specific party
 */
const getPartyCodes = async (req, res) => {
  try {
    const { partyId } = req.params;
    
    console.log('[getPartyCodes] Getting codes for party:', partyId);
    
    const { data: codes, error } = await supabaseCli
      .from('Codes')
      .select('*')
      .eq('party_id', partyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPartyCodes] Database error:', error);
      return res.status(500).json({
        success: false,
        message: "Error fetching codes"
      });
    }

    console.log('[getPartyCodes] Found codes:', codes.length);

    res.json({
      success: true,
      codes: codes
    });

  } catch (error) {
    console.error('Error in getPartyCodes:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Validate an entry code
 */
const validateCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    console.log('[validateCode] Validating code:', code);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    const { data: codeRecord, error } = await supabaseCli
      .from('Codes')
      .select('*, parties(title, location, date)')
      .eq('code', code)
      .single();

    if (error || !codeRecord) {
      return res.status(404).json({
        success: false,
        message: "Invalid code"
      });
    }

    if (codeRecord.already_used) {
      return res.status(400).json({
        success: false,
        message: "Code has already been used"
      });
    }

    console.log('[validateCode] Valid code found:', codeRecord);

    res.json({
      success: true,
      message: "Code is valid",
      code: codeRecord
    });

  } catch (error) {
    console.error('Error in validateCode:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Mark a code as used
 */
const useCode = async (req, res) => {
  try {
    const { code, user_id } = req.body;
    
    console.log('[useCode] Using code:', code, 'for user:', user_id);
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    const { data: updatedCode, error } = await supabaseCli
      .from('Codes')
      .update({ 
        already_used: true,
        user_id: user_id || null
      })
      .eq('code', code)
      .eq('already_used', false)
      .select()
      .single();

    if (error || !updatedCode) {
      return res.status(400).json({
        success: false,
        message: "Code not found or already used"
      });
    }

    console.log('[useCode] Code marked as used:', updatedCode);

    res.json({
      success: true,
      message: "Code successfully used",
      code: updatedCode
    });

  } catch (error) {
    console.error('Error in useCode:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Generate a random 8-character alphanumeric code
 * Uses crypto for better randomness and includes both uppercase and numbers
 */
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use crypto.getRandomValues for better randomness if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
}

/**
 * Generate a more complex unique code with timestamp component
 * This ensures even better uniqueness
 */
function generateUniqueCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = generateRandomCode().substring(0, 4);
  return randomPart + timestamp.substring(timestamp.length - 4);
}

/**
 * Verify code and add party to user's history
 */
const verifyAndAddParty = async (req, res) => {
  try {
    const { code, user_id } = req.body;
    
    console.log('============================================');
    console.log('[verifyAndAddParty] 🚀🚀🚀 FUNCTION CALLED 🚀🚀🚀');
    console.log('[verifyAndAddParty] Starting verification process...');
    console.log('[verifyAndAddParty] Code:', code);
    console.log('[verifyAndAddParty] User ID:', user_id);
    console.log('============================================');
    
    if (!code) {
      console.log('[verifyAndAddParty] Missing code');
      return res.status(400).json({
        success: false,
        message: "Code is required"
      });
    }

    // First, verify the code exists and is not used
    let { data: codeRecord, error: codeError } = await supabaseCli
      .from('Codes')
      .select('*')
      .eq('code', code)
      .single();

    if (codeError || !codeRecord) {
      console.log('[verifyAndAddParty] Code not found in DB. Checking preview cache and embedded format:', code);

      // First, try ephemeral preview cache for short 6-char codes
      let parsedPartyId = null;
      let parsedPriceId = null;
      const cached = previewCodeCache.get(String(code));
      if (cached) {
        // Check TTL
        if (Date.now() - cached.createdAt > PREVIEW_TTL_MS) {
          console.warn('[verifyAndAddParty] Preview code expired:', code);
          previewCodeCache.delete(String(code));
        } else {
          parsedPartyId = parseInt(cached.partyId, 10);
          parsedPriceId = parseInt(cached.priceId, 10);
        }
      }

      // If not found in cache, try to parse embedded code: P<partyId>-T<priceId>-<random>
      if (parsedPartyId == null || parsedPriceId == null) {
        const match = /^P(\d+)-T(\d+)-([A-Za-z0-9]+)$/.exec(String(code));
        if (!match) {
          return res.status(404).json({ success: false, message: 'Invalid code' });
        }
        parsedPartyId = parseInt(match[1], 10);
        parsedPriceId = parseInt(match[2], 10);
      }

      // Validate party exists and capacity is available BEFORE inserting code
      const { data: partyCheck, error: partyCheckError } = await supabaseCli
        .from('parties')
        .select('*')
        .eq('id', parsedPartyId)
        .single();
      if (partyCheckError || !partyCheck) {
        return res.status(404).json({ success: false, message: 'Party not found' });
      }
      // Capacity check based on reserved codes count
      try {
        const attStr = partyCheck.attendees || '0/100';
        const parts = String(attStr).split('/');
        const max = parseInt(parts[1], 10) || 100;
        const { count, error: cntErr } = await supabaseCli
          .from('Codes')
          .select('id', { count: 'exact', head: true })
          .eq('party_id', parsedPartyId)
          .eq('already_used', true);
        const reserved = cntErr ? 0 : (count || 0);
        if (reserved >= max) {
          return res.status(400).json({ success: false, message: 'Event is full' });
        }
      } catch (_) {}

      // Validate price belongs to party
      const { data: priceCheck, error: priceCheckErr } = await supabaseCli
        .from('prices')
        .select('id, party_id')
        .eq('id', parsedPriceId)
        .single();
      if (priceCheckErr || !priceCheck || String(priceCheck.party_id) !== String(parsedPartyId)) {
        return res.status(400).json({ success: false, message: 'Price information not found' });
      }

      // Insert the code now, marking it as NOT used yet; will mark as used after full verification
      const { data: inserted, error: insertErr } = await supabaseCli
        .from('Codes')
        .insert({
          party_id: parsedPartyId,
          code: String(code),
          price_id: parsedPriceId,
          already_used: false,
          user_id: user_id || null
        })
        .select('*')
        .single();

      if (insertErr || !inserted) {
        console.error('[verifyAndAddParty] Failed to insert embedded code:', insertErr);
        return res.status(500).json({ success: false, message: 'Error processing code' });
      }

      // Keep in cache until we mark as used successfully later
      codeRecord = inserted;
    }

    if (codeRecord.already_used) {
      console.log('[verifyAndAddParty] Code already used:', code);
      return res.status(400).json({
        success: false,
        message: "Code has already been used"
      });
    }

    // Get party information
    const { data: party, error: partyError } = await supabaseCli
      .from('parties')
      .select('*')
      .eq('id', codeRecord.party_id)
      .single();

    if (partyError || !party) {
      console.error('[verifyAndAddParty] Party not found:', partyError);
      return res.status(404).json({
        success: false,
        message: "Party not found"
      });
    }

    // Get price information
    const { data: price, error: priceError } = await supabaseCli
      .from('prices')
      .select('*')
      .eq('id', codeRecord.price_id)
      .single();

    if (priceError || !price) {
      console.error('[verifyAndAddParty] Price not found:', priceError);
      return res.status(404).json({
        success: false,
        message: "Price information not found"
      });
    }

    // Verify user exists only if provided
    let userObj = null;
    if (user_id) {
      const { data: user, error: userError } = await supabaseCli
        .from('users')
        .select('id, name')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        console.log('[verifyAndAddParty] User not found:', user_id);
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      userObj = user;
    }

    // Early capacity check based on reserved codes to avoid marking codes as used when event is full
    try {
      const attStrEarly = party.attendees || '0/100';
      const partsEarly = String(attStrEarly).split('/');
      const maxEarly = parseInt(partsEarly[1], 10) || 100;
      const { count, error: cntErr } = await supabaseCli
        .from('Codes')
        .select('id', { count: 'exact', head: true })
        .eq('party_id', party.id)
        .eq('already_used', true);
      const reservedEarly = cntErr ? 0 : (count || 0);
      if (reservedEarly >= maxEarly) {
        return res.status(400).json({ success: false, message: 'Event is full' });
      }
    } catch (_) {}

    // Check if user already has this party in their history (BEFORE marking code as used)
    console.log('[verifyAndAddParty] Checking if user already has this party...');
    console.log('[verifyAndAddParty] User ID:', user_id);
    console.log('[verifyAndAddParty] Party ID:', codeRecord.party_id);
    
    if (user_id) {
      const { data: existingUserParty, error: checkError } = await supabaseCli
        .from('Codes')
        .select('id')
        .eq('user_id', user_id)
        .eq('party_id', codeRecord.party_id)
        .eq('already_used', true)
        .limit(1);

      if (checkError) {
        console.error('[verifyAndAddParty] Error checking existing party:', checkError);
        return res.status(500).json({
          success: false,
          message: "Error checking party history"
        });
      }

      console.log('[verifyAndAddParty] Existing party check result:', existingUserParty);

      if (existingUserParty && existingUserParty.length > 0) {
        console.log('[verifyAndAddParty] User already has this party in history');
        return res.status(400).json({
          success: false,
          message: "You have already added this party to your history"
        });
      }
    }

    // Mark code as used when we found (or inserted) an existing unused record.
    if (!codeRecord.already_used) {
      const { data: updatedCode, error: updateError } = await supabaseCli
        .from('Codes')
        .update({ 
          already_used: true,
          user_id: user_id || null
        })
        .eq('code', code)
        .eq('already_used', false)
        .select()
        .single();

      if (updateError || !updatedCode) {
        console.error('[verifyAndAddParty] Error marking code as used:', updateError);
        return res.status(500).json({
          success: false,
          message: "Error processing code"
        });
      }
      // If it came from preview cache, consume it now that verification completed
      previewCodeCache.delete(String(code));
      codeRecord = updatedCode;
    }

    // Increment attendees count on party (e.g., 0/100 -> 1/100)
    try {
      const attStr = party.attendees || "0/100";
      const parts = String(attStr).split('/');
      let current = parseInt(parts[0], 10) || 0;
      let max = parseInt(parts[1], 10) || 100;

      if (current >= max) {
        return res.status(400).json({
          success: false,
          message: "Event is full"
        });
      }

      current += 1;

      const { data: updatedParty, error: partyUpdateErr } = await supabaseCli
        .from('parties')
        .update({ attendees: `${current}/${max}` })
        .eq('id', party.id)
        .select('id, attendees')
        .single();

      if (partyUpdateErr || !updatedParty) {
        console.error('[verifyAndAddParty] Error updating attendees:', partyUpdateErr);
        return res.status(500).json({
          success: false,
          message: "Failed to update attendees"
        });
      }
      console.log('[verifyAndAddParty] Attendees updated:', updatedParty.attendees);
    } catch (attErr) {
      console.error('[verifyAndAddParty] Unexpected error updating attendees:', attErr);
      return res.status(500).json({ success: false, message: 'Unexpected error updating attendees' });
    }

    console.log('[verifyAndAddParty] ✅✅✅ Successfully added party to user history ✅✅✅');
    console.log('[verifyAndAddParty] ============================================');
    console.log('[verifyAndAddParty] 🎯 CRITICAL CHECKPOINT: About to enter QR code generation block');
    console.log('[verifyAndAddParty] Code Record ID:', codeRecord?.id);
    console.log('[verifyAndAddParty] Party ID:', codeRecord?.party_id);
    console.log('[verifyAndAddParty] User ID:', user_id);
    console.log('[verifyAndAddParty] ============================================');

    // Insert pending guest entry for this party (to show in guests-summary)
    console.log('[verifyAndAddParty] 📝 About to insert pending guest entry...');
    try {
      const guestName = userObj?.name || 'Guest';
      console.log('[verifyAndAddParty] Guest name:', guestName);
      // Try Invitados_Lista first
      let { data: insertedGuest, error: guestErr } = await supabaseCli
        .from('Invitados_Lista')
        .insert({ name: guestName, validado: null, party_id: party.id })
        .select('id')
        .single();

      const isMissingTableOrColumn = (err) => !!err && (
        String(err?.message || '').toLowerCase().includes('could not find') ||
        String(err?.message || '').toLowerCase().includes('schema cache') ||
        String(err?.message || '').toLowerCase().includes('relation') ||
        String(err?.message || '').toLowerCase().includes('column')
      );

      if (guestErr && isMissingTableOrColumn(guestErr)) {
        ({ data: insertedGuest, error: guestErr } = await supabaseCli
          .from('Invitados_Fiesta')
          .insert({ name: guestName, validado: null, party_id: party.id })
          .select('id')
          .single());
      }

      if (guestErr) {
        console.warn('[verifyAndAddParty] Warning: could not insert pending guest:', guestErr?.message);
      } else {
        console.log('[verifyAndAddParty] ✅ Pending guest entry inserted successfully');
      }
    } catch (ge) {
      console.warn('[verifyAndAddParty] Warning: unexpected error inserting pending guest:', ge?.message);
    }

    console.log('[verifyAndAddParty] ============================================');
    console.log('[verifyAndAddParty] 🎯🎯🎯 NOW ENTERING QR CODE GENERATION BLOCK 🎯🎯🎯');
    console.log('[verifyAndAddParty] ============================================');
    
    // Generate and store QR code for EVERY successful registration (ticket/invitation)
    // Using the table structure: id, created_at, user_id, party_id, code, qr_token, status, valid_until, used_at, qr_image
    console.log('[verifyAndAddParty] ============================================');
    console.log('[verifyAndAddParty] STARTING QR CODE GENERATION PROCESS');
    console.log('[verifyAndAddParty] ============================================');
    
    let qrToken = null;
    let qrImageUrl = null;
    let insertedGuestName = userObj?.name || 'Guest';
    
    console.log('[verifyAndAddParty] === GENERATING QR CODE TICKET/INVITATION ===');
    console.log('[verifyAndAddParty] user_id:', user_id);
    console.log('[verifyAndAddParty] party_id:', codeRecord.party_id);
    console.log('[verifyAndAddParty] code_id:', codeRecord.id);
    console.log('[verifyAndAddParty] guest name:', insertedGuestName);
    
    try {
      // Try to resolve user_id
      let resolvedUserId = user_id;
      if (!resolvedUserId && insertedGuestName) {
        const { data: foundUser, error: findError } = await supabaseCli
          .from('users')
          .select('id')
          .eq('name', insertedGuestName)
          .single();
        
        if (foundUser && !findError) {
          resolvedUserId = foundUser.id;
          console.log('[verifyAndAddParty] Found user by name:', resolvedUserId);
        }
      }
      
      // IMPORTANT: Generate a QR code for this specific registration
      // Each registration with a code should have a unique QR code ticket/invitation
      // Check if QR code already exists for this user + party + code combination
      let existingQR = null;
      try {
        if (resolvedUserId) {
          console.log('[verifyAndAddParty] Checking for existing QR code for user:', resolvedUserId, 'party:', codeRecord.party_id, 'code:', codeRecord.id);
          const { data: existing, error: checkError } = await supabaseCli
            .from('qr_codes')
            .select('qr_token, qr_image, status, id')
            .eq('user_id', resolvedUserId)
            .eq('party_id', codeRecord.party_id);
          
          // If code exists, also filter by code
          let existingFiltered = existing;
          if (codeRecord.id && existing) {
            existingFiltered = existing.filter(qr => qr.code === codeRecord.id || !qr.code);
          }
          
          if (existingFiltered && existingFiltered.length > 0 && !checkError) {
            existingQR = existingFiltered[0];
            console.log('[verifyAndAddParty] ✅ Found existing QR code for this registration, will reuse it');
          } else {
            console.log('[verifyAndAddParty] No existing QR code found, will generate new one');
          }
        } else {
          // For guests, check by party_id, code, and user_id is null
          console.log('[verifyAndAddParty] Checking for existing QR code for guest, party:', codeRecord.party_id, 'code:', codeRecord.id);
          let guestCheckQuery = supabaseCli
            .from('qr_codes')
            .select('qr_token, qr_image, status, id')
            .eq('party_id', codeRecord.party_id)
            .is('user_id', null);
          
          // Only add code filter if codeRecord.id exists
          if (codeRecord.id) {
            guestCheckQuery = guestCheckQuery.eq('code', codeRecord.id);
          }
          
          const { data: existing, error: checkError } = await guestCheckQuery;
          
          if (existing && existing.length > 0 && !checkError) {
            existingQR = existing[0];
            console.log('[verifyAndAddParty] ✅ Found existing QR code for guest, will reuse it');
          } else {
            console.log('[verifyAndAddParty] No existing QR code found for guest, will generate new one');
          }
        }
      } catch (checkErr) {
        console.warn('[verifyAndAddParty] Exception checking for existing QR code:', checkErr.message);
        // Continue to generate new QR code
      }
      
      if (existingQR) {
        // Reuse existing QR code
        qrToken = existingQR.qr_token;
        qrImageUrl = existingQR.qr_image;
        console.log('[verifyAndAddParty] Reusing existing QR code ID:', existingQR.id);
      } else {
        // Generate new QR code
        console.log('[verifyAndAddParty] Generating NEW QR code for this registration...');
        const timestamp = Date.now();
        const randomPart = cryptoNode.randomBytes(8).toString('hex').toUpperCase();
        const userIdPart = resolvedUserId ? resolvedUserId : `GUEST-${insertedGuestName?.replace(/\s+/g, '-') || 'ANON'}`;
        qrToken = `QR-${userIdPart}-${codeRecord.party_id}-${codeRecord.id}-${timestamp}-${randomPart}`;
        
        // Generate QR code image as base64
        const qrCodeImageBase64 = await QRCode.toDataURL(qrToken, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 300
        });
        
        console.log('[verifyAndAddParty] QR code image generated, uploading to storage...');
        
        // Upload QR code image to Supabase Storage
        try {
          const bucket = "qr-codes";
          const fileName = `qr_${codeRecord.party_id}_${codeRecord.id}_${timestamp}.png`;
          const filePath = `qr-codes/${fileName}`;
          
          // Extract base64 data
          const base64Data = qrCodeImageBase64.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Try to upload
          let uploadError = null;
          let uploaded = null;
          try {
            const upRes = await supabaseCli.storage
              .from(bucket)
              .upload(filePath, buffer, { upsert: true, contentType: 'image/png' });
            uploaded = upRes.data;
            uploadError = upRes.error || null;
          } catch (e) {
            uploadError = e;
          }
          
          // If bucket doesn't exist, try to create it
          if (uploadError) {
            console.log('[verifyAndAddParty] Bucket might not exist, trying to create it...');
            try {
              await supabaseCli.storage.createBucket(bucket, { public: true });
              const retry = await supabaseCli.storage
                .from(bucket)
                .upload(filePath, buffer, { upsert: true, contentType: 'image/png' });
              uploaded = retry.data;
              uploadError = retry.error || null;
            } catch (createErr) {
              console.error('[verifyAndAddParty] Failed to create bucket:', createErr);
            }
          }
          
          if (uploaded && !uploadError) {
            // Get public URL
            const { data: pub } = await supabaseCli.storage.from(bucket).getPublicUrl(filePath);
            qrImageUrl = pub?.publicUrl;
            console.log('[verifyAndAddParty] QR code image uploaded, URL:', qrImageUrl);
          } else {
            console.error('[verifyAndAddParty] Failed to upload QR code image:', uploadError);
            // Fallback: use data URL if upload fails
            qrImageUrl = qrCodeImageBase64;
            console.warn('[verifyAndAddParty] Using base64 data URL as fallback');
          }
        } catch (uploadErr) {
          console.error('[verifyAndAddParty] Error uploading QR code:', uploadErr);
          // Fallback: use data URL
          qrImageUrl = qrCodeImageBase64;
        }
        
        // Parse party date to set valid_until
        let validUntil = null;
        try {
          // Party date format might be like "5/9/21 • 23:00-06:00" or ISO format
          if (party.date) {
            // Try to parse the date
            const dateStr = party.date.split('•')[0].trim(); // Get date part
            // If it's in format like "5/9/21", convert it
            if (dateStr.includes('/')) {
              const [day, month, year] = dateStr.split('/');
              const fullYear = year.length === 2 ? `20${year}` : year;
              validUntil = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59`);
            } else {
              validUntil = new Date(party.date);
            }
          }
        } catch (dateErr) {
          console.warn('[verifyAndAddParty] Could not parse party date, using default');
          // Default to 30 days from now
          validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        
        // Prepare insert data with correct column names
        // IMPORTANT: The 'code' field has a foreign key to Codes table
        // We need to verify the code exists before inserting
        const qrInsertData = {
          user_id: resolvedUserId || null,
          party_id: codeRecord.party_id,
          qr_token: qrToken,
          status: 'not used',
          valid_until: validUntil ? validUntil.toISOString() : null,
          used_at: null,
          qr_image: qrImageUrl
        };
        
        // Add code field only if codeRecord.id exists and is valid
        // Verify the code exists in Codes table first
        if (codeRecord.id) {
          console.log('[verifyAndAddParty] Verifying code ID exists in Codes table:', codeRecord.id);
          const { data: codeCheck, error: codeCheckError } = await supabaseCli
            .from('Codes')
            .select('id')
            .eq('id', codeRecord.id)
            .single();
          
          if (codeCheck && !codeCheckError) {
            qrInsertData.code = codeRecord.id;
            console.log('[verifyAndAddParty] ✅ Code ID verified, will include in insert');
          } else {
            console.warn('[verifyAndAddParty] ⚠️ Code ID not found in Codes table, will insert without code field');
            console.warn('[verifyAndAddParty] Code check error:', codeCheckError);
          }
        } else {
          console.warn('[verifyAndAddParty] ⚠️ codeRecord.id is missing, will insert without code field');
        }
        
        console.log('[verifyAndAddParty] ===== ATTEMPTING QR CODE INSERT =====');
        console.log('[verifyAndAddParty] Insert data:', JSON.stringify(qrInsertData, null, 2));
        console.log('[verifyAndAddParty] user_id:', qrInsertData.user_id || 'NULL');
        console.log('[verifyAndAddParty] party_id:', qrInsertData.party_id);
        console.log('[verifyAndAddParty] code:', qrInsertData.code || 'NULL');
        console.log('[verifyAndAddParty] qr_token:', qrInsertData.qr_token);
        console.log('[verifyAndAddParty] status:', qrInsertData.status);
        console.log('[verifyAndAddParty] qr_image:', qrInsertData.qr_image ? (qrInsertData.qr_image.substring(0, 100) + '...') : 'NULL');
        console.log('[verifyAndAddParty] valid_until:', qrInsertData.valid_until);
        
        console.log('[verifyAndAddParty] About to execute Supabase insert...');
        const { data: insertedQR, error: qrError } = await supabaseCli
          .from('qr_codes')
          .insert(qrInsertData)
          .select('id')
          .single();
        console.log('[verifyAndAddParty] Supabase insert executed');
        
        console.log('[verifyAndAddParty] ===== INSERT RESULT =====');
        console.log('[verifyAndAddParty] insertedQR:', insertedQR);
        console.log('[verifyAndAddParty] qrError:', qrError);
        
        if (qrError) {
          console.error('[verifyAndAddParty] ❌ QR CODE INSERT FAILED');
          console.error('[verifyAndAddParty] Error code:', qrError.code);
          console.error('[verifyAndAddParty] Error message:', qrError.message);
          console.error('[verifyAndAddParty] Error details:', qrError.details);
          console.error('[verifyAndAddParty] Error hint:', qrError.hint);
          console.error('[verifyAndAddParty] Full error object:', JSON.stringify(qrError, null, 2));
          
          // If foreign key constraint violation on 'code' field (error code 23503)
          if (qrError.code === '23503' && (qrError.message?.includes('code') || qrError.details?.includes('code') || qrError.message?.includes('qr_codes_code_fkey'))) {
            console.log('[verifyAndAddParty] Foreign key violation on code field, retrying without it...');
            const qrInsertDataWithoutCode = { ...qrInsertData };
            delete qrInsertDataWithoutCode.code;
            
            console.log('[verifyAndAddParty] Retrying insert without code field...');
            const { data: retryQR3, error: retryError3 } = await supabaseCli
              .from('qr_codes')
              .insert(qrInsertDataWithoutCode)
              .select('id')
              .single();
            
            if (retryQR3 && !retryError3) {
              console.log('[verifyAndAddParty] ✅✅✅ QR code stored successfully without code field:', retryQR3.id);
            } else {
              console.error('[verifyAndAddParty] ❌ Retry without code also failed');
              if (retryError3) {
                console.error('[verifyAndAddParty] Retry error:', JSON.stringify(retryError3, null, 2));
              }
            }
          }
          // If user_id is required but null, create guest user
          else if (qrError.message && (qrError.message.includes('null value in column "user_id"') || qrError.message.includes('violates not-null constraint'))) {
            console.log('[verifyAndAddParty] user_id is required, creating guest user...');
            const guestEmail = `guest-${insertedGuestName?.toLowerCase().replace(/\s+/g, '-') || 'anon'}-${codeRecord.party_id}@rumbify.guest`;
            
            let guestUserId = null;
            const { data: guestUser } = await supabaseCli
              .from('users')
              .select('id')
              .eq('email', guestEmail)
              .single();
            
            if (guestUser) {
              guestUserId = guestUser.id;
            } else {
              const { data: newGuestUser } = await supabaseCli
                .from('users')
                .insert({
                  name: insertedGuestName || 'Guest',
                  email: guestEmail,
                  is_admin: false
                })
                .select('id')
                .single();
              
              if (newGuestUser) {
                guestUserId = newGuestUser.id;
              }
            }
            
            if (guestUserId) {
              qrInsertData.user_id = guestUserId;
              const { data: retryQR, error: retryError } = await supabaseCli
                .from('qr_codes')
                .insert(qrInsertData)
                .select('id')
                .single();
              
              if (retryQR && !retryError) {
                console.log('[verifyAndAddParty] ✅ QR code stored with guest user:', retryQR.id);
              } else {
                console.error('[verifyAndAddParty] ❌ Retry with guest user also failed');
                if (retryError) {
                  console.error('[verifyAndAddParty] Retry error:', JSON.stringify(retryError, null, 2));
                }
                console.warn('[verifyAndAddParty] ⚠️ Returning QR code in response but NOT saved to database');
              }
            } else {
              console.error('[verifyAndAddParty] ❌ Could not create guest user for QR code');
              console.warn('[verifyAndAddParty] ⚠️ Returning QR code in response but NOT saved to database');
            }
          } else {
            console.error('[verifyAndAddParty] ❌ QR code insert failed for unknown reason');
            console.warn('[verifyAndAddParty] ⚠️ Returning QR code in response but NOT saved to database');
          }
        } else {
          if (insertedQR && insertedQR.id) {
            console.log('[verifyAndAddParty] ✅✅✅ QR CODE STORED SUCCESSFULLY IN DATABASE! ✅✅✅');
            console.log('[verifyAndAddParty] QR code ID:', insertedQR.id);
            console.log('[verifyAndAddParty] Full inserted record:', JSON.stringify(insertedQR, null, 2));
            // Update qrToken and qrImageUrl to ensure they're set for response
            if (!qrToken) qrToken = qrInsertData.qr_token;
            if (!qrImageUrl) qrImageUrl = qrInsertData.qr_image;
          } else {
            console.error('[verifyAndAddParty] ⚠️⚠️⚠️ Insert returned no error but also no data! ⚠️⚠️⚠️');
            console.error('[verifyAndAddParty] insertedQR value:', insertedQR);
            console.error('[verifyAndAddParty] This is a CRITICAL issue - QR code was NOT saved!');
            // Even if insert failed silently, we still have the QR data to return
            if (!qrToken) qrToken = qrInsertData.qr_token;
            if (!qrImageUrl) qrImageUrl = qrInsertData.qr_image;
          }
        }
      }
    } catch (qrGenError) {
      console.error('[verifyAndAddParty] ❌❌❌ EXCEPTION in QR code generation ❌❌❌');
      console.error('[verifyAndAddParty] Exception type:', qrGenError.constructor.name);
      console.error('[verifyAndAddParty] Exception message:', qrGenError.message);
      console.error('[verifyAndAddParty] Exception stack:', qrGenError.stack);
      console.error('[verifyAndAddParty] Full exception:', JSON.stringify(qrGenError, Object.getOwnPropertyNames(qrGenError), 2));
      
      // Even if there's an exception, log what we have
      console.error('[verifyAndAddParty] qrToken at exception:', qrToken);
      console.error('[verifyAndAddParty] qrImageUrl at exception:', qrImageUrl ? 'EXISTS' : 'MISSING');
    }
    
    // Final status log
    console.log('[verifyAndAddParty] ===== QR CODE GENERATION FINAL STATUS =====');
    console.log('[verifyAndAddParty] qrToken:', qrToken ? 'GENERATED' : 'MISSING');
    console.log('[verifyAndAddParty] qrImageUrl:', qrImageUrl ? 'GENERATED' : 'MISSING');
    if (qrToken && qrImageUrl) {
      console.log('[verifyAndAddParty] ✅ QR code generated and will be returned in response');
    } else {
      console.error('[verifyAndAddParty] ❌ NO QR CODE DATA - generation failed completely');
    }

    return res.json({
      success: true,
      message: "Party added to your history successfully!",
      party: {
        id: codeRecord.party_id,
        title: party.title,
        location: party.location,
        date: party.date,
        administrator: party.administrator,
        image: party.image,
        tags: party.tags,
        category: party.category,
        price_name: price.price_name,
        price: price.price
      },
      qr_code: qrToken && qrImageUrl ? {
        token: qrToken,
        image_url: qrImageUrl
      } : null
    });

  } catch (error) {
    console.error('============================================');
    console.error('[verifyAndAddParty] ❌❌❌ EXCEPTION CAUGHT IN MAIN CATCH ❌❌❌');
    console.error('[verifyAndAddParty] Error type:', error?.constructor?.name);
    console.error('[verifyAndAddParty] Error message:', error?.message);
    console.error('[verifyAndAddParty] Error stack:', error?.stack);
    console.error('[verifyAndAddParty] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('============================================');
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get QR code for a specific user and party
 */
const getQRCode = async (req, res) => {
  try {
    const { userId, partyId } = req.params;
    
    console.log('[getQRCode] Request received - userId:', userId, 'partyId:', partyId);
    
    if (!userId || !partyId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Party ID are required"
      });
    }
    
    // Try to find QR code by user_id and party_id first
    let { data: qrCode, error } = await supabaseCli
      .from('qr_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('party_id', partyId)
      .single();
    
    // If not found and user_id might be null (guest), try without user_id filter
    if (error && error.code === 'PGRST116') {
      console.log('[getQRCode] QR code not found with user_id, trying without user_id filter...');
      const { data: qrCodeGuest, error: errorGuest } = await supabaseCli
        .from('qr_codes')
        .select('*')
        .eq('party_id', partyId)
        .is('user_id', null)
        .single();
      
      if (qrCodeGuest && !errorGuest) {
        qrCode = qrCodeGuest;
        error = null;
        console.log('[getQRCode] Found QR code for guest');
      } else {
        console.log('[getQRCode] QR code not found for guest either');
      }
    }
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[getQRCode] QR code not found in database');
        return res.status(404).json({
          success: false,
          message: "QR code not found"
        });
      }
      console.error('[getQRCode] Error fetching QR code:', error);
      return res.status(500).json({
        success: false,
        message: "Error fetching QR code"
      });
    }
    
    console.log('[getQRCode] QR code found:', qrCode.id);
    
    res.json({
      success: true,
      qr_code: {
        id: qrCode.id,
        qr_token: qrCode.qr_token,
        qr_image: qrCode.qr_image,
        status: qrCode.status,
        used_at: qrCode.used_at,
        valid_until: qrCode.valid_until,
        created_at: qrCode.created_at
      }
    });
  } catch (error) {
    console.error('Error in getQRCode:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Scan/validate a QR code
 */
const scanQRCode = async (req, res) => {
  try {
    const { qr_code_data } = req.body;
    
    if (!qr_code_data) {
      return res.status(400).json({
        success: false,
        message: "QR code data is required"
      });
    }
    
    const { data: qrCode, error: fetchError } = await supabaseCli
      .from('qr_codes')
      .select('*, users(name), parties(title)')
      .eq('qr_token', qr_code_data)
      .single();
    
    if (fetchError || !qrCode) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR code"
      });
    }
    
    if (qrCode.status === 'used') {
      return res.status(400).json({
        success: false,
        message: "QR code has already been scanned"
      });
    }
    
    const { data: updatedQR, error: updateError } = await supabaseCli
      .from('qr_codes')
      .update({
        status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('qr_token', qr_code_data)
      .eq('status', 'not used')
      .select('*, users(name), parties(title)')
      .single();
    
    if (updateError || !updatedQR) {
      return res.status(500).json({
        success: false,
        message: "Error scanning QR code"
      });
    }
    
    res.json({
      success: true,
      message: "QR code scanned successfully",
      qr_code: updatedQR
    });
  } catch (error) {
    console.error('Error in scanQRCode:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Diagnostic endpoint to check qr_codes table structure
 */
const diagnoseQRCodes = async (req, res) => {
  try {
    // Check which columns exist by trying to select them
    const requiredColumns = ['qr_code_data', 'qr_code_image', 'user_id', 'party_id', 'code_id', 'is_scanned', 'scanned_at'];
    const columnStatus = {};
    
    for (const col of requiredColumns) {
      try {
        const { error } = await supabaseCli
          .from('qr_codes')
          .select(col)
          .limit(0);
        columnStatus[col] = { exists: !error, error: error?.message };
      } catch (e) {
        columnStatus[col] = { exists: false, error: e.message };
      }
    }
    
    // Try to insert a test record with minimal required fields
    const testData = {
      qr_code_data: `TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      qr_code_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      party_id: 1,
      is_scanned: false
    };
    
    // Only add code_id if the column exists
    if (columnStatus.code_id?.exists) {
      testData.code_id = null;
    }
    
    const { data: testInsert, error: testError } = await supabaseCli
      .from('qr_codes')
      .insert(testData)
      .select('id')
      .single();
    
    let canInsert = false;
    if (testInsert) {
      canInsert = true;
      // Clean up test record
      await supabaseCli.from('qr_codes').delete().eq('id', testInsert.id);
    }
    
    const missingColumns = Object.entries(columnStatus)
      .filter(([_, status]) => !status.exists)
      .map(([col, _]) => col);
    
    return res.json({
      success: canInsert,
      message: canInsert 
        ? "Table structure is correct" 
        : "Table structure issues detected",
      columns: columnStatus,
      missing_columns: missingColumns,
      can_insert: canInsert,
      insert_error: testError?.message,
      recommendation: missingColumns.length > 0
        ? `Run the fix script: Rumbify/database/fix_qr_codes_table.sql to add missing columns: ${missingColumns.join(', ')}`
        : testError?.message?.includes('user_id')
          ? "Run: ALTER TABLE public.qr_codes ALTER COLUMN user_id DROP NOT NULL;"
          : "Table structure looks correct"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Diagnostic failed",
      error: error.message
    });
  }
};

module.exports = {
  testConnection,
  generateCodes,
  getPartyCodes,
  validateCode,
  useCode,
  verifyAndAddParty,
  getQRCode,
  scanQRCode,
  diagnoseQRCodes
};
