import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import DataTable from '@/common/Table';

interface MainReportTableProps {
  viewMode: 'fact' | 'forecast';
  rfT: any;
  hasHiddenItems: boolean;
  onShowAllHidden: () => void;
  data: any[];
  columns: any[];
  onSearchChange: (v: string) => void;
}

export function MainReportTable({
  viewMode,
  rfT,
  hasHiddenItems,
  onShowAllHidden,
  data,
  columns,
  onSearchChange
}: MainReportTableProps) {
  return (
    <Card className="lg:col-span-2 border-none shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem]">
      <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {viewMode === 'fact' ? rfT('revenue_per_student') : (rfT('expected_payments') || 'Очікувані оплати')}
            </CardTitle>
          </div>
          {viewMode === 'forecast' && hasHiddenItems && (
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
