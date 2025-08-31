import { useState, useCallback } from 'react';
import type { TabState } from '@/lib/types/incoming-documents';

export function useTabManagement() {
  const [tabState, setTabState] = useState<TabState>({
    activeTab: 'incoming',
    processingStatusTab: 'all',
  });

  const updateActiveTab = useCallback((tab: string) => {
    setTabState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const updateProcessingStatusTab = useCallback((tab: string) => {
    setTabState(prev => ({ ...prev, processingStatusTab: tab }));
  }, []);

  const resetTabs = useCallback(() => {
    setTabState({
      activeTab: 'incoming',
      processingStatusTab: 'all',
    });
  }, []);

  return {
    tabState,
    updateActiveTab,
    updateProcessingStatusTab,
    resetTabs,
  };
}
