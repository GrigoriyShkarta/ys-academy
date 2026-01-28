import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DataTable from '@/common/Table';
import { ForecastStudent } from '../types';

interface ForecastTableProps {
  rfT: any;
  hasHiddenItems: boolean;
  onShowAllHidden: () => void;
  data: ForecastStudent[];
  columns: any[];
  onSearchChange: (v: string) => void;
}

export function ForecastTable({
  rfT,
  hasHiddenItems,
  onShowAllHidden,
  data,
  columns,
  onSearchChange
}: ForecastTableProps) {
  return (
    <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
      <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {rfT('expected_payments') || 'Очікувані оплати'}
          </CardTitle>
          {hasHiddenItems && (
            <button 
              onClick={onShowAllHidden}
              className="text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full transition-all"
            >
              Показати всіх прихованих
            </button>
          )}
        </div>
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
