const API_URL = "http://127.0.0.1:8000";

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function registerUser(name, email, password, confirmPassword) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, confirm_password: confirmPassword }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed");
  }
  return await response.json();
}

export async function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) { logoutUser(); return null; }
    const data = await response.json();
    localStorage.setItem("user", JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Network/session error checking user:", error);
    return null;
  }
}

export async function updateProfile(profileData) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update profile");
  }
  const data = await response.json();
  localStorage.setItem("user", JSON.stringify(data));
  return data;
}

export async function uploadAvatar(file) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_URL}/auth/me/avatar`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload avatar");
  }
  const data = await response.json();
  localStorage.setItem("user", JSON.stringify(data));
  return data;
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export async function googleOAuthLogin(token) {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Google login failed");
  }
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function microsoftOAuthLogin(token) {
  const response = await fetch(`${API_URL}/auth/microsoft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Microsoft login failed");
  }
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}


