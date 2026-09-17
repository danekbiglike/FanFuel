export type AuthFieldError = "required" | "email" | "passwordShort" | "passwordLong" | "name";

export function validateEmail(value: string): AuthFieldError | undefined {
  const email = value.trim();
  if (!email) return "required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
}

export function validatePassword(value: string, register: boolean): AuthFieldError | undefined {
  if (!value) return "required";
  if (!register) return;
  if (Array.from(value).length < 8) return "passwordShort";
  if (new TextEncoder().encode(value).length > 72) return "passwordLong";
}

export function validateName(value: string): AuthFieldError | undefined {
  const length = Array.from(value.trim()).length;
  if (!length) return "required";
  if (length < 2 || length > 80) return "name";
}
