import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DataTable from '@/common/Table';
import { StudentRevenue } from '../types';

interface FactTableProps {
  rfT: any;
  data: StudentRevenue[];
  columns: any[];
  onSearchChange: (v: string) => void;
}

export function FactTable({
  rfT,
  data,
  columns,
  onSearchChange
}: FactTableProps) {
  return (
    <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
      <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {rfT('revenue_per_student')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <DataTable 
          data={data} 
          columns={columns} 
          onSearchChange={onSearchChange}
        />
      </CardContent>
    </Card>
  );
}
