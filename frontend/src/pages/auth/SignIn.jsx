import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import logoSvg from "../../assets/file.svg";


const LoginForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // 👈 new state for error message
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // clear previous error

    const formData = new URLSearchParams();
    formData.append("username", identifier);
    formData.append("password", password);

    try {
      const response = await axiosInstance.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = response.data.access_token;
      localStorage.setItem("accessToken", accessToken);

      const meResponse = await axiosInstance.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const user = meResponse.data;

      if (user.is_verified) {
        login(user, accessToken);
        navigate("/chat");
      } else {
        setError("Please verify your email before logging in.");
      }
    } catch (err) {
      const message =
        err.response?.data?.detail?.toLowerCase().includes("credentials") ?
        "Invalid Credentials" :
        err.response?.data?.detail || "Login failed. Please try again.";
      setError(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      window.location.href = "http://localhost:8000/auth/login/google";
    } catch (err) {
      console.error(err);
      setError("Google login failed. Please try again.");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <section className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
          <img className="w-16 h-16 mr-2" src={logoSvg} alt="UrduWhiz Logo" />
          UrduWhiz
        </a>
        <div className="w-full bg-white rounded-lg shadow sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl">
              Login to your account
            </h1>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-center"
            >
              <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5 mr-2" alt="Google" />
              Sign in with Google
            </button>

            <div className="flex items-center my-2">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-sm text-gray-500">OR</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* 👉 Show error message if present */}
            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="identifier" className="block mb-2 text-sm font-medium text-gray-900">
                  Your email or username
                </label>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                />
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                />
              </div>

              <div className="text-left">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full text-white bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:outline-none focus:ring-navy-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300"
              >
                Login
              </button>

              <p className="text-sm font-light text-gray-500">
                Don't have an account?{" "}
                <a href="/register" className="font-medium text-blue-600 hover:underline">
                  Sign up here
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginForm;