import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  onImageAnalysis: (imageData: string, fileName: string) => void;
  isAnalyzing?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageAnalysis, isAnalyzing = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setFileName(file.name);
      onImageAnalysis(result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!uploadedImage ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
            dragActive 
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Upload className="w-8 h-8 text-gray-600 dark:text-gray-300" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Envie uma imagem do produto
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Arraste e solte ou clique para selecionar
              </p>
              
              <button
                onClick={openFileDialog}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors duration-200"
              >
                Selecionar Imagem
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <img
                  src={uploadedImage}
                  alt="Produto enviado"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {fileName}
                  </p>
                </div>
                
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analisando imagem...</span>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Imagem carregada com sucesso
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
