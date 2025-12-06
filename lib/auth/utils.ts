import bcrypt from "bcryptjs";

/**
 * Hashea una contraseña usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verifica una contraseña contra un hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Valida que la fecha de nacimiento corresponda a una persona mayor de 13 años
 */
export function validateAge(dateOfBirth: { month: string; day: string; year: string }): boolean {
  const birthDate = new Date(
    parseInt(dateOfBirth.year),
    parseInt(dateOfBirth.month) - 1,
    parseInt(dateOfBirth.day)
  );
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 13;
  }
  
  return age >= 13;
}







