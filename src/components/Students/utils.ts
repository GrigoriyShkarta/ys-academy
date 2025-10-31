import { UseFormReturn } from 'react-hook-form';
import { CreateStudentFormValues } from '@/components/Students/studentsSchema';

export const generatePassword = (length: number, form: UseFormReturn<CreateStudentFormValues>) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.setValue('password', pass, { shouldValidate: true });
};
