import React, { useState } from "react";
import AxiosInstance from "../../api/authAxios"; // Adjust the import path if needed
import logo from "../../assets/file.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await AxiosInstance.post("/auth/forgot-password", { email });

      setStatus({
        type: "success",
        message: response.data.message || "Reset email sent! Please check your inbox.",
      });
      setEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);
      setStatus({
        type: "error",
        message: error.response?.data?.detail || "Failed to send reset email.",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="bg-gray-50 ">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
          <img className="w-16 h-16 mr-2" src={logo} alt="UrduWhiz Logo" />
          UrduWhiz
        </a>
        <div className="w-full bg-white rounded-lg shadow  sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl ">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500  text-center">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form className="space-y-4 md:space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:outline-none focus:ring-navy-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              {status && (
                <p
                  className={`text-sm font-medium ${
                    status.type === "success" ? "text-green-600 " : "text-red-600 "
                  }`}
                >
                  {status.message}
                </p>
              )}

              <p className="text-sm font-light text-gray-500 text-center">
                Remember your password?{" "}
                <a href="/login" className="font-medium text-blue-600 hover:underline">
                  Back to Login
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
