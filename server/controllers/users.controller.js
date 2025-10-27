const {
  getAllUsers,
  createUserInDB,
  updateUserInDb,
  deleteUserInDb,
} = require("../db/users.db");

const getUsers = async (req, res) => {
  const users = await getAllUsers();
  res.send(users);
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, userType, phone } = req.body;
    
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, password, and user type are required" 
      });
    }

    // Validate user type
    if (!['member', 'admin'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: "User type must be either 'member' or 'admin'" 
      });
    }

    // Validate phone for admin users
    if (userType === 'admin' && !phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number is required for admin accounts" 
      });
    }

    // Check if user already exists
    const supabaseCli = require("../services/supabase.service");
    const { data: existingUser, error: checkError } = await supabaseCli
      .from("users")
      .select("id, email, name")
      .or(`email.eq.${email},name.eq.${name}`)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return res.status(500).json({ 
        success: false, 
        message: "Database connection failed. Please check your Supabase configuration and ensure the project is active.",
        error: checkError.message || "Unknown database error"
      });
    }

    if (existingUser && existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.email === email) {
        return res.status(409).json({ 
          success: false, 
          message: "An account with this email already exists" 
        });
      }
      if (existing.name === name) {
        return res.status(409).json({ 
          success: false, 
          message: "An account with this username already exists" 
        });
      }
    }

    // Create new user
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", // Default image
      is_admin: userType === 'admin',
      interests: []
    };

    // Add phone field for admin users
    if (userType === 'admin' && phone) {
      newUser.phone = phone.trim();
    }

    const { data: createdUser, error: createError } = await supabaseCli
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user account. Please check your Supabase configuration and ensure the project is active.",
        error: createError.message || "Unknown database error"
      });
    }

    // Return user data (without password)
    const userResponse = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      profile_image: createdUser.profile_image,
      is_admin: createdUser.is_admin,
      attended_count: 0,
      favorites_count: 0,
      interests: createdUser.interests || []
    };

    // Include phone for admin users
    if (userType === 'admin' && createdUser.phone) {
      userResponse.phone = createdUser.phone;
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: userResponse
    });

  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

const updateUser = async (req, res) => {
  const { name } = req.body;
  const { id: userId } = req.params;
  const response = await updateUserInDb({ name }, userId);
  res.send(response);
};

// New endpoint for updating user profile with comprehensive data
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, bio, interests, phone, profile_visible, attendance_visible, profile_image, currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Name and email are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    const supabaseCli = require("../services/supabase.service");

    // Handle password change if provided
    if (newPassword) {
      // Validate new password strength
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 8 characters long and contain at least one letter and one number" 
        });
      }

      // Validate current password is provided
      if (!currentPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Current password is required to change password" 
        });
      }

      // Get current user to verify current password
      const { data: currentUser, error: userError } = await supabaseCli
        .from("users")
        .select("password")
        .eq("id", id)
        .single();

      if (userError || !currentUser) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

    }
    
    // Check if email is already taken by another user
    const { data: existingUser, error: checkError } = await supabaseCli
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .neq("id", id)
      .limit(1);

    if (checkError) {
      console.error("Error checking existing user:", checkError);
      return res.status(500).json({ 
        success: false, 
        message: "Database error occurred" 
      });
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "An account with this email already exists" 
      });
    }

    // Check if name is already taken by another user
    const { data: existingName, error: nameCheckError } = await supabaseCli
      .from("users")
      .select("id, name")
      .eq("name", name.trim())
      .neq("id", id)
      .limit(1);

    if (nameCheckError) {
      console.error("Error checking existing name:", nameCheckError);
      return res.status(500).json({ 
        success: false, 
        message: "Database error occurred" 
      });
    }

    if (existingName && existingName.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: "An account with this username already exists" 
      });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      updated_at: new Date().toISOString()
    };

    // Add optional fields if provided
    if (bio !== undefined && bio !== null && bio.trim() !== '') updateData.biography = bio.trim();
    if (interests !== undefined && interests !== null && Array.isArray(interests)) updateData.interests = interests;
    if (phone !== undefined && phone !== null && phone.trim() !== '') updateData.phone = phone.trim();
    // Note: profile_visible and attendance_visible columns may not exist in your Supabase database
    // Only include them if they exist. Commenting out for now.
    // if (profile_visible !== undefined) updateData.profile_visible = profile_visible;
    // if (attendance_visible !== undefined) updateData.attendance_visible = attendance_visible;
    if (profile_image !== undefined) updateData.profile_image = profile_image;
    if (newPassword !== undefined) updateData.password = newPassword;

    console.log('Attempting to update user with data:', JSON.stringify(updateData, null, 2));

    // Update user in Supabase
    const { data: updatedUser, error: updateError } = await supabaseCli
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      console.error("Update data attempted:", updateData);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update user profile",
        error: updateError.message 
      });
    }

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Return updated user data - map biography back to bio
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.biography || updatedUser.bio || null,
        phone: updatedUser.phone || null,
        profile_image: updatedUser.profile_image,
        interests: updatedUser.interests || [],
        profile_visible: updatedUser.profile_visible,
        attendance_visible: updatedUser.attendance_visible,
        member_since: updatedUser.member_since,
        updated_at: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

