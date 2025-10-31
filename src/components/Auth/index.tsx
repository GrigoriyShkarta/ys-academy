import Image from 'next/image';
import { useTranslations } from 'next-intl';
import FormAuth from '@/components/Auth/Form';
import logo from '../../../public/assets/logo.png';

export function Auth() {
  const t = useTranslations('Auth');

  return (
    <div className="flex flex-col items-center justify-center max-sm:justify-start min-h-screen w-full bg-gradient-to-b from-gray-900 to-gray-800 px-4 py-8">
      <div className="flex flex-col gap-3 items-center mb-6 sm:mb-12 w-full max-w-sm max-sm:mt-[5vh]">
        <div className="relative">
          <Image
            src={logo}
            alt="logo"
            width={120}
            height={120}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
            priority
          />
        </div>
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl lg:text-nowrap font-bold text-center leading-tight">
          YS VOCAL ACADEMY
        </h1>
        <p className="text-gray-300 text-sm sm:text-base text-center mt-2">
          {t('professional_vocal_education')}
        </p>
      </div>

      <FormAuth />

      <div className="mt-8 sm:mt-12 text-center">
        <p className="text-gray-400 text-xs sm:text-sm">
          {`© 2025 YS Vocal Academy. ${t('all_rights_reserved')}`}
        </p>
      </div>
    </div>
  );
}
