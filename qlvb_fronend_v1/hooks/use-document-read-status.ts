import { useState, useCallback } from "react";

interface DocumentReadStatus {
  [documentId: number]: {
    isRead: boolean;
    readAt?: string;
  };
}

let globalReadStatus: DocumentReadStatus = {};
let subscribers: Set<() => void> = new Set();

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

export const useDocumentReadStatus = () => {
  const [, forceUpdate] = useState({});

  const subscribe = useCallback(() => {
    const callback = () => forceUpdate({});
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
    };
  }, []);

  const markAsRead = useCallback((documentId: number) => {
    globalReadStatus[documentId] = {
      isRead: true,
      readAt: new Date().toISOString(),
    };
    notifySubscribers();
  }, []);

  const markAsUnread = useCallback((documentId: number) => {
    globalReadStatus[documentId] = {
      isRead: false,
      readAt: undefined,
    };
    notifySubscribers();
  }, []);

  const getReadStatus = useCallback((documentId: number) => {
    return globalReadStatus[documentId] || { isRead: false };
  }, []);

  const updateMultipleReadStatus = useCallback(
    (updates: { id: number; isRead: boolean; readAt?: string }[]) => {
      updates.forEach(({ id, isRead, readAt }) => {
        globalReadStatus[id] = { isRead, readAt };
      });
      notifySubscribers();
    },
    []
  );

  return {
    subscribe,
    markAsRead,
    markAsUnread,
    getReadStatus,
    updateMultipleReadStatus,
  };
};
