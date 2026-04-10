import { useState, useRef } from 'react'
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa'

export default function ImageUploader({ files, setFiles, maxFiles = 3 }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'))
    const remaining = maxFiles - files.length
    if (remaining <= 0) return
    const toAdd = imageFiles.slice(0, remaining)
    setFiles(prev => [...prev, ...toAdd])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all text-center ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-gray-100'
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
        />
        <div className="flex flex-col items-center">
          <FaCloudUploadAlt className={`w-8 h-8 mb-2 transition-colors ${dragOver ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
          <p className="text-sm font-bold text-gray-700">Click or drag images to upload</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG or WEBP • {files.length}/{maxFiles} used</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative group w-20 h-20 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <img 
                src={URL.createObjectURL(file)} 
                alt="preview" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
              <button
                type="button"
                onClick={(e) => { 
                  e.stopPropagation()
                  setFiles(prev => prev.filter((_, i) => i !== index))
                }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
