import axiosInstance from '@/services/axios';

export const addLessonRecording = async (lessonId: number, recordingUrl: string, userId: number) => {
  const { data } = await axiosInstance.patch(`subscriptions/lessons/${lessonId}/recording`, {
    recordingUrl,
    userId,
  });
  return data;
};
