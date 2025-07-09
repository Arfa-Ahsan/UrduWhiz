import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios"; // adjust path as needed
import logo from "../../assets/file.svg";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validatePassword = (password) => {
    const pattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return pattern.test(password);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!username.trim()) newErrors.username = "Username is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/register", {
        username,
        email,
        password,
      });

      if (response.status === 200 || response.status === 201) {
        navigate("/send-verification");
      }
    } catch (error) {
      const serverError = error.response?.data?.detail || "Registration failed.";
      const errMsg = typeof serverError === "string" ? serverError.toLowerCase() : "";

      const newErrors = {};
      if (errMsg.includes("username")) newErrors.username = "Username is already taken";
      if (errMsg.includes("email")) newErrors.email = "Email already exists";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
      } else {
        alert(serverError);
      }
    }
  };

  return (
    <section className="bg-gray-50">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 ">
          <img className="w-16 h-16 mr-2" src={logo} alt="UrduWhiz Logo" />
          UrduWhiz
        </a>
        <div className="w-full bg-white rounded-lg shadow  sm:max-w-md xl:p-0  ">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-center text-gray-900 md:text-2xl">
              Create your account
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleRegister}>
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((prev) => ({ ...prev, username: "" }));
                  }}
                  placeholder="johndoe"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="example@gmail.com"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 "
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 ">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="••••••••"
                  required
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5"
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                className="w-full text-white bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:outline-none focus:ring-navy-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-all duration-300"
              >
                Register
              </button>

              <p className="text-sm font-light text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="font-medium text-blue-600 hover:underline">
                  Login here
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegisterForm;
