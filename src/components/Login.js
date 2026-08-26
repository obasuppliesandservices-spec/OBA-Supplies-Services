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

  const returnToSignIn = () => {
    setIsSignUp(false);
    setCompany('');
    setName('');
    setSurname('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
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

        .forgot-password {
          align-self: flex-end;
          margin-top: 8px;
          border: none;
          background: transparent;
          color: #1976d2;
          font-size: 13px;
          font-weight: 500;
          text-decoration: underline;
          cursor: pointer;
          padding: 0;
        }

        .forgot-password:hover {
          color: #0d47a1;
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
          <h3>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h3>
          <p>{isSignUp ? 'Sign up to continue' : 'Please sign in to your account'}</p>
          
          {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
          {successMessage && <p style={{color: '#04ab0c', marginTop: '10px'}}>{successMessage}</p>}
          
          <form onSubmit={submit} autoComplete="off">
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
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => setError('Password reset is not available yet.')}
                >
                  Forgot Password?
                </button>
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
          </form>

          <button
            type="button"
            onClick={() => {
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
            {isSignUp ? 'Back to Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
