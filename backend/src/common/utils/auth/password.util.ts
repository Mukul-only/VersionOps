import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty');
  }

  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify password against hash
 * Returns false instead of throwing for safer auth flow
 */
export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  if (!password || !hash) return false;

  return bcrypt.compare(password, hash);
};
