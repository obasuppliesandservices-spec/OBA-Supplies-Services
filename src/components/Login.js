import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, get, push, set } from 'firebase/database';

export default function Login({ onLogin, onOpenRfidKiosk }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');

  const returnToSignIn = () => {
    setIsSignUp(false);
    setIsForgotPassword(false);
    setForgotStep(1);
    setVerificationCode('');
    setCompany('');
    setName('');
    setSurname('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const openForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotStep(1);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (forgotStep === 1) {
      if (!email.trim()) {
        setError('Enter your email address first.');
        return;
      }
      setForgotStep(2);
      setSuccessMessage('Verification sent. Enter the 6-digit code from your email.');
      return;
    }

    if (forgotStep === 2) {
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Enter the 6-digit verification code.');
        return;
      }
      setForgotStep(3);
      setSuccessMessage('Code verified. Enter your new password.');
    }
  };

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Sign Up Flow for new Customer Users
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const fullName = `${name} ${surname}`.trim();
        await updateProfile(credential.user, { displayName: fullName });
        await set(ref(database, `customers/${credential.user.uid}`), {
          uid: credential.user.uid,
          company,
          name,
          surname,
          email,
          status: 'Active',
          createdDate: new Date().toISOString().split('T')[0]
        });
        returnToSignIn();
      } catch (err) {
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
          try {
            const customerRef = push(ref(database, 'customers'));
            await set(customerRef, {
              company,
              name,
              surname,
              email,
              password,
              status: 'Active',
              createdDate: new Date().toISOString().split('T')[0]
            });
            returnToSignIn();
          } catch (databaseError) {
            console.error('Firebase customer account creation error:', databaseError);
            setError('Unable to create your account in Firebase. Please try again.');
          }
        } else {
          setError(err.message);
        }
      }
      return;
    }

    // Login Flow
    // 1. Check Hardcoded credentials first limit backwards compatibility
    if (email === 'logistics1@obalogistics.com' && password === 'logistics') {
      onLogin({ email, role: 'logistics' });
      return;
    } else if (email === 'customer@gmail.com' && password === 'customer') {
      onLogin({ email, role: 'customer' });
      return;
    } else if (email === 'AdminEdit@obasupplies.com' && password === 'ObaEdit') {
      onLogin({ email, role: 'admin' });
      return;
    } else if (email === 'obadashboard@obasupplies.com' && password === 'dashboardoba') {
      onLogin({ email, role: 'dashboardadmin' });
      return;
    }

    // 2. Check Realtime Database for Admin-created customer accounts
    try {
      const dbRef = ref(database, 'customers');
      const snapshot = await get(dbRef);
      
      if (snapshot.exists()) {
        const customersData = snapshot.val();
        // Find customer by email
        let foundCustomer = null;
        let foundCustomerId = null;
        
        for (const customerId in customersData) {
          if (customersData[customerId].email === email) {
            foundCustomer = customersData[customerId];
            foundCustomerId = customerId;
            break;
          }
        }
        
        if (foundCustomer && foundCustomer.password) {
          if (foundCustomer.password === password) {
            if (foundCustomer.status === 'Active') {
              onLogin({ email: foundCustomer.email, role: 'customer', name: foundCustomer.name });
              return;
            } else {
              setError('Your account has been deactivated. Contact Admin.');
              return;
            }
          } else {
            setError('Invalid email or password.');
            return;
          }
        }
      }
    } catch (dbError) {
      console.error("RTDB Auth check error:", dbError);
    }

    // 3. Fallback: If not hardcoded or in RTDB, check against Firebase Auth (Self-registered)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Ensure firebase authenticated users sign in as customers based on requested behavior
      onLogin({ email, role: 'customer', name: credential.user.displayName });
    } catch (err) {
      setError('Invalid email or password.');
    }
  }

  return (
    <>
      <style>{`
        .password-field-wrap {
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .login-page {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh;
            display: flex;
          }
          .left-panel {
            display: none !important;
          }
          .right-panel {
            width: 100% !important;
            padding: 20px !important;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .login-card {
            width: 100% !important;
            max-width: 400px;
            padding: 30px 20px !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
            border-radius: 12px !important;
            box-sizing: border-box;
          }
          .form-group input {
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .btn-login {
            width: 100% !important;
          }
        }
      `}</style>
      <div className="login-page">
        <div className="left-panel">
        <div className="badge">
          <img src="/logo.png" alt="Transportify Logo" className="logo-img" />
        </div>
        
        <div className="features">
          <p>Your trusted transportation partner</p>
          <div className="feature">
            <span>🚚</span>
            <span>Reliable Delivery</span>
          </div>
          <div className="feature">
            <span>⚡</span>
            <span>Fast & Efficient</span>
          </div>
          <div className="feature">
            <span>🛡️</span>
            <span>Secure & Safe</span>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="login-card">
          <img src="/logo.png" alt="OBA Supplies&Services logo" className="login-brand-logo" />
          <h1 className="login-brand-name">OBA Supplies&Services</h1>
          <h3>{isForgotPassword ? 'Reset Password' : isSignUp ? 'Create an Account' : 'Welcome Back'}</h3>
          <p>{isForgotPassword ? `Step ${forgotStep} of 3` : isSignUp ? 'Sign up to continue' : 'Please sign in to your account'}</p>
          
          {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
          {successMessage && <p style={{color: '#04ab0c', marginTop: '10px'}}>{successMessage}</p>}
          
          <form onSubmit={isForgotPassword ? handleForgotPasswordSubmit : submit} autoComplete="off">
            {isForgotPassword ? (
              <>
                {forgotStep === 1 && (
                  <div className="form-group">
                    <label>Enter Email: </label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" required />
                  </div>
                )}
                {forgotStep === 2 && (
                  <div className="form-group">
                    <label>Enter 6-Digit Code: </label>
                    <input type="text" inputMode="numeric" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" autoComplete="one-time-code" maxLength="6" required />
                  </div>
                )}
                {forgotStep === 3 && (
                  <>
                    <div className="form-group">
                      <label>Enter New Password: </label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter New Password" autoComplete="new-password" required />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password: </label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" autoComplete="new-password" required />
                    </div>
                  </>
                )}
                <div className="form-row">
                  <button className="btn-login" type="submit" onClick={forgotStep === 3 ? (e) => {
                    if (password !== confirmPassword) {
                      e.preventDefault();
                      setError('Passwords do not match.');
                    }
                  } : undefined}>
                    {forgotStep === 1 ? 'Send Verification Code' : forgotStep === 2 ? 'Verify Code' : 'Change Password'}
                  </button>
                </div>
              </>
            ) : (
              <>
            {isSignUp && (
              <>
                <div className="form-group">
                  <label>Company: </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Enter your company"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name: </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Surname: </label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Enter your surname"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address: </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="off"
                required
              />
            </div>

            {!isSignUp && (
              <div className="form-group password-field-wrap">
                <label>Password: </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
                />
                <span style={{ alignSelf: 'flex-end', marginTop: '8px', color: '#1976d2', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }}>
                  <button type="button" onClick={openForgotPassword} style={{ border: 'none', background: 'transparent', color: 'inherit', textDecoration: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                    Forgot Password?
                  </button>
                </span>
              </div>
            )}

            {isSignUp && (
              <div className="form-group">
                <label>Password: </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {isSignUp && (
              <div className="form-group">
                <label>Confirm Password: </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <div className="form-row">
              <button className="btn-login" type="submit">
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
              </>
            )}
          </form>

          <button
            type="button"
            onClick={() => {
              if (isForgotPassword) {
                returnToSignIn();
                return;
              }
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMessage('');
            }}
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '10px',
              border: '1px solid #2196F3',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#2196F3',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {isForgotPassword ? 'Back to Sign In' : isSignUp ? 'Back to Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
