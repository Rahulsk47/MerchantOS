export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function formatINRShort(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(2) + 'Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(2) + 'L';
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount.toLocaleString('en-IN');
}

export function cn(...classes: (string | false | 0 | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
