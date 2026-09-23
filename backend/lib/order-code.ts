import crypto from 'crypto';

export function generateOrderCode(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 6 alphanumeric uppercase chars
  const randomSuffix = crypto.randomBytes(4).toString('hex').substring(0, 6).toUpperCase();
  return `PF-${dateStr}-${randomSuffix}`;
}
