import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  login,
  requestPasswordReset,
  validateOTP,
  resetPasswordWithOTP,
  updateFirstTimePassword,
  updateUser,
  selectIsFirstLogin,
  selectCurrentUser,
} from "../../redux/slice/userSlice";

const Login = () => {
  // All login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // First-time password update states - UPDATED with phone number
  const [isFirstLoginDetected, setIsFirstLoginDetected] = useState(false);
  const [showFirstTimePasswordForm, setShowFirstTimePasswordForm] =
    useState(false);
  const [currentTempPassword, setCurrentTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  // NEW: Phone number state for first-time users (required)
  const [contactNumber, setContactNumber] = useState("");

  // Password reset states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP, 3: New password
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isFirstLogin = useSelector(selectIsFirstLogin);
  const currentUser = useSelector(selectCurrentUser);

  // Timer for OTP expiry
  useEffect(() => {
    if (resetStep === 2 && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, resetStep]);

  // If user is logged in but it's first login, show password update form
  useEffect(() => {
    if (isFirstLogin && currentUser && !showFirstTimePasswordForm) {
      setIsFirstLoginDetected(true);
      setShowFirstTimePasswordForm(true);
      // Pre-fill email for context
      setEmail(currentUser.email);
      // Pre-fill contact number if exists
      if (currentUser.contact_no) {
        setContactNumber(currentUser.contact_no);
      }
    }
  }, [isFirstLogin, currentUser, showFirstTimePasswordForm]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================
  // 1. REGULAR LOGIN HANDLER
  // ============================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await dispatch(login({ email, password })).unwrap();

      if (result.success) {
        const userRole = result.data?.user?.role;
        const isFirstLogin = result.data?.is_first_login;

        console.log("Login result:", result);

        // Check if this is first login (user has ft_password but no password)
        if (isFirstLogin) {
          // Show first-time password update form immediately
          setIsFirstLoginDetected(true);
          setShowFirstTimePasswordForm(true);
          setCurrentTempPassword(password); // Store the temp password they just entered
          return;
        }

        // Regular login - redirect based on role
        redirectByRole(userRole);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(
        err?.error || "Login failed. Please check your credentials.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ============================================
  // 2. FIRST-TIME PASSWORD AND PHONE UPDATE HANDLER
  // ============================================
  const handleFirstTimePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoginError("");
    setResetSuccess("");

    // Validate phone number (required)
    if (!contactNumber) {
      setLoginError("Phone number is required");
      return;
    }

    if (!validatePhoneNumber(contactNumber)) {
      setLoginError("Please enter a valid phone number in format: +1 (XXX) XXX-XXXX");
      return;
    }

    // Validation
    if (newPassword !== confirmNewPassword) {
      setLoginError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setLoginError("Password must be at least 8 characters long");
      return;
    }

    // Check if they entered the correct temporary password
    if (currentTempPassword !== password) {
      setLoginError(
        "Current password is incorrect. Please use the temporary password provided by administrator.",
      );
      return;
    }

    setLoginLoading(true);

    try {
      // STEP 1: Update phone number FIRST
      if (currentUser?.id) {
        try {
          await dispatch(
            updateUser({
              id: currentUser.id,
              data: { contact_no: contactNumber }
            })
          ).unwrap();
          
          console.log("Phone number updated successfully");
        } catch (phoneErr) {
          console.error("Phone number update failed:", phoneErr);
          setLoginError("Failed to update phone number. Please try again.");
          setLoginLoading(false);
          return; // Stop here - don't proceed to password update
        }
      }

      // STEP 2: Only update password if phone number update was successful
      const passwordResult = await dispatch(
        updateFirstTimePassword({
          currentPassword: currentTempPassword,
          newPassword,
        }),
      ).unwrap();

      if (passwordResult.success) {
        setResetSuccess("Phone number and password updated successfully!");

        // Clear forms
        setPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentTempPassword("");
        setContactNumber("");

        // Auto-login with new credentials after 2 seconds
        setTimeout(async () => {
          try {
            const loginResult = await dispatch(
              login({
                email,
                password: newPassword,
              }),
            ).unwrap();

            if (loginResult.success) {
              const userRole = loginResult.data?.user?.role;
              redirectByRole(userRole);
            }
          } catch (loginErr) {
            console.error("Auto-login failed:", loginErr);
            // Let user manually login
            setShowFirstTimePasswordForm(false);
            setIsFirstLoginDetected(false);
            setResetSuccess("");
            setLoginError(
              "Password updated! Please login with your new password.",
            );
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Update password error:", err);
      setLoginError(
        err?.error || "Failed to update password. Please try again.",
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Helper function to validate phone number format
  const validatePhoneNumber = (phone) => {
    // Basic validation for +1 (XXX) XXX-XXXX format
    const phoneRegex = /^\+\d{1,3}\s\(\d{3}\)\s\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  // Helper function to format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +1 (XXX) XXX-XXXX
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 11) {
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    
    // Limit to 11 digits (1 country code + 10 number)
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setContactNumber(formatted);
  };

  // ============================================
  // 3. PASSWORD RESET HANDLERS (FOR EXISTING USERS)
  // ============================================
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Step 1: Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);

    try {
      const result = await dispatch(requestPasswordReset(resetEmail)).unwrap();

      if (result.success) {
        setResetSuccess("OTP sent to your email!");
        setResetStep(2);
        setTimeLeft(600);
      }
    } catch (err) {
      console.error("Password reset request error:", err);
      setResetError(
        err?.error || "Failed to send reset instructions. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setResetError("");
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setResetError("Please enter all 6 digits of the OTP");
      return;
    }

    setResetLoading(true);

    try {
      const result = await dispatch(
        validateOTP({ email: resetEmail, otp: otpString }),
      ).unwrap();

      if (result.success) {
        setResetSuccess(
          "OTP verified successfully! Now set your new password.",
        );
        setResetStep(3);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setResetError(err?.error || "Invalid or expired OTP. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (resetPassword !== confirmResetPassword) {
      setResetError("Passwords do not match");
      return;
    }

    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters long");
      return;
    }

    setResetLoading(true);
    const otpString = otp.join("");

    try {
      const result = await dispatch(
        resetPasswordWithOTP({
          email: resetEmail,
          otp: otpString,
          newPassword: resetPassword,
        }),
      ).unwrap();

      if (result.success) {
        setResetSuccess(
          "Password reset successfully! You can now login with your new password.",
        );

        // Auto-switch back to login after 3 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetStep(1);
          setResetEmail("");
          setOtp(["", "", "", "", "", ""]);
          setResetPassword("");
          setConfirmResetPassword("");
          setResetSuccess("");
          setResetError("");

          // Pre-fill the email in login form
          setEmail(resetEmail);
        }, 3000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setResetError(
        err?.error || "Failed to reset password. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const redirectByRole = (userRole) => {
    switch (userRole) {
      case "super_admin":
        navigate("/super-admin");
        break;
      case "brand_admin":
        navigate("/brand-admin");
        break;
      case "district_manager":
        navigate("/district-manager");
        break;
      case "shop_manager":
        navigate("/shop-manager");
        break;
      case "technician":
        navigate("/technician");
        break;
      default:
        navigate("/login");
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = calculatePasswordStrength(newPassword || resetPassword);
    if (strength <= 2) return "bg-red-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    const strength = calculatePasswordStrength(newPassword || resetPassword);
    if (strength <= 2) return "Weak";
    if (strength === 3) return "Good";
    return "Strong";
  };

  const handleBackToLogin = () => {
    if (showFirstTimePasswordForm) {
      setShowFirstTimePasswordForm(false);
      setIsFirstLoginDetected(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setCurrentTempPassword("");
      setContactNumber("");
    } else if (showForgotPassword) {
      setShowForgotPassword(false);
      setResetStep(1);
      setResetEmail("");
      setOtp(["", "", "", "", "", ""]);
      setResetPassword("");
      setConfirmResetPassword("");
      setResetError("");
      setResetSuccess("");
    }
  };

  const handleResendOtp = () => {
    setTimeLeft(600);
    setOtp(["", "", "", "", "", ""]);
    setResetError("");
    setResetSuccess("New OTP has been sent to your email.");
  };

  // Pre-fill reset email from login email
  useEffect(() => {
    if (showForgotPassword && email && !resetEmail) {
      setResetEmail(email);
    }
  }, [showForgotPassword, email, resetEmail]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  const renderFirstTimePasswordForm = () => (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Welcome! Complete Your Profile
      </h2>
      <p className="text-gray-600 mb-6">
        This is your first login. Please update your password and provide your contact information.
      </p>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          <strong>Note:</strong> You just logged in with your temporary
          password. Now create your permanent password and update your contact number.
        </p>
      </div>

      <form onSubmit={handleFirstTimePasswordUpdate}>
        {/* PHONE NUMBER FIELD - Required */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={contactNumber}
            onChange={handlePhoneChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            placeholder="+1 (XXX) XXX-XXXX"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: +1 (XXX) XXX-XXXX (required)
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-gray-700 mb-2 font-medium">
            New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Create a new password"
            required
          />

          {newPassword && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Strength:</span>
                <span
                  className={`text-sm font-medium ${getStrengthColor().replace("bg-", "text-")}`}
                >
                  {getStrengthText()}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
                  style={{
                    width: `${(calculatePasswordStrength(newPassword) / 5) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Confirm your new password"
            required
          />
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {loginError}
          </div>
        )}

        {resetSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
            {resetSuccess}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 py-3 rounded-lg font-medium ${loginLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white transition`}
            disabled={loginLoading}
          >
            {loginLoading ? "Updating..." : "Complete Setup"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderForgotPasswordForm = () => {
    // Step 1: Email Input
    if (resetStep === 1) {
      return (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we will send you an OTP to reset your
            password.
          </p>

          <form onSubmit={handleRequestReset}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
                {resetSuccess}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Back to Login
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 rounded-lg font-medium ${resetLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white transition`}
                disabled={resetLoading}
              >
                {resetLoading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </form>
        </>
      );
    }

    // Step 2: OTP Verification
    if (resetStep === 2) {
      return (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Enter the 6-digit OTP sent to <strong>{resetEmail}</strong>
              {timeLeft > 0 && (
                <span className="block font-medium mt-1">
                  Time remaining: {formatTime(timeLeft)}
                </span>
              )}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-3 font-medium">
                Enter OTP
              </label>
              <div className="flex justify-between space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-full h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    required
                  />
                ))}
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
                {resetSuccess}
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-medium ${resetLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white transition mb-4`}
              disabled={resetLoading}
            >
              {resetLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          {timeLeft <= 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                OTP has expired. Please request a new one.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleBackToLogin}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={handleResendOtp}
              className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
              disabled={timeLeft > 300}
            >
              Resend OTP
            </button>
          </div>
        </>
      );
    }

    // Step 3: New Password
    if (resetStep === 3) {
      return (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Set New Password
          </h2>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Create a new secure password for your account.
            </p>
          </div>

          <form onSubmit={handleResetPassword}>
            <div className="mb-5">
              <label className="block text-gray-700 mb-2 font-medium">
                New Password
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Create a new password"
                required
              />

              {resetPassword && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">Strength:</span>
                    <span
                      className={`text-sm font-medium ${getStrengthColor().replace("bg-", "text-")}`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{
                        width: `${(calculatePasswordStrength(resetPassword) / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmResetPassword}
                onChange={(e) => setConfirmResetPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Confirm your new password"
                required
              />
            </div>

            {resetError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
                {resetSuccess}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setResetStep(2)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 rounded-lg font-medium ${resetLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white transition`}
                disabled={resetLoading}
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        </>
      );
    }
  };

  const renderLoginForm = () => (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Welcome Back
      </h2>

      <form onSubmit={handleLogin}>
        <div className="mb-5">
          <label className="block text-gray-700 mb-2 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="mb-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Password</label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Enter your password"
            required
          />
        </div>

        <div className="mb-4">
          <p className="text-gray-600 text-sm">
            First time user? Use the temporary password provided by your
            administrator through Email.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {loginError}
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-3 rounded-lg font-medium ${loginLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white transition flex items-center justify-center`}
          disabled={loginLoading}
        >
          {loginLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Innu</h1>
        </div>

        {/* Conditional Rendering */}
        {showFirstTimePasswordForm
          ? renderFirstTimePasswordForm()
          : showForgotPassword
            ? renderForgotPasswordForm()
            : renderLoginForm()}
      </div>
    </div>
  );
};

export default Login;