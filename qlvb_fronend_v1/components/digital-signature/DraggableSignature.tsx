"use client";

import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import Image from 'next/image';

interface DraggableSignatureProps {
    id: number;
    src: string; // The URL/path to the signature image
    fileName: string;
}

export const DraggableSignature = ({ id, src, fileName }: DraggableSignatureProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.SIGNATURE,
        item: { id, src }, // Pass signature info
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
            }}
            className="p-2 border rounded-md bg-white flex flex-col items-center"
        >
            <Image 
                src={src} 
                alt={`Signature ${id}`} 
                width={100} 
                height={50} 
                className="object-contain"
            />
            <p className="text-xs text-center mt-1 truncate w-full">{fileName}</p>
        </div>
    );
}; 