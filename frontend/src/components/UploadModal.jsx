import { useState } from 'react';
import axios from 'axios';
import { Upload, X, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setStatusMessage({ type: 'error', text: 'Please select a valid .csv file.' });
        setFile(null);
      } else {
        setFile(selectedFile);
        setStatusMessage(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatusMessage({
        type: 'success',
        text: response.data.message || 'CSV database updated successfully!',
      });

      if (onUploadSuccess) onUploadSuccess();

      setTimeout(() => {
        setFile(null);
        setStatusMessage(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Upload Error:', error);
      const errorText =
        error.response?.data?.detail || 'Failed to upload CSV file. Please check column format.';
      setStatusMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Update Customer CSV</h3>
            <p className="text-xs text-slate-500">Upload a new CSV file to refresh the AI database</p>
          </div>
        </div>

        {/* Dropzone Area */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            id="csv-file-input"
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-indigo-600">Click to select CSV</span> or drag and drop
            </div>
            <p className="text-[10px] text-slate-400">Required headers: Application Id, Account Name, Account No, Mobile Number, Application Date</p>
          </label>
        </div>

        {/* Selected File Name */}
        {file && (
          <div className="mt-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between text-xs text-indigo-900">
            <span className="truncate font-medium">{file.name}</span>
            <span className="text-[10px] text-indigo-600 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}