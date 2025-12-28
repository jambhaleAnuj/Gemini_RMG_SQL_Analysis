import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const FileUpload = ({ onFilesProcessed, isLoading }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.filter((file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      return ["xlsx", "xls", "csv", "xlsb", "xlsm", "ods"].includes(ext);
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Initialize processing status
    const newStatus = {};
    newFiles.forEach((file) => {
      newStatus[file.name] = { status: "pending", message: "Ready to process" };
    });
    setProcessingStatus((prev) => ({ ...prev, ...newStatus }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
      "application/vnd.oasis.opendocument.spreadsheet": [".ods"],
    },
    multiple: true,
  });

  const removeFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
    setProcessingStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    // Update all to processing
    const newStatus = {};
    uploadedFiles.forEach((file) => {
      newStatus[file.name] = { status: "processing", message: "Processing..." };
    });
    setProcessingStatus(newStatus);

    await onFilesProcessed(uploadedFiles, (fileName, status, message) => {
      setProcessingStatus((prev) => ({
        ...prev,
        [fileName]: { status, message },
      }));
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-primary-400" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-dark-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 group
          ${
            isDragActive
              ? "border-primary-400 bg-primary-500/10"
              : "border-dark-600 hover:border-primary-500/50 hover:bg-dark-800/50"
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={`
            p-4 rounded-2xl transition-all duration-300
            ${
              isDragActive
                ? "bg-primary-500/20 scale-110"
                : "bg-dark-700 group-hover:bg-primary-500/10"
            }
          `}
          >
            <Upload
              className={`
              w-10 h-10 transition-colors duration-300
              ${
                isDragActive
                  ? "text-primary-400"
                  : "text-dark-400 group-hover:text-primary-400"
              }
            `}
            />
          </div>

          <div>
            <p className="text-lg font-medium text-dark-200">
              {isDragActive
                ? "Drop files here"
                : "Drag & drop Excel files here"}
            </p>
            <p className="text-sm text-dark-400 mt-1">
              or click to browse • Supports .xlsx, .xls, .csv, .ods
            </p>
          </div>
        </div>

        {/* Animated border on drag */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-pulse" />
        )}
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-dark-200">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""}{" "}
              selected
            </h4>
            <button
              onClick={() => {
                setUploadedFiles([]);
                setProcessingStatus({});
              }}
              className="text-sm text-dark-400 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-dark-800/50 rounded-xl border border-dark-700/50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getStatusIcon(processingStatus[file.name]?.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-dark-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-dark-500">
                      {formatFileSize(file.size)}
                      {processingStatus[file.name]?.message && (
                        <span className="ml-2">
                          • {processingStatus[file.name]?.message}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {!isLoading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                    className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-dark-400 hover:text-red-400" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Process Button */}
          <button
            onClick={processFiles}
            disabled={isLoading || uploadedFiles.length === 0}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Files...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span>Load Data into Database</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
