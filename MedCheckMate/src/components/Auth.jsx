import React, { useState } from "react";
import axios from "axios";
import "./Auth.css";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
 
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: "", email: "", phone: "", password: "" });
    setError("");
    setShowOTP(false);
    setOtpSent(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOTPChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/users/send-otp",
        { email: formData.email },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setOtpSent(true);
        setShowOTP(true);
        setError("");
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/users/verify-otp",
        { email: formData.email, otp },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        // Proceed with registration
        handleSubmit(e);
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = "http://localhost:5000/users/auth/google";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "users/login" : "users/register";

    try {
      const response = await axios.post(
        `http://localhost:5000/${endpoint}`,
        isLogin ? { email: formData.email, password: formData.password } : formData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        alert("Authentication successful!");
      } else {
        setError(response.data.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {isLogin ? (
          <>
            <div className="auth-left">
              <h2 className="auth-title">Sign In</h2>
              <p className="auth-text">Use your account credentials to login</p>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <input type="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required />
                </div>
                {error && <p className="error-text">{error}</p>}
                <button type="submit" className="auth-button" disabled={loading}>{loading ? "Signing In..." : "Sign In"}</button>
                <div className="divider">
                  <span>OR</span>
                </div>
                <button type="button" className="google-button" onClick={handleGoogleAuth}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
                  Continue with Google
                </button>
              </form>
            </div>
            <div className="auth-right">
              <h2 className="auth-title">Hello, Friend!</h2>
              <p className="auth-text">Enter your details and start your journey with us</p>
              <button className="auth-switch" onClick={toggleAuthMode}>Sign Up</button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-right">
              <h2 className="auth-title">Welcome Back!</h2>
              <p className="auth-text">To stay connected, please login with your details</p>
              <button className="auth-switch" onClick={toggleAuthMode}>Sign In</button>
            </div>
            <div className="auth-left">
              <h2 className="auth-title">Sign Up</h2>
              <p className="auth-text">Create an account to get started</p>
              {!showOTP ? (
                <form className="auth-form" onSubmit={handleSendOTP}>
                  <div className="form-group">
                    <input type="text" name="username" placeholder="Enter your username" value={formData.username} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <input type="text" name="phone" placeholder="Enter your phone number" value={formData.phone} onChange={handleChange} required pattern="\d{10}" title="Phone number must be 10 digits" />
                  </div>
                  <div className="form-group">
                    <input type="password" name="password" placeholder="Create a password" value={formData.password} onChange={handleChange} required />
                  </div>
                  {error && <p className="error-text">{error}</p>}
                  <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form className="auth-form" onSubmit={handleVerifyOTP}>
                  <div className="form-group">
                    <input type="text" placeholder="Enter OTP" value={otp} onChange={handleOTPChange} required />
                  </div>
                  {error && <p className="error-text">{error}</p>}
                  <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
              )}
              <div className="divider">
                <span>OR</span>
              </div>
              <button type="button" className="google-button" onClick={handleGoogleAuth}>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
                Continue with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
