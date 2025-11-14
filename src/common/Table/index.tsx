'use client';

import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import Pagination from '@/common/Pagination';
import { useTranslations } from 'next-intl';

interface Column<T> {
  key: string;
  label: string | ReactNode;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  showDeleteIcon?: boolean;
  accept?: string;
  totalPages?: number;
  currentPage?: number;
  selectedIds?: number[];
  showFromDevice?: boolean;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  handleDelete?: () => void;
  handleClickRow?: (item: T) => void;
  handleClickFromDevice?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  currentPage,
  totalPages,
  showDeleteIcon,
  showFromDevice,
  selectedIds,
  onPageChange,
  onSearchChange,
  handleDelete,
  handleClickRow,
  handleClickFromDevice,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('Common');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onSearchChange?.(value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-4">
        <Input
          placeholder={t('search')}
          value={search}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {showDeleteIcon && (
          <Button className="bg-destructive hover:bg-destructive/80" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        {showFromDevice && handleClickFromDevice && (
          <Button className="bg-accent hover:bg-accent/80" onClick={handleClickFromDevice}>
            {t('from_device')}
          </Button>
        )}
      </div>

      {/* Таблица */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 &&
              data.map(item => (
                <TableRow
                  onClick={() => (handleClickRow ? handleClickRow(item) : undefined)}
                  key={item.id || JSON.stringify(item)}
                  aria-selected={selectedIds?.includes(item.id)}
                  data-selected={selectedIds?.includes(item.id) ? 'true' : 'false'}
                  className={cn(
                    handleClickRow ? 'cursor-pointer' : '',
                    'transition-shadow duration-150 ease-in-out',
                    selectedIds?.includes(item.id) ? 'bg-muted' : ''
                  )}
                >
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item) : item[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {currentPage && totalPages && onPageChange && data.length > 0 ? (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      ) : null}
    </div>
  );
}
