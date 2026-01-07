import axiosInstance from '@/services/axios';

export const addLessonRecording = async (lessonId: number, recordingUrl: string) => {
  const { data } = await axiosInstance.patch(`subscriptions/lessons/${lessonId}/recording`, {
    recordingUrl,
  });
  return data;
};
