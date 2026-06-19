/**
 * AppContext — global auth and API state.
 * Vite uses VITE_ prefix for env vars (not REACT_APP_).
 * In dev, Vite's server.proxy handles /api → backend, so the default
 * of "/api/v2/" works without any env var needed.
 */
import AuthService from "../services/authService";
import React, { useContext, useEffect, useState } from "react";
import AxiosConfig from "../services/axiosConfig";
import { getPermissions } from "../utilities/permissions";

const AuthContext = React.createContext({});
const DataServiceContext = React.createContext({});

export const useAuth = () => useContext(AuthContext);
export const useAPI = () => useContext(DataServiceContext);

// Vite env var prefix is VITE_ (not REACT_APP_)
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v2/";

const axios = new AxiosConfig(API_BASE_URL);
const auth = new AuthService(axios);

export const StateProvider = (props) => {
  const [user, setUser] = useState(auth.userData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.onUserUpdate((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const login = (username, password) => auth.login(username, password);
  const logout = () => auth.logout();
  const createUser = (firstName, lastName, username, password, access = 0) =>
    auth.signup(firstName, lastName, username, password, access);

  return (
    <DataServiceContext.Provider value={{ api: axios }}>
      <AuthContext.Provider
        value={{
          user,
          createUser,
          login,
          logout,
          ...getPermissions(user ? user.access : 0),
        }}
      >
        {!loading && props.children}
      </AuthContext.Provider>
    </DataServiceContext.Provider>
  );
};
