export function formatCurrency(amount: string | number | undefined | null): string {
  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === '') {
    return '₦0.00'
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Check if parsing resulted in NaN
  if (isNaN(numAmount)) {
    return '₦0.00'
  }
  
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

