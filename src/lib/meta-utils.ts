export function getProgressColor(percentage: number): string {
  if (percentage < 50) return "bg-error";
  if (percentage < 80) return "bg-warning";
  return "bg-success";
}

export function getProgressTextColor(percentage: number): string {
  if (percentage < 50) return "text-error";
  if (percentage < 80) return "text-warning";
  return "text-success";
}
