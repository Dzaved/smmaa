'use client';

import { useState, useRef, useCallback } from 'react';

interface MediaUploadProps {
    onMediaSelect: (file: File | null) => void;
    onPreviewUrl: (url: string | null) => void;
    disabled?: boolean;
}

export function MediaUpload({ onMediaSelect, onPreviewUrl, disabled }: MediaUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const maxImageSize = 10 * 1024 * 1024; // 10MB
        const maxVideoSize = 50 * 1024 * 1024; // 50MB

        const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideos = ['video/mp4', 'video/webm'];

        const isImage = allowedImages.includes(file.type);
        const isVideo = allowedVideos.includes(file.type);

        if (!isImage && !isVideo) {
            return 'Format neacceptat. Folosește JPG, PNG, GIF, MP4 sau WebM.';
        }

        if (isImage && file.size > maxImageSize) {
            return 'Imaginea e prea mare. Maximum 10MB.';
        }

        if (isVideo && file.size > maxVideoSize) {
            return 'Videoul e prea mare. Maximum 50MB.';
        }

        return null;
    };

    const processFile = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setFileName(file.name);

        // Create preview
        const url = URL.createObjectURL(file);
        setPreview(url);
        onPreviewUrl(url);
        onMediaSelect(file);
    }, [onMediaSelect, onPreviewUrl]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        setFileName(null);
        setError(null);
        onMediaSelect(null);
        onPreviewUrl(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const isVideo = preview?.includes('video') || fileName?.match(/\.(mp4|webm)$/i);

    return (
        <div className="media-upload-container">
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={disabled}
            />

            {!preview ? (
                <div
                    className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                >
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">
                        Trage o imagine sau video aici
                    </p>
                    <p className="upload-hint">
                        sau click pentru a selecta
                    </p>
                    <p className="upload-formats">
                        JPG, PNG, GIF, MP4, WebM
                    </p>
                </div>
            ) : (
                <div className="preview-container">
                    {isVideo ? (
                        <video src={preview} className="preview-media" controls />
                    ) : (
                        <img src={preview} alt="Preview" className="preview-media" />
                    )}
                    <div className="preview-overlay">
                        <span className="preview-name">{fileName}</span>
                        <button className="remove-btn" onClick={handleRemove} type="button">
                            ✕ Șterge
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="upload-error">{error}</p>}

            <style jsx>{`
        .media-upload-container {
          width: 100%;
        }

        .upload-zone {
          border: 2px dashed rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(102, 126, 234, 0.03);
        }

        .upload-zone:hover {
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(102, 126, 234, 0.08);
        }

        .upload-zone.dragging {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.15);
          transform: scale(1.02);
        }

        .upload-zone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
        }

        .upload-text {
          font-size: 1rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .upload-formats {
          font-size: 0.75rem;
          color: #9ca3af;
          background: rgba(102, 126, 234, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          display: inline-block;
        }

        .preview-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .preview-media {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }

        .preview-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-name {
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .remove-btn {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.8);
        }

        .upload-error {
          margin-top: 0.75rem;
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
        }
      `}</style>
        </div>
    );
}
