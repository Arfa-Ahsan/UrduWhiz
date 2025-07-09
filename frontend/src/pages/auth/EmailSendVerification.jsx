import React, { useState } from "react";
import axiosInstance from "../../api/axios";// Adjust the path as needed
import logo from "../../assets/file.svg";

const SendVerificationEmail = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/send-verification", { email });

      setStatus({
        type: "success",
        message: response.data.message || "Verification email sent! Please check your inbox.",
      });
      setEmail("");
    } catch (error) {
      console.error("Send verification error:", error);
      setStatus({
        type: "error",
        message: error.response?.data?.detail || "Failed to send verification email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow ">
        <div className="flex items-center justify-center mb-6 text-2xl font-semibold text-gray-900 ">
          <img className="w-16 h-16 mr-2" src={logo} alt="UrduWhiz Logo" />
          UrduWhiz
        </div>
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 ">
          Send Verification Email
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email address to receive a new verification link.
        </p>

        <form onSubmit={handleSendVerification} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 "
            />
          </div>

                        <button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-300 font-medium rounded-lg text-sm px-5 py-2.5 transition-all duration-300"
              >
                {loading ? "Sending..." : "Send Verification Email"}
              </button>

          {status && (
            <p
              className={`text-sm font-medium mt-2 ${
                status.type === "success" ? "text-green-600 " : "text-red-600 "
              }`}
            >
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default SendVerificationEmail;