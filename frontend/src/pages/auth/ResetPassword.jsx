import React, { useState } from "react";
import AxiosInstance from "../../api/authAxios"; // Adjust path if needed
import logo from "../../assets/file.svg";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ loading: false, success: null, message: "" });

  const token = new URLSearchParams(window.location.search).get("token");

  const validatePassword = (password) => {
    const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!validatePassword(newPassword)) {
      newErrors.newPassword = "Password must be at least 8 characters, include one uppercase letter, one number, and one special character.";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!token) {
      setStatus({ success: false, message: "Missing or invalid reset token." });
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus({ loading: true, success: null, message: "" });
    setErrors({});

    try {
      const response = await AxiosInstance.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      setStatus({
        loading: false,
        success: true,
        message: response.data.message || "Password reset successfully!",
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        message: error.response?.data?.detail || "Reset failed.",
      });
    }
  };

  return (
    <section className="bg-gray-50  min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow ">
        <div className="flex items-center justify-center mb-6 text-2xl font-semibold text-gray-900 ">
          <img className="w-16 h-16 mr-2" src={logo} alt="UrduWhiz Logo" />
          UrduWhiz
        </div>
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">Reset Your Password</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 ">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              placeholder="••••••••"
              required
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 "
            />
            {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 ">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="••••••••"
              required
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 "
            />
            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-navy-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-navy-800 focus:ring-4 focus:ring-navy-300 transition-all duration-300"
          >
            {status.loading ? "Resetting..." : "Reset Password"}
          </button>

          {status.message && (
            <p className={`text-sm font-medium text-center mt-2 ${
              status.success ? "text-green-600 " : "text-red-600 "
            }`}>
              {status.message}
            </p>
          )}

          <p className="text-sm text-center text-gray-500 ">
            <a href="/login" className="text-blue-600 hover:underline ">
              Go to Login
            </a>
          </p>
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;