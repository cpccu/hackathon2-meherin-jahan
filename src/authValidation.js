export function detailsError(name, department) {
  return !name.trim() || !department ? 'Enter your full name and choose a department.' : ''
}

export function accessError(email, password, confirmation) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 6) {
    return 'Enter a valid email and a password of at least six characters.'
  }
  return password !== confirmation ? 'Your passwords do not match.' : ''
}
