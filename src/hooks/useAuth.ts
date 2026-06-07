const AUTH_KEY = "immeuble_auth_v1";

export function checkAuth(): boolean {
  return localStorage.getItem(AUTH_KEY) === "ok";
}

export function login(password: string): boolean {
  // Mot de passe par défaut : immeuble2024
  // Tu peux le modifier ci-dessous
  if (password === "immeuble2024") {
    localStorage.setItem(AUTH_KEY, "ok");
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export function initAuth(): boolean {
  return checkAuth();
}
