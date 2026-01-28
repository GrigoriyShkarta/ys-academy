import axiosInstance from '@/services/axios';
import { Student } from '@/components/Students/interface';

interface SubscribeStudentParams {
  userId: number;
  subscriptionId: number;
  slots: string[];
}

interface UpdateStudentParams {
  userSubscriptionId: number;
  subscriptionId: number;
  slots: string[];
  paymentStatus: string;
  amount?: number;
}

export const getStudent = async (id: number): Promise<Student> => {
  const { data } = await axiosInstance.get(`/user/${id}`);
  return data;
};

export const updateStudent = async (student: Student) => {
  const formData = new FormData();

  // обязательные / базовые
  formData.append('email', student.email);
  formData.append('name', student.name);
  formData.append('telegram', student?.telegram ?? '');
  formData.append('instagram', student?.instagram ?? '');
  formData.append('city', student?.city ?? '');
  formData.append('isActive', student.isActive.toString());
  formData.append('accessExpiryDate', student?.accessExpiryDate ?? '');
  formData.append(
    'birthDate',
    student?.birthDate
      ? typeof student.birthDate === 'string'
        ? student.birthDate
        : student?.birthDate.toISOString()
      : ''
  );
  formData.append('musicLevel', student?.musicLevel ?? '');
  formData.append('vocalExperience', student?.vocalExperience ?? '');
  formData.append('goals', student?.goals ?? '');

  // фото (важно: только если это File)
  if (student.photo instanceof File) {
    formData.append('photo', student.photo);
  }
  if (student?.password) {
    formData.append('password', student.password);
  }

  const { data } = await axiosInstance.patch(`/user/${student.id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const subscribeStudent = async ({
  userId,
  subscriptionId,
  slots,
}: SubscribeStudentParams): Promise<void> => {
  const body = {
    userId,
    subscriptionId,
    lessonDates: slots,
  };

  const { data } = await axiosInstance.post('/subscriptions/subscribe', body);
  return data;
};

export const updateSubscribeStudent = async ({
  userSubscriptionId,
  subscriptionId,
  slots,
  amount,
  paymentStatus,
}: UpdateStudentParams): Promise<void> => {
  const body = {
    subscriptionId,
    amount,
    paymentStatus,
    lessonDates: slots,
  };

  const { data } = await axiosInstance.patch(
    `/subscriptions/subscribe/${userSubscriptionId}`,
    body
  );
  return data;
};

export const deleteSubscription = async (subscriptionId: number) => {
  const { data } = await axiosInstance.delete(`/subscriptions/subscribe/${subscriptionId}`);
  return data;
};

export const updateSubscriptionPaymentStatus = async (
  subscriptionId: number,
  paymentStatus: string,
  amount?: number
) => {
  const { data } = await axiosInstance.patch(`/subscriptions/${subscriptionId}/payment-status`, {
    paymentStatus,
    amount,
  });

  return data;
};

export const updateLessonStatusInSubscription = async (
  lessonId: number,
  status: string,
  transferredTo?: string
) => {
  const { data } = await axiosInstance.patch(`/subscriptions/${lessonId}/lesson-status`, {
    status,
    transferredTo,
  });

  return data;
};

export const readNotifications = async (notificationsIds: number[]) => {
  const { data } = await axiosInstance.patch(`/user/notifications/`, { notificationsIds });
  return data;
};

export const deleteNotification = async (notificationId: number) => {
  const { data } = await axiosInstance.delete(`/user/notifications/${notificationId}`);
  return data;
};