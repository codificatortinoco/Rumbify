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
    
    console.log('[verifyAndAddParty] Starting verification process...');
    console.log('[verifyAndAddParty] Code:', code);
    console.log('[verifyAndAddParty] User ID:', user_id);
    
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

    console.log('[verifyAndAddParty] Successfully added party to user history');

    // Create QR record for this verified access
    let qrRecord = null;
    try {
      const qrToken = cryptoNode.randomBytes(16).toString('hex');
      const validUntilTs = (() => {
        // Try to parse party.date if it's ISO or a recognizable format; else leave null
        if (party?.date) {
          const parsed = new Date(party.date);
          if (!isNaN(parsed.getTime())) return parsed.toISOString();
        }
        return null;
      })();

      // First try: insert including code_id (FK to Codes.id) if schema supports it
      let insertPayload = {
        party_id: party.id,
        user_id: userObj?.id || null,
        code: codeRecord.code,
        qr_token: qrToken,
        status: 'active',
        valid_until: validUntilTs,
        code_id: codeRecord?.id || null
      };

      let { data: insertedQr, error: qrErr } = await supabaseCli
        .from('qr_codes')
        .insert(insertPayload)
        .select('*')
        .single();

      // Fallback: if code_id column doesn't exist or violates schema, try without it
      const isMissingColumn = (err) => !!err && (
        String(err?.message || '').toLowerCase().includes('column') &&
        String(err?.message || '').toLowerCase().includes('does not exist')
      );
      const isFkIssue = (err) => !!err && (
        String(err?.message || '').toLowerCase().includes('foreign key') ||
        String(err?.message || '').toLowerCase().includes('constraint')
      );

      if (qrErr && (isMissingColumn(qrErr) || isFkIssue(qrErr))) {
        const { data: insertedQr2, error: qrErr2 } = await supabaseCli
          .from('qr_codes')
          .insert({
            party_id: party.id,
            user_id: userObj?.id || null,
            code: codeRecord.code,
            qr_token: qrToken,
            status: 'active',
            valid_until: validUntilTs
          })
          .select('*')
          .single();
        if (!qrErr2) {
          insertedQr = insertedQr2;
          qrErr = null;
        }
      }

      if (qrErr) {
        console.warn('[verifyAndAddParty] Warning: failed to create QR record:', qrErr?.message);
      } else {
        qrRecord = insertedQr;
      }
    } catch (qe) {
      console.warn('[verifyAndAddParty] Warning: unexpected error creating QR record:', qe?.message);
    }

    // Insert pending guest entry for this party (to show in guests-summary)
    try {
      const guestName = userObj?.name || 'Guest';
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
      }
    } catch (ge) {
      console.warn('[verifyAndAddParty] Warning: unexpected error inserting pending guest:', ge?.message);
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
      qr: qrRecord ? {
        token: qrRecord.qr_token,
        status: qrRecord.status,
        valid_until: qrRecord.valid_until
      } : null
    });

  } catch (error) {
    console.error('Error in verifyAndAddParty:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
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
  // Fetch latest active QR for a given party and user
  getActiveQrForParty: async (req, res) => {
    try {
      const { partyId } = req.params;
      const userId = (req.query.user_id || req.body?.user_id || '').toString();

      if (!partyId || !userId) {
        return res.status(400).json({ success: false, message: 'partyId and user_id are required' });
      }

      const { data: qrRows, error } = await supabaseCli
        .from('qr_codes')
        .select('*')
        .eq('party_id', parseInt(partyId, 10))
        .eq('user_id', parseInt(userId, 10))
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        return res.status(500).json({ success: false, message: 'Error fetching QR', error: error.message });
      }

      const qr = (qrRows && qrRows[0]) || null;
      if (!qr) {
        return res.json({ success: true, qr: null });
      }

      return res.json({
        success: true,
        qr: {
          token: qr.qr_token,
          status: qr.status,
          valid_until: qr.valid_until
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};
