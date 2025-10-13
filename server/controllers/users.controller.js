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
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Name, email, and password are required" 
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
        message: "Database error occurred" 
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
      profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", // Default image
      member_since: new Date().toISOString()
    };

    const { data: createdUser, error: createError } = await supabaseCli
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user account" 
      });
    }

    // Return user data (without password)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        profile_image: createdUser.profile_image,
        attended_count: 0,
        favorites_count: 0,
        interests: []
      }
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

const deleteUser = async (req, res) => {
  const { id: userId } = req.params;
  const response = await deleteUserInDb(userId);
  res.send(response);
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

    // TODO: In production, you would hash and compare passwords here
    // For now, we'll just return the user data
    // In a real app, you'd use bcrypt or similar to hash passwords

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        attended_count: 0, // These would be calculated from actual data
        favorites_count: 0,
        interests: []
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

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserProfile,
  loginUser
};
