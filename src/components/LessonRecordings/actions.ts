import axiosInstance from '@/services/axios';

export const addLessonRecording = async (lessonId: number, recordingUrl: string, userId: number) => {
  const { data } = await axiosInstance.patch(`subscriptions/lessons/${lessonId}/recording`, {
    recordingUrl,
    userId,
  });
  return data;
};

export const updateLessonRecordings = async (lessonId: number, recordingUrl: string) => {
  const { data } = await axiosInstance.patch(`subscriptions/lessons/${lessonId}/update-recording`, {
    recordingUrl,
  });
  return data;
};

export const deleteLessonRecording = async (lessonId: number) => {
  const { data } = await axiosInstance.delete(`subscriptions/lessons/${lessonId}/delete-recording`);
  return data;
};