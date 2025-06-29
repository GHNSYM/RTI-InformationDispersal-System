exports.register=async (req, res) => {
  try {
    console.log(req);
    const { name, email, phone, password, address } = req.body;

    // Validate input
    if (!name || !email || !phone || !password ||!address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate phone format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or phone already exists" });
    }

    // Create new user with default role as CITIZEN
    const user = await User.create({
      name,
      email,
      phone,
      address,
      password,
      role: "1",
    });

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department_code: user.department_code ? user.department_code : null,
        address: user.address
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login route
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ where: { email }, raw: false });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Use the model's checkPassword method
    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    console.log('Login attempt:', {
      providedPassword: password,
      storedHash: user.password
    });

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department_code: user.department_code,
        address: user.address,
        district_code: user.district_code,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Logout route
exports.logout= async (req, res) => {
  try {
    // Add token to blacklist
    blacklistToken(req.token);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refresh token route
exports.refresh_token=async (req, res) => {
  try {
    // Generate new token
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

// Get current user route
exports.validate= async (req, res) => {
  try {
    // Since auth middleware already verified the token,
    // we just need to return the user data
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ 
        valid: false,
        error: "User not found" 
      });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department_code: user.department_code,
        district_code: user.district_code,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      valid: false,
      error: "Token validation failed",
      details: error.message 
    });
  }
};

