const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/v1";

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePhoto?: string;
  userType: "student" | "founder" | "educator" | "admin" | "super_admin";
  college?: string;
  city?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kiri_learning_token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("kiri_learning_user");
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || "An API error occurred.");
  }
  
  return data;
}

/**
 * Triggers developer mock logins
 */
export async function mockLogin(
  role: "student" | "instructor" | "founder",
  customDetails?: {
    displayName: string;
    email: string;
    college: string;
    city: string;
  }
) {
  let token = "";
  let body: any = {};

  if (customDetails) {
    token = `mock-student-token-${customDetails.email}`;
    body = {
      idToken: token,
      displayName: customDetails.displayName,
      college: customDetails.college,
      city: customDetails.city,
      userType: role === "instructor" ? "educator" : role === "founder" ? "founder" : "student",
    };
  } else {
    token = role === "student" ? "mock-student-token" : "mock-instructor-token";
    body = {
      idToken: token,
      displayName: role === "student" ? "Priya Sharma" : "Dr. Ramesh Kumar",
      college: role === "student" ? "Pune Institute of Computer Technology" : "PICT Pune",
      city: role === "student" ? "Pune" : "Pune",
      userType: role === "instructor" ? "educator" : "student",
    };
  }
  
  const data = await fetchApi("/auth/firebase-login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (data.token && data.user) {
    localStorage.setItem("kiri_learning_token", data.token);
    localStorage.setItem("kiri_learning_user", JSON.stringify(data.user));
    return data.user;
  }
  
  throw new Error("Mock authentication failed.");
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("kiri_learning_token");
    localStorage.removeItem("kiri_learning_user");
  }
}
