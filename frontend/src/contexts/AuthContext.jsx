import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../middleware/axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        // Set the authorization header first
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        
        try {
          const response = await axiosInstance.get("/api/auth/validate");
          if (response.data.valid) {
            setToken(storedToken);
            setUser(response.data.user);
            console.log("Auth initialized with user:", response.data.user); // Debug log
          } else {
            console.log("Token validation failed:", response.data.error);
            logout();
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          logout();
        }
      } else {
        // If no stored token/user, ensure we're logged out
        logout();
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    console.log("Login called with user data:", userData); // Debug log
    
    // Store data first
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Set state
    setToken(newToken);
    setUser(userData);
    
    // Set authorization header
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    // Navigate based on role
    switch (userData.role) {
      case "1":
        navigate("/citizen");
        break;
      case "2":
        navigate("/department");
        break;
      case "3":
        navigate("/admin");
        break;
      case "4":
        navigate("/spio-assistant");
        break;
      case "5":
        navigate("/state-admin");
        break;
      default:
        navigate("/");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axiosInstance.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
