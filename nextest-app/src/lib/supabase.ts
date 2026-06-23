export function getAuthToken(): string | null {
  return localStorage.getItem("qacopilot_auth_token");
}
