'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { login, register } from "../../services/api";

const FloatingLines = dynamic(() => import('./FloatingLines'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 -z-10 bg-black" />
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage('');

    try {
      const data = await login(email, password);

      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("driverId", data.driver_id);
      localStorage.setItem(
        "user",
        JSON.stringify({
          first_name: data.first_name,
          last_name: data.last_name,
          driver_id: data.driver_id,
        })
      );

      window.location.href = "/chat";
    } catch (error) {
      setLoginMessage("Invalid credentials");
    }

    setIsLoading(false);
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage('');

    try {
      if (signUpData.password !== signUpData.confirmPassword) {
        setLoginMessage("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const payload = {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        email: signUpData.email,
        password: signUpData.password,
        confirm_password: signUpData.confirmPassword
      };

      const data = await register(payload);

      setLoginMessage(`User ${signUpData.firstName} registered successfully!`);

      setTimeout(() => {
        setIsSignUp(false);
        setSignUpData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setEmail(signUpData.email);
        setPassword('');
      }, 1500);
    } catch (error) {
      console.log(error);
      setLoginMessage(
        error instanceof Error ? error.message : "Registration failed"
      );
    }

    setIsLoading(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
      
      {/* ========== LAYER 1: BACKGROUND ANIMATIONS (ISOLATED) ========== */}
      <div className="fixed inset-0 z-0 pointer-events-none will-change-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-slate-950" />
        
        {/* Isolated animation layer - won't affect form rendering */}
        <div className="absolute inset-0 contain-strict">
          <FloatingLines
            linesGradient={['#ff5c7a', '#8a5cff', '#60a5fa', '#00ffd1']}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[6, 8, 6]}
            lineDistance={[6, 5, 6]}
            animationSpeed={0.5}
            interactive={false}
            parallax={false}
            bendRadius={3.0}
            bendStrength={-0.3}
          />
        </div>
      </div>

      {/* ========== LAYER 2: CONTENT (INTERACTIVE) ========== */}
      <div className="relative z-10 pointer-events-auto w-full min-h-screen flex items-center justify-center p-4 overflow-hidden">
        
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideTabLeft {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes slideTabRight {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes headlightPulse {
            0%,100% {
              filter:
                drop-shadow(0 0 5px #60a5fa)
                drop-shadow(0 0 10px #60a5fa);
            }
            50% {
              filter:
                drop-shadow(0 0 15px #60a5fa)
                drop-shadow(0 0 30px #60a5fa);
            }
          }

          .truck-image {
            filter:
              drop-shadow(0 0 10px rgba(37,99,235,0.5))
              drop-shadow(0 0 20px rgba(59,130,246,0.4));
            animation: headlightPulse 2.5s infinite ease-in-out;
          }

          .fade-in-up {
            animation: fadeInUp 0.8s ease-out;
          }

          .slide-in-right {
            animation: slideInRight 0.8s ease-out;
          }

          .slide-tab-left {
            animation: slideTabLeft 0.5s ease-out;
          }

          .slide-tab-right {
            animation: slideTabRight 0.5s ease-out;
          }

          .glow-button {
            position: relative;
            overflow: hidden;
          }

          .glow-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .glow-button:hover::before {
            left: 100%;
          }

          input:focus {
            box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1), 0 0 20px rgba(147, 51, 234, 0.3);
          }

          .tab-button {
            transition: all 0.3s ease;
            border-bottom: 3px solid transparent;
          }

          .tab-button.active {
            border-bottom-color: #60a5fa;
            color: #ffffff;
          }

          .tab-button.inactive {
            color: #9ca3af;
          }

          .tab-button.inactive:hover {
            color: #d1d5db;
          }

          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div className="relative z-10 w-full max-w-6xl">
          <div className="grid md:grid-cols-[0.8fr_1.6fr] gap-8 items-center">
            
            {/* LEFT SIDE - TRUCK */}
            <div className="hidden md:flex flex-col items-center justify-center">
              <div className="mb-8 fade-in-up">
                <div className="truck-container relative -ml-20">
                  <img
                    src="/truck/truck_login_page.png"
                    alt="AI Driver Truck"
                    className="w-[700px] max-w-none h-auto object-contain truck-image"
                  />
                </div>
              </div>

              <div className="text-center fade-in-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
                  AI DRIVER
                </h2>
                <h2 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3 tracking-tight">
                  COPILOT
                </h2>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Intelligent fleet management powered by AI
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - FORM */}
            <div className="relative ml-8">
              <div className="bg-gradient-to-br from-black/90 via-slate-950/80 to-slate-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl slide-in-right w-full max-h-[700px] overflow-y-auto hide-scrollbar">
                
                {/* MOBILE HEADER */}
                <div className="md:hidden mb-8 text-center">
                  <h2 className="text-3xl font-black text-white mb-1">
                    AI DRIVER
                  </h2>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                    COPILOT
                  </h2>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex gap-8 mb-8 border-b border-purple-500/30">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`tab-button py-2 font-semibold text-lg transition-all ${
                      !isSignUp ? 'active' : 'inactive'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`tab-button py-2 font-semibold text-lg transition-all ${
                      isSignUp ? 'active' : 'inactive'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {/* SIGN IN FORM */}
                {!isSignUp ? (
                  <div className="slide-tab-left">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Welcome Back!
                    </h1>
                    <p className="text-gray-400 mb-8 text-sm">
                      Sign in to your account to continue
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                      {/* EMAIL FIELD */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="driver@example.com"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* PASSWORD FIELD */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {showPassword ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.604-3.368A9.945 9.945 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.052 10.052 0 01-5.676 7.25"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* LOGIN MESSAGE */}
                      {loginMessage &&
                      !loginMessage.includes("Welcome") && (
                        <div className="p-4 rounded-xl text-sm font-medium text-center bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {loginMessage}
                        </div>
                      )}

                      {/* SIGN IN BUTTON */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="glow-button w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 text-sm"
                      >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        <span className="text-gray-500 text-xs">OR</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                      </div>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-6">
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </p>
                  </div>
                ) : (
                  /* SIGN UP FORM */
                  <div className="slide-tab-right">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Create Account
                    </h1>
                    <p className="text-gray-400 mb-8 text-sm">
                      Join us today to get started
                    </p>

                    <form onSubmit={handleSignUpSubmit} className="space-y-6">
                      {/* FIRST NAME */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          First Name
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <input
                            type="text"
                            value={signUpData.firstName}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                firstName: e.target.value
                              })
                            }
                            placeholder="John"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* LAST NAME */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Last Name
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <input
                            type="text"
                            value={signUpData.lastName}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                lastName: e.target.value
                              })
                            }
                            placeholder="Doe"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* EMAIL */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Email Address
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <input
                            type="email"
                            value={signUpData.email}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                email: e.target.value
                              })
                            }
                            placeholder="john@example.com"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                        </div>
                      </div>

                      {/* PASSWORD */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signUpData.password}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                password: e.target.value
                              })
                            }
                            placeholder="••••••••"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {showPassword ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.604-3.368A9.945 9.945 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.052 10.052 0 01-5.676 7.25"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* CONFIRM PASSWORD */}
                      <div className="relative group">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative flex items-center">
                          <svg
                            className="absolute left-4 w-5 h-5 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signUpData.confirmPassword}
                            onChange={(e) =>
                              setSignUpData({
                                ...signUpData,
                                confirmPassword: e.target.value
                              })
                            }
                            placeholder="••••••••"
                            className="w-full bg-slate-800/50 border border-purple-500/30 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 transition-all duration-300 hover:border-purple-500/50 focus:outline-none focus:border-purple-500 text-sm"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {showPassword ? (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.604-3.368A9.945 9.945 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.052 10.052 0 01-5.676 7.25"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* SIGN UP MESSAGE */}
                      {loginMessage && (
                        <div
                          className={`p-4 rounded-xl text-sm font-medium text-center animate-bounce ${
                            loginMessage.includes('successfully')
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {loginMessage}
                        </div>
                      )}

                      {/* SIGN UP BUTTON */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="glow-button w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 text-sm"
                      >
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        <span className="text-gray-500 text-xs">OR</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                      </div>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-6">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUp(false)}
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                )}

                {/* FOOTER */}
                <div className="mt-8 pt-6 border-t border-purple-500/20">
                  <p className="text-xs text-gray-500 text-center">
                    © 2026 AI Driver Copilot. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}