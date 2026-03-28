import { QueryOptionsDto } from '../dto/query-options.dto';

/**
 * Generic Prisma query builder that supports:
 * - Pagination (`skip`, `take`)
 * - Search across multiple fields (`searchableFields`)
 * - Sorting (`sortBy`, `order`)
 * - Dynamic filters (`filters`)
 */
export function buildQueryArgs<
  T extends Record<string, any>,
  WhereInput extends Record<string, unknown> = Record<string, unknown>,
>(
  dto: QueryOptionsDto,
  searchableFields: (keyof T)[] = [],
): {
  skip: number;
  take: number;
  where?: WhereInput;
  orderBy: Record<string, 'asc' | 'desc'>;
} {
  const skip = Number(dto.skip ?? 0);
  const take = Number(dto.take ?? 20);
  const sortBy: string = dto.sortBy || 'createdAt';
  const order: 'asc' | 'desc' = dto.order || 'desc';
  const search = dto.search?.trim();

  // --- Safe parse for filters ---
  let filters: Record<string, unknown> = {};
  if (dto.filters) {
    try {
      const parsed: unknown =
        typeof dto.filters === 'string' ? JSON.parse(dto.filters) : dto.filters;
      if (parsed && typeof parsed === 'object') {
        filters = parsed as Record<string, unknown>;
      }
    } catch (error) {
      console.warn('Invalid filters JSON:', dto.filters, error);
    }
  }

  const where: Record<string, unknown> = {};

  // --- Search across multiple fields (case-insensitive) ---
  if (search && searchableFields.length > 0) {
    where.OR = searchableFields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    }));
  }

  // --- Helper to normalize values ---
  const normalizeValue = (val: unknown): unknown => {
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();

      // Boolean normalization
      if (lower === 'true') return true;
      if (lower === 'false') return false;

      // Date string detection and conversion
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        // Convert "YYYY-MM-DD" to ISO DateTime with timezone
        return new Date(val + 'T00:00:00.000Z').toISOString();
      }

      // ISO DateTime string validation
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }
    return val;
  };

  // --- Apply filters (exact matches only) ---
  for (const [key, rawValue] of Object.entries(filters)) {
    if (rawValue === undefined || rawValue === null || rawValue === '')
      continue;

    const value = normalizeValue(rawValue);

    // Handle arrays -> `in` operator
    if (Array.isArray(value)) {
      where[key] = { in: value };
      continue;
    }

    // Default exact match
    where[key] = value;
  }

  const finalWhere =
    Object.keys(where).length > 0 ? (where as WhereInput) : undefined;

  return {
    skip,
    take,
    where: finalWhere,
    orderBy: { [sortBy]: order },
  };
}
