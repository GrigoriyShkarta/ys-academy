'use client';

import { useEffect } from 'react';
import { YS_TOKEN } from '@/lib/consts';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/providers/UserContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import ava from '../../../public/assets/ys-ava.jpg';
import { useTranslations } from 'next-intl';

export default function MainPage() {
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations('Main');

  useEffect(() => {
    const token = localStorage.getItem(YS_TOKEN);
    if (!token) router.push('/');
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const features = [
    {
      title: 'courses',
      icon: BookOpen,
      href: '/main/materials/course',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'lessons',
      icon: FileText,
      href: '/main/materials/lessons',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'students',
      icon: Users,
      href: '/main/students',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  if (user?.role === 'student') {
    return (
      <div className="p-8 mt-18 sm:mt-0 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] space-y-8 text-center w-full h-screen max-h-screen overflow-auto">
        <Image src={ava.src} alt="avatar" width={580} height={580} className="rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 max-w-2xl"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('welcome_back')}, {`${user.name}`}!
          </h1>
          <p className="text-xl text-muted-foreground">{t('continue_learning_prompt')}</p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/main/profile">
              <Button className="bg-accent">{t('my_profile')}</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default view for super_admin (and others if not specified)
  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 mt-18 sm:mt-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold tracking-tight">{t('welcome_title')}</h1>
        <p className="text-muted-foreground text-lg">{t('welcome_description')}</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {features.map(feature => (
          <motion.div key={feature.title} variants={item}>
            <Link href={feature.href}>
              <Card className="h-full flex hover:shadow-md transition-shadow cursor-pointer border-muted/60">
                <CardHeader className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.bgColor}!`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle>{t(feature.title)}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
