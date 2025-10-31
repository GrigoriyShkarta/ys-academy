'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
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
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  handleDelete?: () => void;
  handleClickRow?: (item: T) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  currentPage,
  totalPages,
  onPageChange,
  onSearchChange,
  handleDelete,
  showDeleteIcon,
  handleClickRow,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('Common');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      {/* Поиск */}
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
            {data.map(item => (
              <TableRow
                onClick={() => (handleClickRow ? handleClickRow(item) : undefined)}
                key={item.id || JSON.stringify(item)}
                className={`${handleClickRow ? 'cursor-pointer' : ''}`}
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

      {currentPage && totalPages && onPageChange && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
