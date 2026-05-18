export interface ApiResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T | null;
  Errors: string[] | null;
}

export interface PaginatedResponse<T = any> {
  Success: boolean;
  Message: string;
  Object: T[];
  PageNumber: number;
  PageSize: number;
  TotalSize: number;
  Errors: null;
}

export interface JwtPayload {
  sub: string;
  role: 'AUTHOR' | 'READER';
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface ArticleFilters {
  category?: string;
  author?: string;
  q?: string;
}
