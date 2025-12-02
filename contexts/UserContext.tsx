import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

interface UserContextType {
  user: User | null;
  updateUser: (updatedUser: User) => Promise<void>;
  login: (name: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    const savedUser = await authService.updateUser(updatedUser);
    setUser(savedUser);
  }, []);

  const login = useCallback((name: string) => {
    authService.loginAsGuest(name);
    // Imediatamente atualiza o estado para transição suave
    setUser({
        id: 'local-user',
        name: name,
        email: 'local@device',
        styleProfile: 'Comunicador em desenvolvimento.',
        coachStyle: 'encouraging',
    });
  }, []);

  const logout = useCallback(() => {
      authService.logoutUser();
      setUser(null);
  }, []);

  const value = { user, updateUser, login, logout };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};