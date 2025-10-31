import { Loader2 } from 'lucide-react';

export default function Loader() {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="animate-spin h-[80px] w-[80px]" />
    </div>
  );
}
