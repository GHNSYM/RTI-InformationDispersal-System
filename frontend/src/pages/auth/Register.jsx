import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Layout from "./Layout";
import axios from "axios";

const Register = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },  } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const password = watch("password");

  const [otpRequested, setOtpRequested] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpSent] = useState("1234"); // simulate OTP

  const otpLength = 4;
  const otpRefs = Array.from({ length: otpLength }, () => useRef(null));
  const [otpValues, setOtpValues] = useState(Array(otpLength).fill(""));

  // Send OTP
  const handleGetOtp = () => {
    const phone = watch("phone");
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setOtpRequested(true);
    // simulate sending OTP...
    console.log(`Sent OTP ${otpSent} to ${phone}`);
  };

  // Verify OTP button
  const handleVerifyOtp = () => {
    const entered = otpValues.join("");
    if (entered === otpSent) {
      setIsOtpVerified(true);
      setOtpRequested(false);
      setError("");
    } else {
      setError("Incorrect OTP");
    }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpValues];
    next[i] = val;
    setOtpValues(next);
    if (val && i < otpLength - 1) otpRefs[i + 1].current?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpValues[i] && i > 0) {
      otpRefs[i - 1].current?.focus();
    }
  };

const onSubmit = async (data) => {
  if (!isOtpVerified) {
    setError("Please verify your phone number before submitting.");
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    return;
  }
  setError("");
  
  // Concatenate address fields into a single string
  const fullAddress = `${data.street.trim()}, ${data.city.trim()}, ${data.state.trim()} - ${data.pincode.trim()}`;

  // Create a new data object with the address field
  const formattedData = {
    ...data,
    address: fullAddress,
  };

  // Optionally remove individual address fields if not needed in backend
  delete formattedData.street;
  delete formattedData.city;
  delete formattedData.state;
  delete formattedData.pincode;

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formattedData),
    });

    const result = await response.json();
    if (response.ok) {
      navigate("/login");
    } else {
      setError(result.error || "Registration failed");
    }
  } catch (err) {
    setError(err.message || "Something went wrong");
  }
};


  return (
    <Layout>
      <div className="flex min-h-screen flex-col justify-top py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Register for RTI Portal
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md md:max-w-2xl lg:max-w-4xl">
          <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <form className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0" onSubmit={handleSubmit(onSubmit)}>
              {/* Left Column */}
              <div className="space-y-2">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="input-field mt-1 p-2 w-full"
                    {...register("name", {
                      required: "Name is required",
                      minLength: { value: 2, message: "At least 2 characters" },
                    })}
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                {/* Phone + OTP */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 flex gap-2 items-center">
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      className="input-field flex-1"
                      disabled={isOtpVerified}
                      {...register("phone", {
                        required: "Phone number is required",
                        pattern: { value: /^[0-9]{10}$/, message: "Must be 10 digits" },
                      })}
                    />
                    {isOtpVerified ? (
                      <button
                        type="button"
                        className="bg-green-500 text-white rounded-xl px-4 py-2 cursor-default"
                        disabled
                      >
                        Verified
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGetOtp}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                      >
                        Get OTP
                      </button>
                    )}
                  </div>
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                </div>

                {/* OTP Inputs */}
                {otpRequested && !isOtpVerified && (
                  <div className="mt-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Enter OTP</label>
                      <div className="flex gap-2">
                        {otpRefs.map((ref, i) => (
                          <input
                            key={i}
                            ref={ref}
                            type="text"
                            maxLength={1}
                            className="w-10 h-10 input-field text-center"
                            value={otpValues[i]}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                      >
                        Verify
                      </button>
                    </div>
                    {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="input-field mt-1 p-2 w-full"
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: "Invalid email" },
                    })}
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="input-field mt-1 p-2 w-full"
                    {...register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "At least 6 characters" },
                    })}
                  />
                  {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="input-field mt-1 p-2 w-full"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (val) => val === password || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-20">
                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    placeholder="Street"
                    className="input-field mt-1 w-full"
                    {...register("street", { required: "Street is required" })}
                  />
                  {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street.message}</p>}
                  <input
                    placeholder="City/Town"
                    className="input-field mt-1 w-full"
                    {...register("city", { required: "City is required" })}
                  />
                  {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                  <input
                    placeholder="State"
                    className="input-field mt-1 w-full"
                    {...register("state", { required: "State is required" })}
                  />
                  {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
                  <input
                    placeholder="Pin Code"
                    className="input-field mt-1 w-full"
                    {...register("pincode", {
                      required: "Pincode is required",
                      pattern: { value: /^[1-9][0-9]{5}$/, message: "Invalid pincode" },
                    })}
                  />
                  {errors.pincode && <p className="text-red-600 text-sm mt-1">{errors.pincode.message}</p>}
                </div>

                {/* Global Error */}
                {error && !otpRequested && (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}                {/* Submit */}
                <div className="flex flex-col items-center">
                  <button
                    type="submit"
                    className="btn w-80 bg-black hover:bg-gray-800 text-white"
                  >
                    Register
                  </button>
                  {error === "Please verify your phone number before submitting." && (
                    <p className="text-red-500 text-sm mt-2">
                      Please verify your phone number to enable registration.
                    </p>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 backdrop-blur-sm px-2 text-gray-500">OR</span>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
