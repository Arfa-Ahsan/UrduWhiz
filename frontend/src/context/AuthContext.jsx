import React, { createContext, useContext, useState, useEffect } from 'react';
import authAxios from '../api/authAxios';

const AuthContext = createContext();

// Separate the hook into its own function for better HMR compatibility
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData, token) => {
    if (userData?.is_verified) {
      setUser(userData);
      localStorage.setItem('accessToken', token);
    } else {
      alert("Please verify your email before logging in.");
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    try {
      await authAxios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const is_verified = user?.is_verified || false;

  // Keep user logged in after refresh and extract token from URL
  useEffect(() => {
    //console.log('AuthContext: Initializing authentication...');
    const initializeAuth = async () => {
      try {
        // Extract access_token from URL if present
        const params = new URLSearchParams(window.location.search);
        const token = params.get("access_token");
        if (token) {
          localStorage.setItem("accessToken", token);
          // Remove token from URL for cleanliness
          params.delete("access_token");
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
          window.history.replaceState({}, '', newUrl);
        }
        
        const accessToken = localStorage.getItem("accessToken");
        
        if (accessToken) {
          const response = await authAxios.get("/auth/me");
          setUser(response.data);
        } else {
        }
      } catch (error) {
        console.error('AuthContext: Authentication failed:', error);
        // Only logout if it's a 401 error (invalid token)
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          setUser(null);
        } else {
          // For network errors, don't logout - keep the user logged in
          // The token might still be valid
         // console.log('AuthContext: Network error, keeping user logged in...');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    is_verified,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook separately
export { useAuth };