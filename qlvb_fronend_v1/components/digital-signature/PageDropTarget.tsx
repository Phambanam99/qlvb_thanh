"use client";

import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { Page } from 'react-pdf';
import { DraggablePlacedSignature } from './DraggablePlacedSignature';

interface PlacedSignature {
  id: number;
  instanceId: number; // Add this
  src: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

interface PageDropTargetProps {
  pageNumber: number;
  placedSignatures: PlacedSignature[];
  onDropSignature: (item: { id: number; src: string }, x: number, y: number, page: number) => void;
  onMoveSignature: (instanceId: number, newX: number, newY: number) => void;
  onResizeSignature: (instanceId: number, newWidth: number, newHeight: number) => void;
  // New props for selection
  selectedSignatureId: number | null;
  onSelectSignature: (instanceId: number | null) => void;
  onDeleteSignature: (instanceId: number) => void;
}

export const PageDropTarget = ({ 
  pageNumber, 
  placedSignatures, 
  onDropSignature,
  onMoveSignature,
  onResizeSignature,
  selectedSignatureId,
  onSelectSignature,
  onDeleteSignature,
}: PageDropTargetProps) => {
  const pageRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.SIGNATURE, ItemTypes.PLACED_SIGNATURE], // Accept both new and placed signatures
    drop: (item: any, monitor) => {
      if (!pageRef.current) return;
      const dropTargetOffset = pageRef.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const x = clientOffset.x - dropTargetOffset.left;
      const y = clientOffset.y - dropTargetOffset.top;
      
      if (item.type === ItemTypes.PLACED_SIGNATURE) {
        // This is a signature that was already on the page
        onMoveSignature(item.id, x, y);
      } else {
        // This is a new signature from the sidebar
        onDropSignature(item, x, y, pageNumber);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  drop(pageRef);

  return (
    <div ref={pageRef} className="relative my-2 shadow-lg">
      <Page 
        pageNumber={pageNumber} 
        renderTextLayer={false}
      />
      {placedSignatures
        .filter(sig => sig.page === pageNumber)
        .map((sig) => (
          <DraggablePlacedSignature
            key={sig.instanceId}
            sig={sig}
            isSelected={sig.instanceId === selectedSignatureId}
            onSelectSignature={onSelectSignature}
            onDeleteSignature={onDeleteSignature}
            onResizeSignature={onResizeSignature}
          />
        ))}
      {isOver && (
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ backgroundColor: 'rgba(173, 216, 230, 0.5)' }} 
        />
      )}
    </div>
  );
}; 