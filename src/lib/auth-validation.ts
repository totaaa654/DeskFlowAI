const COMPANY_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Enter your company email address.";
  if (!COMPANY_EMAIL_PATTERN.test(email.trim())) return "Enter a valid company email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Enter your password.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

export function validateNewPassword(password: string): string | null {
  const basicError = validatePassword(password);
  if (basicError) return basicError;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Use uppercase, lowercase, and at least one number.";
  }
  return null;
}
