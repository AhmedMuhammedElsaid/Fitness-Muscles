export function firstError(errors: unknown[]): string | undefined {
  const issue = errors[0];
  if (!issue) return undefined;
  if (typeof issue === 'string') return issue;
  if (
    typeof issue === 'object' &&
    'message' in issue &&
    typeof (issue as { message: unknown }).message === 'string'
  ) {
    return (issue as { message: string }).message;
  }
  return undefined;
}
