interface IPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
}