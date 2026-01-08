'use client';

import { useEffect } from 'react';
import { YS_TOKEN } from '@/lib/consts';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Users, Layers, MonitorPlay } from 'lucide-react';
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
      href: '/main/materials/courses',
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

  const studentFeatures = [
    {
      title: 'my_courses',
      icon: Layers,
      href: '/main/courses',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'my_lesson_recordings',
      icon: MonitorPlay,
      href: '/main/lesson-recording',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (user?.role === 'student') {
    return (
      <div className="p-8 mt-18 sm:mt-0 max-w-7xl mx-auto flex flex-col items-center sm:justify-center space-y-8 text-center w-full h-screen max-h-screen overflow-auto">
        <Image src={ava.src} alt="avatar" width={580} height={580} className="rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 max-w-2xl w-full flex flex-col items-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('welcome_back')}, {`${user.name}`}!
          </h1>
          <p className="text-xl text-muted-foreground">{t('continue_learning_prompt')}</p>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 w-full max-w-2xl"
          >
            {studentFeatures.map((feature) => (
              <motion.div key={feature.title} variants={item} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={feature.href}>
                  <Card className="h-40 flex flex-col items-center justify-center p-6 hover:shadow-lg transition-all cursor-pointer border-muted/60 gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.bgColor} transition-colors`}>
                       <feature.icon className={`w-6 h-6 ${feature.color}`} />
                     </div>
                     <h3 className="text-lg font-semibold">{t(feature.title)}</h3>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
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
