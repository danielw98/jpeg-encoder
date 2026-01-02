/**
 * ImageUpload Component
 * 
 * Drag & drop or click to upload image files
 */

import { useRef, useState, DragEvent, ChangeEvent } from 'react';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  filename?: string;
}

export function ImageUpload({ onFileSelect, previewUrl, filename }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <div
        className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".png,.ppm,.pgm"
          onChange={handleChange}
        />
        <div className="icon">📷</div>
        <p>Drag & drop an image here</p>
        <p style={{ fontSize: '0.875rem' }}>or click to browse</p>
        <p style={{ fontSize: '0.75rem', marginTop: '8px', color: '#94a3b8' }}>
          Supported: PNG, PPM, PGM
        </p>
      </div>

      {previewUrl && (
        <div className="image-preview">
          <img src={previewUrl} alt="Preview" />
          {filename && <p className="filename">{filename}</p>}
        </div>
      )}
    </div>
  );
}
