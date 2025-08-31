import api from "./config"

export interface SystemSettingDTO {
  id: number
  key: string
  value: string
  description?: string
  category: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface UserSettingDTO {
  id: number
  userId: number
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

// Thêm các interface cho các loại cài đặt
export interface GeneralSettings {
  systemName: string
  organizationName: string
  adminEmail: string
  systemDescription: string
  documentPrefix: string
  documentCounter: number
}

export interface NotificationSettings {
  incomingDocuments: boolean
  approvals: boolean
  schedules: boolean
  emailEnabled: boolean
  emailServer: string
  emailPort: string
  emailSecurity: string
  emailUsername: string
  emailPassword: string
}

export interface SecuritySettings {
  passwordMinLength: number
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  lockAccountAfterFailures: boolean
  twoFactorAuth: boolean
  sessionTimeout: number
}

export const settingsAPI = {
  /**
   * Get all system settings
   * @returns List of all system settings
   */
  getAllSystemSettings: async (): Promise<SystemSettingDTO[]> => {
    const response = await api.get("/settings/system")
    return response.data
  },

  /**
   * Get system setting by key
   * @param key Setting key
   * @returns System setting
   */
  getSystemSettingByKey: async (key: string): Promise<SystemSettingDTO> => {
    const response = await api.get(`/settings/system/${key}`)
    return response.data
  },

  /**
   * Update system setting
   * @param key Setting key
   * @param value Setting value
   * @returns Updated system setting
   */
  updateSystemSetting: async (key: string, value: string): Promise<SystemSettingDTO> => {
    const response = await api.put(`/settings/system/${key}`, { value })
    return response.data
  },

  /**
   * Get all user settings
   * @returns List of all user settings
   */
  getAllUserSettings: async (): Promise<UserSettingDTO[]> => {
    const response = await api.get("/settings/user")
    return response.data
  },

  /**
   * Get user setting by key
   * @param key Setting key
   * @returns User setting
   */
  getUserSettingByKey: async (key: string): Promise<UserSettingDTO> => {
    const response = await api.get(`/settings/user/${key}`)
    return response.data
  },

  /**
   * Update user setting
   * @param key Setting key
   * @param value Setting value
   * @returns Updated user setting
   */
  updateUserSetting: async (key: string, value: string): Promise<UserSettingDTO> => {
    const response = await api.put(`/settings/user/${key}`, { value })
    return response.data
  },

  /**
   * Reset all user settings
   * @returns Success message
   */
  resetAllUserSettings: async (): Promise<{ message: string }> => {
    const response = await api.delete("/settings/user")
    return response.data
  },

  // Thêm các phương thức mới để tương thích với code hiện tại
  getSettings: async (): Promise<{
    general: GeneralSettings;
    notifications: NotificationSettings;
    security: SecuritySettings;
  }> => {
    // Lấy tất cả cài đặt hệ thống và chuyển đổi thành định dạng phù hợp
    const settings = await settingsAPI.getAllSystemSettings();
    
    // Chuyển đổi dữ liệu từ API thành cấu trúc cần thiết
    return {
      general: {
        systemName: settings.find(s => s.key === 'systemName')?.value || '',
        organizationName: settings.find(s => s.key === 'organizationName')?.value || '',
        adminEmail: settings.find(s => s.key === 'adminEmail')?.value || '',
        systemDescription: settings.find(s => s.key === 'systemDescription')?.value || '',
        documentPrefix: settings.find(s => s.key === 'documentPrefix')?.value || '',
        documentCounter: parseInt(settings.find(s => s.key === 'documentCounter')?.value || '1'),
      },
      notifications: {
        incomingDocuments: settings.find(s => s.key === 'notifyIncomingDocuments')?.value === 'true',
        approvals: settings.find(s => s.key === 'notifyApprovals')?.value === 'true',
        schedules: settings.find(s => s.key === 'notifySchedules')?.value === 'true',
        emailEnabled: settings.find(s => s.key === 'emailEnabled')?.value === 'true',
        emailServer: settings.find(s => s.key === 'emailServer')?.value || '',
        emailPort: settings.find(s => s.key === 'emailPort')?.value || '',
        emailSecurity: settings.find(s => s.key === 'emailSecurity')?.value || 'tls',
        emailUsername: settings.find(s => s.key === 'emailUsername')?.value || '',
        emailPassword: settings.find(s => s.key === 'emailPassword')?.value || '',
      },
      security: {
        passwordMinLength: parseInt(settings.find(s => s.key === 'passwordMinLength')?.value || '8'),
        requireUppercase: settings.find(s => s.key === 'requireUppercase')?.value === 'true',
        requireNumbers: settings.find(s => s.key === 'requireNumbers')?.value === 'true',
        requireSpecialChars: settings.find(s => s.key === 'requireSpecialChars')?.value === 'true',
        lockAccountAfterFailures: settings.find(s => s.key === 'lockAccountAfterFailures')?.value === 'true',
        twoFactorAuth: settings.find(s => s.key === 'twoFactorAuth')?.value === 'true',
        sessionTimeout: parseInt(settings.find(s => s.key === 'sessionTimeout')?.value || '30'),
      }
    };
  },

  updateGeneralSettings: async (data: Partial<GeneralSettings>): Promise<void> => {
    // Cập nhật từng cài đặt riêng lẻ
    const updates = Object.entries(data).map(([key, value]) => 
      settingsAPI.updateSystemSetting(key, value?.toString() || '')
    );
    await Promise.all(updates);
  },

  updateNotificationSettings: async (data: Partial<NotificationSettings>): Promise<void> => {
    // Cập nhật từng cài đặt riêng lẻ
    const updates = Object.entries(data).map(([key, value]) => 
      settingsAPI.updateSystemSetting(key, value?.toString() || '')
    );
    await Promise.all(updates);
  },

  updateSecuritySettings: async (data: Partial<SecuritySettings>): Promise<void> => {
    // Cập nhật từng cài đặt riêng lẻ
    const updates = Object.entries(data).map(([key, value]) => 
      settingsAPI.updateSystemSetting(key, value?.toString() || '')
    );
    await Promise.all(updates);
  }
}
