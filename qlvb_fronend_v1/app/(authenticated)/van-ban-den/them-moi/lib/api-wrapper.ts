/**
 * Standard Response DTO structure for API responses
 */
export interface ResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * API wrapper function to handle ResponseDto format
 */
export const apiWrapper = async <T = any>(
  apiCall: () => Promise<any>
): Promise<ResponseDto<T>> => {
  try {
    const response = await apiCall();

    // If response is already in ResponseDto format
    if (response && typeof response === "object" && "success" in response) {
      return response as ResponseDto<T>;
    }

    // Wrap raw response in ResponseDto format
    return {
      success: true,
      message: "Success",
      data: response as T,
    };
  } catch (error: any) {

    // Handle different error formats
    if (error?.response?.data) {
      // Axios error with response
      const errorData = error.response.data;
      if (
        errorData &&
        typeof errorData === "object" &&
        "success" in errorData
      ) {
        return errorData as ResponseDto<T>;
      }

      return {
        success: false,
        message: errorData.message || "Có lỗi xảy ra",
        error: errorData.error || error.message,
        statusCode: error.response.status,
      };
    }

    // Network or other errors
    return {
      success: false,
      message: error.message || "Có lỗi xảy ra khi gọi API",
      error: error.toString(),
    };
  }
};

/**
 * Handle API response and show appropriate toast messages
 */
export const handleApiResponse = <T = any>(
  response: ResponseDto<T>,
  toast: (options: any) => void,
  successMessage?: string
): T | null => {
  if (response.success) {
    if (successMessage) {
      toast({
        title: "Thành công",
        description: successMessage,
        variant: "default",
      });
    }
    return response.data || null;
  } else {
    toast({
      title: "Lỗi",
      description: response.message || "Có lỗi xảy ra",
      variant: "destructive",
    });
    return null;
  }
};
