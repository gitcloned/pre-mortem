import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { upsertUser } from '../lib/firestore'
import { Nav } from '../components/Nav'

export function Auth() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = location.state?.from?.pathname || '/dashboard'

  const afterAuth = async (user) => {
    await upsertUser(user.uid, user.displayName || name, user.email)
    navigate(redirect, { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: name })
        await afterAuth(user)
      } else {
        const { user } = await signInWithEmailAndPassword(auth, email, password)
        await afterAuth(user)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      const { user } = await signInWithPopup(auth, googleProvider)
      await afterAuth(user)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Nav />
      <div className="auth-wrap">
        <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-row">
              <label>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="btn" style={{width:'100%',marginTop:8}} type="submit">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>
        <div className="divider">or</div>
        <button className="google-btn" onClick={handleGoogle}>
          <span>G</span> Continue with Google
        </button>
        <div className="auth-toggle">
          {mode === 'login'
            ? <>Don't have an account? <a href="#" onClick={e=>{e.preventDefault();setMode('signup')}}>Sign up</a></>
            : <>Already have an account? <a href="#" onClick={e=>{e.preventDefault();setMode('login')}}>Log in</a></>}
        </div>
      </div>
    </>
  )
}
