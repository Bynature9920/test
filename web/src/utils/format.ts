export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(numAmount)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatPhoneNumber(phone: string): string {
  // Format Nigerian phone numbers
  if (phone.startsWith('+234')) {
    return phone.replace('+234', '0')
  }
  return phone
}

