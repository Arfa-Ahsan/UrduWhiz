import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const GoogleRedirectHandler = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = params.get("access_token");
    if (!accessToken) {
      navigate("/login");
      return;
    }

    // Save token and set login flag
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("justLoggedIn", "true");

    // Redirect to chat, AuthContext will handle fetching user info
    navigate("/chat");
  }, [params, navigate]);

  return <p>Logging in with Google...</p>;
};

export default GoogleRedirectHandler; 