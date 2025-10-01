'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  MoreHorizontal, 
  Eye,
  Share,
  Trash2,
  File,
  Image,
  Video,
  Music
} from 'lucide-react';

interface FileAttachmentProps {
  file: {
    name: string;
    type: string;
    size: string;
    url?: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  showActions?: boolean;
  className?: string;
}

export default function FileAttachment({ file, showActions = true, className = "" }: FileAttachmentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    if (type.includes('audio')) return Music;
    return File;
  };

  const getFileColor = (type: string) => {
    if (type.includes('pdf')) return 'text-red-600';
    if (type.includes('image')) return 'text-green-600';
    if (type.includes('video')) return 'text-purple-600';
    if (type.includes('audio')) return 'text-orange-600';
    return 'text-blue-600';
  };

  const FileIcon = getFileIcon(file.type);

  return (
    <div 
      className={`border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-white ${getFileColor(file.type)}`}>
          <FileIcon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${getFileColor(file.type)} hover:underline cursor-pointer`}>
            {file.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {file.size} • Uploaded by {file.uploadedBy} • {file.uploadedAt}
          </div>
        </div>

        {showActions && (
          <div className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <Download className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <Share className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 