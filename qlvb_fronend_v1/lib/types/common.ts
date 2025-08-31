export interface ResponseDTO<T> {
  success: boolean;
  message: string;
  data: T;
} 