import Image from 'next/image';
import { Module } from '@/components/Materials/utils/interfaces';
import logo from '../../../../../public/assets/logo.png';

interface Props {
  modules: Module[];
}

export default function ModuleList({ modules }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
      {modules.map(module => (
        <div
          key={module.id}
          className="rounded-lg overflow-hidden border hover:shadow-md transition"
        >
          <Image src={module?.img ?? logo} height={48} alt={module.title} className="w-full" />
        </div>
      ))}
    </div>
  );
}
