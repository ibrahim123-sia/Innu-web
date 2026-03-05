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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [isFirstLoginDetected, setIsFirstLoginDetected] = useState(false);
  const [showFirstTimePasswordForm, setShowFirstTimePasswordForm] = useState(false);
  const [currentTempPassword, setCurrentTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isFirstLogin = useSelector(selectIsFirstLogin);
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    if (resetStep === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, resetStep]);

  useEffect(() => {
    if (isFirstLogin && currentUser && !showFirstTimePasswordForm) {
      setIsFirstLoginDetected(true);
      setShowFirstTimePasswordForm(true);
      setEmail(currentUser.email);
      if (currentUser.contact_no) setContactNumber(currentUser.contact_no);
    }
  }, [isFirstLogin, currentUser, showFirstTimePasswordForm]);

  useEffect(() => {
    if (showForgotPassword && email && !resetEmail) setResetEmail(email);
  }, [showForgotPassword, email, resetEmail]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+\d{1,3}\s\(\d{3}\)\s\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 11) {
      return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    setContactNumber(formatPhoneNumber(e.target.value));
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const redirectByRole = (userRole) => {
    const routes = {
      super_admin: "/super-admin",
      brand_admin: "/brand-admin",
      district_manager: "/district-manager",
      shop_manager: "/shop-manager",
      technician: "/technician",
    };
    navigate(routes[userRole] || "/login");
  };

  const calculatePasswordStrength = (password) => {
    return [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const result = await dispatch(login({ email, password })).unwrap();

      if (result.success) {
        const userRole = result.data?.user?.role;
        const isFirstLogin = result.data?.is_first_login;

        if (isFirstLogin) {
          setIsFirstLoginDetected(true);
          setShowFirstTimePasswordForm(true);
          setCurrentTempPassword(password);
          return;
        }
        redirectByRole(userRole);
      }
    } catch (err) {
      setLoginError(err?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFirstTimePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoginError("");
    setResetSuccess("");

    if (!contactNumber) {
      setLoginError("Phone number is required");
      return;
    }

    if (!validatePhoneNumber(contactNumber)) {
      setLoginError("Please enter a valid phone number in format: +1 (XXX) XXX-XXXX");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setLoginError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setLoginError("Password must be at least 8 characters long");
      return;
    }

    if (currentTempPassword !== password) {
      setLoginError("Current password is incorrect. Please use the temporary password provided by administrator.");
      return;
    }

    setLoginLoading(true);

    try {
      if (currentUser?.id) {
        try {
          await dispatch(updateUser({
            id: currentUser.id,
            data: { contact_no: contactNumber }
          })).unwrap();
        } catch {
          setLoginError("Failed to update phone number. Please try again.");
          setLoginLoading(false);
          return;
        }
      }

      const passwordResult = await dispatch(updateFirstTimePassword({
        currentPassword: currentTempPassword,
        newPassword,
      })).unwrap();

      if (passwordResult.success) {
        setResetSuccess("Phone number and password updated successfully!");

        setPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentTempPassword("");
        setContactNumber("");

        setTimeout(async () => {
          try {
            const loginResult = await dispatch(login({ email, password: newPassword })).unwrap();
            if (loginResult.success) redirectByRole(loginResult.data?.user?.role);
          } catch {
            setShowFirstTimePasswordForm(false);
            setIsFirstLoginDetected(false);
            setResetSuccess("");
            setLoginError("Password updated! Please login with your new password.");
          }
        }, 2000);
      }
    } catch (err) {
      setLoginError(err?.error || "Failed to update password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

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
      setResetError(err?.error || "Failed to send reset instructions. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

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
      const result = await dispatch(validateOTP({ email: resetEmail, otp: otpString })).unwrap();
      if (result.success) {
        setResetSuccess("OTP verified successfully! Now set your new password.");
        setResetStep(3);
      }
    } catch (err) {
      setResetError(err?.error || "Invalid or expired OTP. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

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
      const result = await dispatch(resetPasswordWithOTP({
        email: resetEmail,
        otp: otpString,
        newPassword: resetPassword,
      })).unwrap();

      if (result.success) {
        setResetSuccess("Password reset successfully! You can now login with your new password.");

        setTimeout(() => {
          setShowForgotPassword(false);
          setResetStep(1);
          setResetEmail("");
          setOtp(["", "", "", "", "", ""]);
          setResetPassword("");
          setConfirmResetPassword("");
          setResetSuccess("");
          setResetError("");
          setEmail(resetEmail);
        }, 3000);
      }
    } catch (err) {
      setResetError(err?.error || "Failed to reset password. Please try again.");
    } finally {
      setResetLoading(false);
    }
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
                <span className={`text-sm font-medium ${getStrengthColor().replace("bg-", "text-")}`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
                  style={{ width: `${(calculatePasswordStrength(newPassword) / 5) * 100}%` }}
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

        {(loginError || resetSuccess) && (
          <div className={`mb-4 p-3 rounded-lg ${loginError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
            {loginError || resetSuccess}
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
    if (resetStep === 1) {
      return (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we will send you an OTP to reset your password.
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

            {(resetError || resetSuccess) && (
              <div className={`mb-4 p-3 rounded-lg ${resetError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                {resetError || resetSuccess}
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

            {(resetError || resetSuccess) && (
              <div className={`mb-4 p-3 rounded-lg ${resetError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                {resetError || resetSuccess}
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
                    <span className={`text-sm font-medium ${getStrengthColor().replace("bg-", "text-")}`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-300`}
                      style={{ width: `${(calculatePasswordStrength(resetPassword) / 5) * 100}%` }}
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

            {(resetError || resetSuccess) && (
              <div className={`mb-4 p-3 rounded-lg ${resetError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                {resetError || resetSuccess}
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
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Innu</h1>
        </div>

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