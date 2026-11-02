/**
 * The listing fields a user is allowed to set. Anything else in the request
 * body (status, submitted_by, deleted_at, is_admin_post, payment fields...)
 * is dropped before it reaches a service role insert or update.
 *
 * Adding a listing field? Add it here too (see the dcg-add-field skill).
 */
export const EDITABLE_SUBMISSION_FIELDS = [
  'title',
  'description',
  'category',
  'attendance_type',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'zip_code',
  'instructor_name',
  'provider_name',
  'contact_email',
  'contact_phone',
  'price',
  'ce_credits',
  'registration_url',
  'image_url',
] as const;

export type EditableSubmissionField = (typeof EDITABLE_SUBMISSION_FIELDS)[number];
export type SubmissionInput = Partial<Record<EditableSubmissionField, unknown>>;

export function pickSubmissionFields(input: unknown): SubmissionInput {
  const out: SubmissionInput = {};
  if (!input || typeof input !== 'object') return out;
  const source = input as Record<string, unknown>;
  for (const key of EDITABLE_SUBMISSION_FIELDS) {
    if (key in source) out[key] = source[key];
  }
  return out;
}
