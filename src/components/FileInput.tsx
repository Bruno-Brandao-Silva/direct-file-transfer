import React, { ChangeEvent, FC, useState } from 'react';
import Image from 'next/image';
import styles from '@/styles/FileInput.module.css';

interface FileInputProps {
  text?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange?: (files: FileList | null) => void;
}

const FileInput: FC<FileInputProps> = ({
  text = 'Click or drag file',
  accept,
  multiple,
  disabled,
  onChange
}) => {

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (onChange) {
      onChange(files);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const { files } = event.dataTransfer;
    if (onChange) {
      onChange(files);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <label className={styles.fileInputLabel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}>
      <input
        id="FileInput"
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
        className={styles.fileInput}
      />
      <Image
        src="/upload-icon.svg"
        alt="file"
        width={100}
        height={100}
        priority={true}
        className={styles.fileIcon}
      />
      <p className={styles.fileInputText}>{text}</p>
    </label>
  );
};

export default FileInput;
