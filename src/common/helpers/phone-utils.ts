export function convertPhone(phone: string) {
  const newPhone = phone.replace(/[^0-9]/g, '');
  return `+${newPhone}`;
}
