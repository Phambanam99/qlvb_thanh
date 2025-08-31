"use client"

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';

// This wrapper component is a workaround for potential type conflicts
// with react-dnd's DndProvider in some React environments.
export const DndWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <DndProvider backend={HTML5Backend}>
            {children}
        </DndProvider>
    );
}; 