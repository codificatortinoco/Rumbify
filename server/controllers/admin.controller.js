const {
  getAllUsers,
  createUserInDB,
  updateUserInDb,
  deleteUserInDb,
} = require("../db/users.db");

// Mock admin data - En un proyecto real esto vendría de una base de datos
const adminUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@rumbify.com",
    password: "admin123", // En producción esto debería estar hasheado
    phone: "1234567890",
    role: "admin",
    createdAt: new Date().toISOString()
  }
];

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar el administrador por email
    const admin = adminUsers.find(user => user.email === email);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Verificar contraseña (en producción usar bcrypt)
    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // En producción, aquí generarías un JWT token
    const response = {
      success: true,
      message: "Login successful",
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const adminRegister = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Verificar si el email ya existe
    const existingAdmin = adminUsers.find(user => user.email === email);
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    // Crear nuevo administrador
    const newAdmin = {
      id: adminUsers.length + 1,
      name,
      email,
      password, // En producción esto debería estar hasheado
      phone,
      role: "admin",
      createdAt: new Date().toISOString()
    };
    
    adminUsers.push(newAdmin);
    
    // En producción, aquí generarías un JWT token
    const response = {
      success: true,
      message: "Admin account created successfully",
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        role: newAdmin.role
      }
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = adminUsers.find(user => user.id === parseInt(adminId));
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    
    const response = {
      success: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        createdAt: admin.createdAt
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  adminLogin,
  adminRegister,
  getAdminProfile,
};
