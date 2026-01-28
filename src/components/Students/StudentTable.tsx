'use client';

import { ReactNode, useMemo, useState } from 'react';
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
import { Student } from '@/components/Students/interface';

export interface Column {
  key: string;
  label: string;
  render?: (student: Student) => ReactNode;
}

interface StudentsTableProps {
  data: Student[];
  columns: Column[];
  rowsPerPage?: number;
}

export default function StudentsTable({ data, columns, rowsPerPage = 5 }: StudentsTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    return data?.filter(student => student.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="space-y-4 w-full">
      {/* Поиск */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Поиск студента..."
          value={search}
          onChange={e => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="max-w-sm"
        />
      </div>

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
            {paginatedData.map(student => (
              <TableRow key={student.id}>
                {columns.map(col => (
                  <TableCell key={col.key}>{col.render && col.render(student)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          Назад
        </Button>

        <span className="text-sm text-muted-foreground">
          Сторінка {page} з {totalPages}
        </span>

        <Button
          variant="outline"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(p => p + 1)}
        >
          Вперед
        </Button>
      </div>
    </div>
  );
}
