/** Recursively turn BSON Dates into ISO strings for JSON responses. */
export function toApiJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v instanceof Date ? v.toISOString() : v)),
  ) as T
}

export function stripId<T extends { _id: unknown }>(
  doc: T,
): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc
  return { id: String(_id), ...(rest as Omit<T, '_id'>) }
}