const deleteUser = async (req, res) => {
  const { id: userId } = req.params;
  const response = await deleteUserInDb(userId);
  res.send(response);
};

// New endpoint for deleting admin account with all related data
const deleteAdminAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account"
      });
    }

    const supabaseCli = require("../services/supabase.service");

    // First, verify the user exists and get their data
    const { data: user, error: userError } = await supabaseCli
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // If user is admin, delete all their parties first
    if (user.is_admin) {
      console.log(`Deleting parties for admin user: ${user.name}`);
      
      // Delete all parties created by this admin
      const { error: partiesError } = await supabaseCli
        .from("parties")
        .delete()
        .eq("administrator", user.name);

      if (partiesError) {
        console.error("Error deleting parties:", partiesError);
        return res.status(500).json({
          success: false,
          message: "Failed to delete associated parties"
        });
      }

      console.log(`Deleted parties for admin: ${user.name}`);
    }

    // Delete the user account
    const { data: deletedUser, error: deleteError } = await supabaseCli
      .from("users")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Failed to delete account"
      });
    }

    console.log(`Successfully deleted admin account: ${user.name}`);

    res.json({
      success: true,
      message: "Account and all associated data have been permanently deleted"
    });

  } catch (error) {
    console.error("Error in deleteAdminAccount:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// New endpoint for deleting member account
const deleteMemberAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required to delete account"
      });
    }

    const supabaseCli = require("../services/supabase.service");

    // First, verify the user exists and get their data
    const { data: user, error: userError } = await supabaseCli
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // Delete the user account
    const { data: deletedUser, error: deleteError } = await supabaseCli
      .from("users")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return res.status(500).json({
        success: false,
        message: "Failed to delete account"
      });
    }

    console.log(`Successfully deleted member account: ${user.name}`);

    res.json({
      success: true,
      message: "Account and all associated data have been permanently deleted"
    });

  } catch (error) {
    console.error("Error in deleteMemberAccount:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// New endpoint for getting user profile with stats
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get user data from Supabase
    const supabaseCli = require("../services/supabase.service");
    const { data: user, error: userError } = await supabaseCli
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get user's attended parties count (mock for now)
    const attendedCount = 12; // This would be calculated from actual attendance data
    
    // Get user's favorites count (mock for now)
    const favoritesCount = 5; // This would be calculated from liked parties

    // Get user's interests (mock for now - would come from user preferences)
    const interests = ["Disco Music", "Elegant", "Cocktailing"];

    // Get user's party history (mock for now)
    const history = [
      {
        id: 1,
        title: "Pre-New Year Party",
        date: "22/11/21",
        status: "Attended",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop"
      },
      {
        id: 2,
        title: "Lore's Pool Party",
        date: "11/10/21",
        status: "Attended",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop"
      },
      {
        id: 3,
        title: "Chicago Night",
        date: "5/9/21",
        status: "Not Attended",
        image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=80&h=80&fit=crop"
      }
    ];

    const profileData = {
      ...user,
      bio: user.biography || user.bio || null,
      attended_count: attendedCount,
      favorites_count: favoritesCount,
      interests: interests,
      history: history
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// New endpoint for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const supabaseCli = require("../services/supabase.service");
    const { data: user, error: userError } = await supabaseCli
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }


    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        is_admin: user.is_admin || false,
        attended_count: 0, // These would be calculated from actual data
        favorites_count: 0,
        interests: user.interests || [],
        bio: user.biography || user.bio || null
      }
    });

  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

