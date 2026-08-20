import { useState } from 'react'
import { AuthContext } from './contextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  function signIn(authenticatedUser) {
    setUser(authenticatedUser)
  }

  function signOut() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

