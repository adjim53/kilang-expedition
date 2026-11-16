/** Fields of an admin user that are safe to send to the browser (never the password hash). */
export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  active: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
} as const;
