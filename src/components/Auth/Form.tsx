'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoginFormValues, loginSchema } from '@/components/Auth/authSchema';
import { YS_TOKEN } from '@/lib/consts';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { onSubmit } from '@/components/Auth/action';

export default function FormAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Auth');

  useEffect(() => {
    const token = localStorage.getItem(YS_TOKEN);

    if (token) {
      window.location.href = '/main';
    }
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema(t)),
    reValidateMode: 'onChange',
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto h-fit">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t('login')}</CardTitle>
        <CardDescription className="text-center">{t('enter_credentials')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(data => onSubmit(data, setIsLoading, form))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your@email.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="••••••"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        {...field}
                        className="pr-10"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root?.message && (
              <p className="text-red-500 text-sm mb-2 text-center">
                {t(form.formState.errors.root.message)}
              </p>
            )}

            <Button
              type="submit"
              className="w-full cursor-pointer bg-accent"
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('logging_in')}
                </>
              ) : (
                t('sign_in')
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
