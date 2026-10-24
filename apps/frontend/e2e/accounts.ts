// Seed accounts (apps/backend/src/scripts/seed). The admin is SUPERADMIN_EMAIL /
// SUPERADMIN_PASSWORD from apps/backend/.env; override with E2E_ADMIN_EMAIL /
// E2E_ADMIN_PASSWORD when your .env differs from .env.example.
export const API = "http://localhost:4050/api"

export const AUTHOR = { email: "caffeinatedduck@example.com", password: "password1" }
export const OTHER = { email: "deepduckthoughts@example.com", password: "password2" }
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "adminpassword",
}
