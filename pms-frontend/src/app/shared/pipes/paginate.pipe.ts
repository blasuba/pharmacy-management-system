import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true,
  pure: true
})
export class PaginatePipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, page: number = 1, pageSize: number = 10): T[] {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }
    if (pageSize <= 0) {
      return items;
    }
    const currentPage = Math.max(1, page);
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }
}
