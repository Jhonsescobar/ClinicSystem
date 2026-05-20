import { ZodError } from 'zod'

export function getZodErrors(error: ZodError) {
  return error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export function formatZodError(error: ZodError) {
  return error.issues.map(issue => issue.message).join(', ')
}
