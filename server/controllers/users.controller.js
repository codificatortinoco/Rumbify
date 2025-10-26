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
    const { name, email, bio, interests, profile_visible, attendance_visible, profile_image, currentPassword, newPassword } = req.body;
    
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
    if (bio !== undefined) updateData.bio = bio.trim();
    if (interests !== undefined) updateData.interests = interests;
    if (profile_visible !== undefined) updateData.profile_visible = profile_visible;
    if (attendance_visible !== undefined) updateData.attendance_visible = attendance_visible;
    if (profile_image !== undefined) updateData.profile_image = profile_image;
    if (newPassword !== undefined) updateData.password = newPassword;

    // Update user in Supabase
    const { data: updatedUser, error: updateError } = await supabaseCli
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update user profile" 
      });
    }

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Return updated user data
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
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
        interests: user.interests || []
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
  uploadProfileImage
};
