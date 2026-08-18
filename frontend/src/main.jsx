import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// Global fetch interceptor to append authorization headers
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem("token");
  
  if (token) {
    config = config || {};
    config.headers = config.headers || {};
    
    // Normalize headers and add Authorization header
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      const hasAuth = config.headers.some(h => h[0].toLowerCase() === 'authorization');
      if (!hasAuth) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      if (!config.headers['Authorization'] && !config.headers['authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  const response = await originalFetch(resource, config);
  
  // If unauthorized response is received, logout and redirect (unless on public route)
  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password"
  ];

  if (response.status === 401) {
    const pathname = window.location.pathname;

    if (!publicRoutes.includes(pathname)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }
  
  return response;
};

import { GoogleOAuthProvider } from '@react-oauth/google';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

const GOOGLE_CLIENT_ID = "763375667270-mf5mefl5t1u2rhie1oaia0e232eulcbr.apps.googleusercontent.com";

const msalConfig = {
  auth: {
    clientId: "YOUR_MICROSOFT_CLIENT_ID",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};
const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
