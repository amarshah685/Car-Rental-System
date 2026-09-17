import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSignUp(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone: phone,
        role: 'customer',
      })
      if (profileError) {
        setError('Signed up, but profile creation failed: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onAuth()
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onAuth()
  }

  return (
    <div className="auth-shell">
      <h2>{isSignUp ? 'Create an account' : 'Welcome back'}</h2>
      <p className="auth-sub">
        {isSignUp ? 'Sign up to start booking cars' : 'Log in to manage your bookings'}
      </p>

      <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p className="auth-switch">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button className="link-btn" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}

export default Auth