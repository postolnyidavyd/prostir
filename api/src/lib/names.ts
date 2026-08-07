export function formatDisplayName(firstName: string, lastName: string): string {
  return `${lastName} ${firstName.charAt(0).toUpperCase()}.`;
}
