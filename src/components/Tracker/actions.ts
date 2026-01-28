import axiosInstance from "@/services/axios";
import { TaskFormValues } from "./schema";

export const getTasks = async (id: number) => {
  const {data} = await axiosInstance.get(`/trackers/${id}`);
  return data;
};

export const createTask = async ( userId: number, task: TaskFormValues) => {
  const {data} = await axiosInstance.post(`/trackers`, {...task, userId});
  return data;
};

export const updateTask = async ( userId: number, taskId: number, task: TaskFormValues) => {
  const {data} = await axiosInstance.patch(`/trackers/${taskId}`, {...task, userId});
  return data;
};

export const deleteTask = async ( taskId: number) => {
  const {data} = await axiosInstance.delete(`/trackers/${taskId}`);
  return data;
};

export const moveTask = async ( taskId: number, {userId, columnId, newOrder}: {userId: number, columnId: string, newOrder?: number}) => {
  const {data} = await axiosInstance.patch(`/trackers/${taskId}/move`, {columnId, newOrder, userId});
  return data;
};

export const toggleSubtask = async (taskId: number, subtaskId: number, userId: number, completed: boolean) => {
  const {data} = await axiosInstance.patch('/trackers/toggle', {taskId, subtaskId, userId, completed});
  return data;
};
