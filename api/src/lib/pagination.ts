export interface CursorData {
  offset: number;
  limit: number;
  sort?: string;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    limit: number;
    nextCursor?: string;
    prevCursor?: string;
    total?: number;
  };
}

/**
 * Encode cursor data to base64 string
 */
export const encodeCursor = (data: CursorData): string => {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString('base64url');
};

/**
 * Decode base64 cursor string to cursor data
 * Returns null if invalid
 */
export const decodeCursor = (cursor: string): CursorData | null => {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf-8');
    const data = JSON.parse(json) as CursorData;

    // Validate required fields
    if (typeof data.offset !== 'number' || typeof data.limit !== 'number') {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

/**
 * Build pagination links for response
 */
export const buildPaginationLinks = (
  baseUrl: string,
  currentCursor: CursorData,
  hasMore: boolean,
  total?: number
): { next?: string; prev?: string } => {
  const links: { next?: string; prev?: string } = {};

  // Previous cursor (if not at beginning)
  if (currentCursor.offset > 0) {
    const prevOffset = Math.max(0, currentCursor.offset - currentCursor.limit);
    const prevData: CursorData = {
      ...currentCursor,
      offset: prevOffset,
    };
    links.prev = `${baseUrl}?cursor=${encodeCursor(prevData)}`;
  }

  // Next cursor (if there are more results)
  if (hasMore) {
    const nextData: CursorData = {
      ...currentCursor,
      offset: currentCursor.offset + currentCursor.limit,
    };
    links.next = `${baseUrl}?cursor=${encodeCursor(nextData)}`;
  }

  return links;
};

/**
 * Parse pagination parameters from query
 */
export const parsePaginationParams = (
  cursor?: string,
  limitParam?: string,
  maxLimit: number = 100,
  defaultLimit: number = 20
): { cursorData: CursorData; error?: string } => {
  // If cursor provided, decode it
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      return {
        cursorData: { offset: 0, limit: defaultLimit },
        error: 'Invalid cursor format',
      };
    }
    return { cursorData: decoded };
  }

  // Otherwise use offset/limit
  const limit = limitParam ? parseInt(limitParam, 10) : defaultLimit;

  if (isNaN(limit) || limit < 1 || limit > maxLimit) {
    return {
      cursorData: { offset: 0, limit: defaultLimit },
      error: `limit must be between 1 and ${maxLimit}`,
    };
  }

  return {
    cursorData: { offset: 0, limit },
  };
};