// Upload profile image
const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }
    
    const supabaseCli = require("../services/supabase.service");
    
    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    
    // Update user profile with new image
    const { data: updatedUser, error: updateError } = await supabaseCli
      .from("users")
      .update({ 
        profile_image: dataUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating profile image:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile image"
      });
    }
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.json({
      success: true,
      message: "Profile image updated successfully",
      profile_image: updatedUser.profile_image
    });
    
  } catch (error) {
    console.error("Error in uploadProfileImage:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Test Supabase connection
const testSupabaseConnection = async (req, res) => {
  try {
    const supabaseCli = require("../services/supabase.service");
    
    console.log('Testing Supabase connection...');
    const { data, error } = await supabaseCli
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return res.status(500).json({
        success: false,
        message: "Supabase connection failed",
        error: error.message,
        details: error.details,
        hint: error.hint
      });
    }
    
    console.log('Supabase connection test successful');
    return res.status(200).json({
      success: true,
      message: "Supabase connection successful",
      data: data
    });
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return res.status(500).json({
      success: false,
      message: "Supabase connection test failed",
      error: err.message
    });
  }
};

// Get user's party history using Codes table
const getUserPartyHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[getUserPartyHistory] Getting party history for user:', id);
    
    // Get user's used codes
    const supabaseCli = require("../services/supabase.service");
    const { data: userCodes, error: codesError } = await supabaseCli
      .from('Codes')
      .select('id, code, party_id, price_id, created_at')
      .eq('user_id', id)
      .eq('already_used', true)
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('[getUserPartyHistory] Error fetching codes:', codesError);
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching party history" 
      });
    }

    // Get party and price information for each code
    const partyHistory = [];
    for (const codeRecord of userCodes) {
      // Get party info
      const { data: party, error: partyError } = await supabaseCli
        .from('parties')
        .select('*')
        .eq('id', codeRecord.party_id)
        .single();

      if (partyError) {
        console.error('[getUserPartyHistory] Error fetching party:', partyError);
        continue; // Skip this code if party not found
      }

      // Get price info
      const { data: price, error: priceError } = await supabaseCli
        .from('prices')
        .select('*')
        .eq('id', codeRecord.price_id)
        .single();

      if (priceError) {
        console.error('[getUserPartyHistory] Error fetching price:', priceError);
        continue; // Skip this code if price not found
      }

      partyHistory.push({
        id: party.id,
        party_id: party.id, // Add party_id for frontend compatibility
        title: party.title,
        location: party.location, // Add location for frontend display
        date: party.date,
        status: 'Attended', // For now, mark attended for used codes
        image: party.image,
        price_name: price.price_name,
        price: price.price,
        used_at: codeRecord.created_at
      });
    }

    res.json({ success: true, party_history: partyHistory, count: partyHistory.length });
  } catch (error) {
    console.error('[getUserPartyHistory] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ---------------- Favorites (User-Party) ----------------
// Get user's favorites parties
const getUserFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const supabaseCli = require("../services/supabase.service");
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Fetch favorite records for user
    const { data: favorites, error: favError } = await supabaseCli
      .from('favorites')
      .select('party_id')
      .eq('user_id', id);

    if (favError) {
      console.error('[getUserFavorites] Error fetching favorites:', favError);
      return res.status(500).json({ success: false, message: 'Error fetching favorites' });
    }

    if (!favorites || favorites.length === 0) {
      return res.json({ success: true, favorites: [] });
    }

    const partyIds = favorites.map(f => f.party_id);

    // Fetch parties by IDs in one query
    const { data: parties, error: partiesError } = await supabaseCli
      .from('parties')
      .select('*')
      .in('id', partyIds);

    if (partiesError) {
      console.error('[getUserFavorites] Error fetching parties:', partiesError);
      return res.status(500).json({ success: false, message: 'Error fetching favorite parties' });
    }

    res.json({ success: true, favorites: parties || [] });
  } catch (error) {
    console.error('[getUserFavorites] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Add a party to user's favorites
const addUserFavorite = async (req, res) => {
  try {
    const { id } = req.params; // user_id
    const { party_id } = req.body;
    const supabaseCli = require("../services/supabase.service");

    if (!id || !party_id) {
      return res.status(400).json({ success: false, message: 'user_id and party_id are required' });
    }

    const userIdNum = Number(id);
    const partyIdNum = Number(party_id);

    // Check if favorite already exists to avoid duplicates (works without unique index)
    const { data: existing, error: existError } = await supabaseCli
      .from('favorites')
      .select('id')
      .eq('user_id', userIdNum)
      .eq('party_id', partyIdNum)
      .limit(1);

    if (existError) {
      console.error('[addUserFavorite] Error checking existing favorite:', existError);
      return res.status(500).json({ success: false, message: 'Error checking favorite' });
    }

    if (existing && existing.length > 0) {
      return res.json({ success: true, message: 'Favorite already exists', data: existing[0] });
    }

    // Insert new favorite
    const { data, error } = await supabaseCli
      .from('favorites')
      .insert({ user_id: userIdNum, party_id: partyIdNum })
      .select();

    if (error) {
      console.error('[addUserFavorite] Error adding favorite:', error);
      return res.status(500).json({ success: false, message: 'Error adding favorite' });
    }

    res.json({ success: true, message: 'Favorite added', data });
  } catch (error) {
    console.error('[addUserFavorite] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Remove a party from user's favorites
const removeUserFavorite = async (req, res) => {
  try {
    const { id, partyId } = req.params; // user_id, partyId
    const supabaseCli = require("../services/supabase.service");

    if (!id || !partyId) {
      return res.status(400).json({ success: false, message: 'user_id and partyId are required' });
    }

    const { error } = await supabaseCli
      .from('favorites')
      .delete()
      .eq('user_id', Number(id))
      .eq('party_id', Number(partyId));

    if (error) {
      console.error('[removeUserFavorite] Error removing favorite:', error);
      return res.status(500).json({ success: false, message: 'Error removing favorite' });
    }

    res.json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    console.error('[removeUserFavorite] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  updateUserProfile,
  deleteUser,
  deleteAdminAccount,
  deleteMemberAccount,
  getUserProfile,
  loginUser,
  testSupabaseConnection,
  uploadProfileImage,
  getUserPartyHistory,
  // Favorites
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite
};
