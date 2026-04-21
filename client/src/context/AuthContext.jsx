import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me()
      .then(({ user }) => {
        setUser(user);
        return api.auth.users();
      })
      .then(({ users }) => setUsers(users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refreshUsers() {
    const { users } = await api.auth.users();
    setUsers(users);
  }

  async function login(credentials) {
    const { user } = await api.auth.login(credentials);
    setUser(user);
    await refreshUsers();
    return user;
  }

  async function register(data) {
    const { user } = await api.auth.register(data);
    setUser(user);
    await refreshUsers();
    return user;
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
    setUsers([]);
  }

  return (
    <AuthContext.Provider value={{ user, users, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
