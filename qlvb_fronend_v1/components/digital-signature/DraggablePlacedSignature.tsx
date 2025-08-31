"use client";

import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';

export const DraggablePlacedSignature = ({
  sig,
  isSelected,
  onSelectSignature,
  onDeleteSignature,
  onResizeSignature,
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PLACED_SIGNATURE,
    item: { id: sig.instanceId, type: ItemTypes.PLACED_SIGNATURE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = sig.width;
    const startHeight = sig.height;

    const doDrag = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      // Enforce a minimum size
      onResizeSignature(sig.instanceId, newWidth > 30 ? newWidth : 30, newHeight > 15 ? newHeight : 15);
    };

    const stopDrag = () => {
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

  return (
    <div
      ref={ref}
      className={`absolute cursor-grab ${isSelected ? 'border-2 border-blue-500' : ''}`}
      style={{
        left: `${sig.x}px`,
        top: `${sig.y}px`,
        width: `${sig.width}px`,
        height: `${sig.height}px`,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSignature(sig.instanceId);
      }}
    >
      <Image 
        src={sig.src} 
        alt="signature" 
        fill 
        style={{ objectFit: 'contain' }}
        sizes="(max-width: 768px) 100vw, 300px"
      />
      {isSelected && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSignature(sig.instanceId);
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-20"
          >
            <Trash2 size={12} />
          </button>
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 cursor-se-resize rounded-full z-20"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>
  );
}; 