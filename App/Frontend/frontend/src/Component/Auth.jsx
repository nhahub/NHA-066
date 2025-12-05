import { useState } from "react";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { setToken } from "../HelperFunctions/token.js";
import { useNavigate } from "react-router-dom";

import "./styles/auth.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const api = "http://localhost:8000/auth";

  const handleSubmit = async () => {
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const endpoint = isLogin ? api + "/login" : api + "/sign_up";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.issue === "userName exists. Try a different one") {
        setError("Username already exists");
      } else if (data.status === "invalid-password") {
        setError("Wrong username or password");
      } else if (!response.ok) {
        setError(data.message || "Server Error");
      } else if (data.token) {
        setToken(data.token);
        navigate("/Home");
      } else {
        setError("Authentication failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-icon">
            <User className="icon" />
          </div>

          <h1 key={isLogin ? "login" : "signup"} className="auth-title">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p
            key={isLogin ? "login-sub" : "signup-sub"}
            className="auth-subtitle"
          >
            {isLogin ? "Log in to your account" : "Sign up for a new account"}
          </p>
        </div>

        <div className="auth-fields-container">
          <div
            className={`auth-fields ${isLogin ? "slide-left" : "slide-right"}`}
          >
            <div className="field">
              <label>Username</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div
              className={`field confirm-password-field ${
                !isLogin ? "show" : "hide"
              }`}
            >
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="auth-submit" onClick={handleSubmit}>
              {isLogin ? "Log In" : "Sign Up"}
            </button>

            <div className="switch-mode">
              <button onClick={toggleMode}>
                {isLogin ? (
                  <>
                    Don't have an account? <span>Sign Up</span>
                  </>
                ) : (
                  <>
                    Already have an account? <span>Log In</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
