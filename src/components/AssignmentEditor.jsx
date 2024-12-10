import React, { useState, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { fileService } from '../services/fileService.js';
import { pdfService } from '../services/pdfService.js';
import { RiFileUploadFill, RiFileZipFill, RiFileWordFill, RiMergeCellsHorizontal } from 'react-icons/ri';

function AssignmentEditor() {
  const [files, setFiles] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('merge'); // merge, compress, word
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const readFileContent = async (file) => {
    try {
      if (file.type.includes('text/plain')) {
        // Handle .txt files
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
        return text;
      } else if (file.type.includes('wordprocessingml.document') || 
                file.name.toLowerCase().endsWith('.docx')) {
        // Handle .docx files using fileService
        const html = await fileService.convertDocxToHtml(file);
        return html;
      } else {
        throw new Error('Unsupported file type');
      }
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  };

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);

    // Try to read content from the first file
    if (newFiles.length > 0) {
      try {
        const content = await readFileContent(newFiles[0]);
        
        // If there's existing content, append the new content
        if (editorContent) {
          setEditorContent(prev => prev + '\n\n' + content);
        } else {
          setEditorContent(content);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Could not read file content. Make sure it\'s a supported file type (TXT or DOCX).');
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...newFiles]);

    // Try to read content from the first dropped file
    if (newFiles.length > 0) {
      try {
        const content = await readFileContent(newFiles[0]);
        
        // If there's existing content, append the new content
        if (editorContent) {
          setEditorContent(prev => prev + '\n\n' + content);
        } else {
          setEditorContent(content);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Could not read file content. Make sure it\'s a supported file type (TXT or DOCX).');
      }
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePdfSelect = (e) => {
    const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
    setPdfFiles(prev => [...prev, ...newFiles]);
  };

  const handlePdfDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
    setPdfFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemovePdf = (index) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMergePdfs = async () => {
    if (pdfFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge');
      return;
    }

    setProcessing(true);
    try {
      const result = await pdfService.mergePdfs(pdfFiles);
      
      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Clear files after successful merge
      setPdfFiles([]);
      alert('PDFs merged successfully!');
    } catch (error) {
      alert('Failed to merge PDFs: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompressPdf = async () => {
    if (pdfFiles.length !== 1) {
      alert('Please select one PDF file to compress');
      return;
    }

    setProcessing(true);
    try {
      const result = await pdfService.compressPdf(pdfFiles[0]);
      
      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Clear file after successful compression
      setPdfFiles([]);
      alert('PDF compressed successfully!');
    } catch (error) {
      alert('Failed to compress PDF: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConvertToWord = async () => {
    if (pdfFiles.length !== 1) {
      alert('Please select one PDF file to convert');
      return;
    }

    setProcessing(true);
    try {
      const result = await pdfService.convertToWord(pdfFiles[0]);
      
      // Create download link
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Clear file after successful conversion
      setPdfFiles([]);
      alert('PDF converted to Word successfully!');
    } catch (error) {
      alert('Failed to convert PDF: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Editor Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Assignment Editor</h2>
        </div>
        <div className="p-4">
          <Editor
            apiKey="fd0vhkqkc0omtpc5wq3dx6m39a47uwh92wvjhvwvmnjjp1h1"
            onInit={(evt, editor) => editorRef.current = editor}
            value={editorContent}
            onEditorChange={(content) => setEditorContent(content)}
            init={{
              height: 400,
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
              paste_data_images: true,
              skin: 'oxide',
              content_css: 'default'
            }}
            className="min-h-[400px] border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">File Attachments</h2>
        </div>
        <div className="p-6">
          <div 
            className={`border-2 border-dashed border-gray-200 rounded-xl p-8 text-center 
              cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5
              ${processing ? 'pointer-events-none opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              accept=".txt,.docx,.doc"
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4">
              <svg 
                className="w-full h-full text-gray-400"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to select files</p>
            <p className="text-sm text-gray-500">Supported file types: TXT, DOCX</p>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-gray-50/50 
                      rounded-xl border border-gray-100/50"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-900 font-medium">{file.name}</span>
                      <span className="text-sm text-gray-500">({formatFileSize(file.size)})</span>
                    </div>
                    <button 
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 
                        hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleRemoveFile(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Tools Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">PDF Tools</h2>
          <p className="mt-1 text-sm text-gray-500">Merge, compress, or convert your PDF files</p>
        </div>
        
        <div className="p-8">
          {/* Tool Selection Tabs */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium 
                transition-all duration-300 ${activeTab === 'merge' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('merge')}
            >
              <RiMergeCellsHorizontal className="text-lg" />
              Merge PDFs
            </button>
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium 
                transition-all duration-300 ${activeTab === 'compress' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('compress')}
            >
              <RiFileZipFill className="text-lg" />
              Compress PDF
            </button>
            <button
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium 
                transition-all duration-300 ${activeTab === 'word' 
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('word')}
            >
              <RiFileWordFill className="text-lg" />
              PDF to Word
            </button>
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed border-gray-200 rounded-xl p-12 text-center 
              cursor-pointer transition-all duration-300
              ${processing ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary', 'bg-primary/5');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
            }}
            onDrop={handlePdfDrop}
            onClick={() => pdfInputRef.current?.click()}
          >
            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePdfSelect}
              accept=".pdf"
              multiple={activeTab === 'merge'}
              className="hidden"
            />
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <RiFileUploadFill className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'merge'
                  ? 'Drop PDFs here or click to select files'
                  : 'Drop a PDF here or click to select'}
              </h3>
              <p className="text-sm text-gray-500">
                {activeTab === 'merge'
                  ? 'Select multiple PDF files to merge them into one'
                  : activeTab === 'compress'
                  ? 'Select a PDF file to compress its size'
                  : 'Select a PDF file to convert it to Word format'}
              </p>
            </div>
          </div>

          {/* Selected Files List */}
          {pdfFiles.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Selected Files</h3>
                <span className="text-sm text-gray-500">
                  {pdfFiles.length} {pdfFiles.length === 1 ? 'file' : 'files'} selected
                </span>
              </div>
              <div className="space-y-3">
                {pdfFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-gray-50 
                      rounded-xl border border-gray-100 group hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg">
                        <RiFileWordFill className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 
                        rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      onClick={() => handleRemovePdf(index)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                className={`w-full px-6 py-3 mt-6 rounded-xl font-medium text-white
                  transition-all duration-300 ${processing 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:shadow-lg hover:shadow-primary/30'
                  } ${(activeTab === 'merge' ? pdfFiles.length < 2 : pdfFiles.length !== 1)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''}`}
                onClick={
                  activeTab === 'merge'
                    ? handleMergePdfs
                    : activeTab === 'compress'
                    ? handleCompressPdf
                    : handleConvertToWord
                }
                disabled={processing || (activeTab === 'merge' ? pdfFiles.length < 2 : pdfFiles.length !== 1)}
              >
                {processing ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : activeTab === 'merge' ? (
                  'Merge PDFs'
                ) : activeTab === 'compress' ? (
                  'Compress PDF'
                ) : (
                  'Convert to Word'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentEditor; 