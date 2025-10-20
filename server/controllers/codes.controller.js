const { supabaseCli } = require('../db/users.db');

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
      .from('codes')
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
 * Generate unique entry codes for a party
 */
const generateCodes = async (req, res) => {
  try {
    console.log('[generateCodes] Starting code generation...');
    console.log('[generateCodes] Supabase client available:', !!supabaseCli);
    
    const { party_id, price_id, price_name, quantity } = req.body;
    
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

    // First, get all existing codes from the database to ensure uniqueness
    console.log('[generateCodes] Checking existing codes in database...');
    let codesTableMissing = false;
    let existingCodeSet = new Set();
    const { data: existingCodes, error: fetchError } = await supabaseCli
      .from('codes')
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
        code: code,
        price_id: resolvedPriceId,
        already_used: false,
        user_id: null // Will be set when code is used
      }));

      const { data: insertedCodes, error } = await supabaseCli
        .from('codes')
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
        codes: codes,
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
      .from('codes')
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
      .from('codes')
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
      .from('codes')
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

module.exports = {
  testConnection,
  generateCodes,
  getPartyCodes,
  validateCode,
  useCode
};
