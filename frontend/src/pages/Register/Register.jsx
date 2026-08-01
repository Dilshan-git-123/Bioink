import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaMicroscope, FaUser, FaSpinner, FaGoogle, FaMicrosoft } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { registerUser, googleOAuthLogin, microsoftOAuthLogin } from '../../services/authService';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { instance } = useMsal();

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setError('');
            try {
                await googleOAuthLogin(tokenResponse.access_token);
                navigate('/initialize');
            } catch (err) {
                setError(err.message || "Google registration failed");
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setError("Google Registration Failed");
        }
    });

    const loginWithMicrosoft = async () => {
        setLoading(true);
        setError('');
        try {
            const loginResponse = await instance.loginPopup({
                scopes: ["user.read"]
            });
            if (loginResponse.accessToken) {
                await microsoftOAuthLogin(loginResponse.accessToken);
                navigate('/initialize');
            }
        } catch (err) {
            setError(err.message || "Microsoft registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Password strength verification
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, and one number.");
            return;
        }

        setLoading(true);
        try {
            await registerUser(name, email, password, confirmPassword);
            setSuccessMessage("Account created successfully! Redirecting to login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                
                {/* Left Section: Branding */}
                <div className="register-left">
                    <div className="register-left-content">
                        <div className="register-logo">
                            <h1>🧬 BioInkAI</h1>
                        </div>
                        <div className="register-hero-text">
                            <h2>Join the Research Network</h2>
                            <p>Create an account to begin formulating, optimizing, and validating cutting-edge biomaterials for your 3D bioprinting projects.</p>
                        </div>
                        <div className="illustration-placeholder">
                            <FaMicroscope className="illustration-icon" />
                            <span>Scientific Platform</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="register-right">
                    <div className="register-form-container">
                        <div className="register-header">
                            <h2>Create Account</h2>
                            <p>Sign up to set up your laboratory workspace</p>
                        </div>

                        {error && (
                            <div className="auth-error-alert" style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '14px',
                                textAlign: 'center'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="auth-success-alert" style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                color: '#4ade80',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                fontSize: '14px',
                                textAlign: 'center'
                            }}>
                                {successMessage}
                            </div>
                        )}

                        <form className="register-form" onSubmit={handleRegister}>
                            <div className="input-group">
                                <label>Full Name</label>
                                <div className="input-wrapper">
                                    <FaUser className="input-icon" />
                                    <input 
                                        type="text" 
                                        placeholder="Dr. Jane Smith" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <FaEnvelope className="input-icon" />
                                    <input 
                                        type="email" 
                                        placeholder="dr.smith@university.edu" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <FaLock className="input-icon" />
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="input-wrapper">
                                    <FaLock className="input-icon" />
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="register-submit-btn" 
                                disabled={loading}
                                style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                            >
                                {loading ? <><FaSpinner className="fa-spin" /> Creating Account...</> : "Create Account"}
                            </button>
                        </form>

                        <div className="register-divider">
                            <span>or continue with</span>
                        </div>

                        <div className="social-login" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <button type="button" className="social-btn" onClick={loginWithMicrosoft} disabled={loading} style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FaMicrosoft style={{ color: '#00a4ef' }} /> Microsoft
                            </button>
                            <button type="button" className="social-btn" onClick={() => loginWithGoogle()} disabled={loading} style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FaGoogle style={{ color: '#ea4335' }} /> Google
                            </button>
                        </div>

                        <div className="register-footer">
                            <p>Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign In</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
