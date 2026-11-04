type SubmissionAction = 'remove' | 'restore';

export type SubmissionActionResult = { ok: true } | { ok: false; error: string };

export async function postSubmissionAction(
  id: string,
  action: SubmissionAction
): Promise<SubmissionActionResult> {
  try {
    const response = await fetch(`/api/submissions/${id}/${action}`, { method: 'POST' });
    const data = (await response.json().catch(() => ({}))) as { error?: unknown };
    if (!response.ok) {
      const message =
        typeof data.error === 'string' && data.error.length > 0
          ? data.error
          : `Failed to ${action} listing`;
      return { ok: false, error: message };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: `Failed to ${action} listing` };
  }
}
