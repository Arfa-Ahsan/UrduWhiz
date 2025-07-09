import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios"; // adjust path if needed
import logo from "../../assets/file.svg";

const VerifyEmail = () => {
  const [status, setStatus] = useState({ loading: true, success: null, message: "" });

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");

    if (!token) {
      setStatus({ loading: false, success: false, message: "Invalid verification link." });
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axiosInstance.get(`/auth/verify-email?token=${token}`);
        setStatus({
          loading: false,
          success: true,
          message: response.data.message || "Email successfully verified!",
        });
      } catch (error) {
        console.error("Verification error:", error);
        setStatus({
          loading: false,
          success: false,
          message:
            error.response?.data?.detail || "Something went wrong during verification.",
        });
      }
    };

    verifyEmail();
  }, []);
  return (
    <section className="bg-gray-50  min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow ">
        <div className="flex items-center justify-center mb-6 text-2xl font-semibold text-gray-900 ">
          <img className="w-16 h-16 mr-2" src={logo} alt="UrduWhiz Logo" />
          UrduWhiz
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900 ">Email Verification</h2>
        {status.loading ? (
          <p className="text-gray-600  text-center">Verifying your email, please wait...</p>
        ) : (
          <div className="text-center">
            <p
              className={`text-sm font-medium ${
                status.success ? "text-green-600 " : "text-red-600 "
              }`}
            >
              {status.message}
            </p>
            {status.success && (
              <a
                href="/login"
                className="mt-4 inline-block text-blue-600 hover:underline text-sm"
              >
                Proceed to Login
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default VerifyEmail;
