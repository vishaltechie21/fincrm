import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';

const ImportModal = ({
  isOpen,
  onClose,
  title = "Import Data",
  templateHeaders = [],
  sampleData = [],
  onImportComplete,
  onSaveRow
}) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: 'idle' }); // idle, parsing, saving, completed
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Generate and download Excel template
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: templateHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    // Set column widths
    ws['!cols'] = templateHeaders.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '')}_Template.xlsx`);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
      setProgress({ current: 0, total: 0, status: 'idle' });
      setSuccessCount(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setErrors([]);
      setProgress({ current: 0, total: 0, status: 'idle' });
      setSuccessCount(0);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setProgress({ current: 0, total: 0, status: 'parsing' });
    setErrors([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse rows as JSON
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          setErrors(["The Excel file is empty or has no data rows."]);
          setProgress({ current: 0, total: 0, status: 'idle' });
          return;
        }

        setProgress({ current: 0, total: rows.length, status: 'saving' });

        let localSuccess = 0;
        const localErrors = [];

        // Loop over rows and save
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProgress(prev => ({ ...prev, current: i + 1 }));

          try {
            // Call individual row save handler
            const res = await onSaveRow(row);
            if (res.success) {
              localSuccess++;
            } else {
              localErrors.push(`Row ${i + 2} (${row['Company Name'] || row['Contact Name'] || 'Unknown'}): ${res.message || 'Validation or database error'}`);
            }
          } catch (err) {
            console.error(err);
            localErrors.push(`Row ${i + 2}: Network or unexpected error saving row`);
          }
        }

        setSuccessCount(localSuccess);
        setErrors(localErrors);
        setProgress(prev => ({ ...prev, status: 'completed' }));
        if (onImportComplete) {
          onImportComplete(localSuccess);
        }
      } catch (err) {
        console.error(err);
        setErrors([`Failed to parse Excel file: ${err.message}`]);
        setProgress({ current: 0, total: 0, status: 'idle' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="import-modal-content">
            
            {/* Step 1: Instructions & Download template */}
            <div className="import-instructions">
              <h5>Instructions</h5>
              <ul>
                <li>Please download the template to ensure column headers align with database fields.</li>
                <li>Required fields must be completed. Standard dropdown options should be used.</li>
                <li>Do not rename the column header labels.</li>
              </ul>
            </div>

            <div className="import-template-download">
              <span className="import-template-text">Template xlsx file with fields configuration</span>
              <button type="button" className="import-template-btn" onClick={handleDownloadTemplate}>
                <Download size={13} style={{ marginRight: '5px' }} /> Template
              </button>
            </div>

            {/* Step 2: Upload drop zone */}
            {progress.status === 'idle' && (
              <div 
                className="import-upload-zone" 
                onClick={triggerFileSelect}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls, .csv" 
                  style={{ display: 'none' }} 
                />
                <div className="import-upload-icon">
                  <Upload size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="import-upload-text">
                  {file ? file.name : "Click to select or drag & drop Excel file"}
                </div>
                <div className="import-upload-subtext">Supports .xlsx, .xls, and .csv files</div>
              </div>
            )}

            {/* Progress Display */}
            {progress.status !== 'idle' && (
              <div className="import-progress-container">
                <div className="import-progress-text">
                  <span>
                    {progress.status === 'parsing' && "Parsing spreadsheet..."}
                    {progress.status === 'saving' && `Importing: ${progress.current} of ${progress.total} rows`}
                    {progress.status === 'completed' && "Import completed!"}
                  </span>
                  <span>{progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%</span>
                </div>
                <div className="import-progress-bar-bg">
                  <div 
                    className="import-progress-bar-fill" 
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {progress.status === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--btn-success)', fontSize: '12px', fontWeight: '600' }}>
                  <CheckCircle2 size={16} /> Successfully imported {successCount} records.
                </div>
                {errors.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
                    <AlertCircle size={16} /> Failed to import {errors.length} records. See error log below.
                  </div>
                )}
              </div>
            )}

            {/* Errors Log */}
            {errors.length > 0 && (
              <div className="import-errors-log">
                <h6>Error Log</h6>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={progress.status === 'saving'}
              >
                Close
              </button>
              {progress.status === 'idle' && file && (
                <button type="button" className="btn btn-success" onClick={handleUpload}>
                  Import File
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
