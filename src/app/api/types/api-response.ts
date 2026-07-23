export type PageResultApiResponse<T> = {
	data: T[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
	hasNext: boolean;
	hasPrevious: boolean;
};

/** Alias para compatibilidade com codigo legado. */
export type PaginatedApiResponse<T> = PageResultApiResponse<T>;
