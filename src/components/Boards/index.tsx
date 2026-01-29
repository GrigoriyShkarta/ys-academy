'use client';

import { 
  BaseBoxShapeUtil, 
  HTMLContainer, 
  TLBaseShape, 
  Tldraw, 
  DefaultToolbar,
  DefaultToolbarContent,
  useEditor,
  AssetRecordType,
  createShapeId,
  DefaultColorThemePalette,
} from 'tldraw';
import { useUser } from '@/providers/UserContext';
import axiosInstance from '@/services/axios';
import 'tldraw/tldraw.css';
import { useState, useMemo, useEffect } from 'react';
import { Plus, Image as ImageIcon, Music, Video } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal';
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal';
import { LessonItemType } from '@/components/Materials/utils/interfaces';
import { useBoardSync } from './useBoardSync';

// Синхронизация палитры с темой приложения
DefaultColorThemePalette.lightMode.background = '#fafafa';
DefaultColorThemePalette.darkMode.background = 'oklch(0.129 0.042 264.695)';

type IAudioShape = TLBaseShape<
  'audio',
  {
    w: number;
    h: number;
    url: string;
  }
>;

class AudioShapeUtil extends BaseBoxShapeUtil<IAudioShape> {
  static override type = 'audio' as const;

  override canResize = () => true;

  override getDefaultProps(): IAudioShape['props'] {
    return {
      w: 300,
      h: 54,
      url: '',
    };
  }

  override component(shape: IAudioShape) {
    return (
      <HTMLContainer className="pointer-events-auto">
        <div className="flex w-full h-full overflow-hidden">
          <div 
            className="flex-1 min-w-0 flex items-center justify-center opacity-100"
            onPointerDown={e => e.stopPropagation()}
          >
            <audio 
              controls 
              src={shape.props.url} 
              className="w-full h-8 pointer-events-auto"
              style={{ paddingRight: '8px' }}
            />
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: IAudioShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

const customShapeUtils = [AudioShapeUtil];

function CustomToolbar() {
  return (
    <DefaultToolbar>
      <DefaultToolbarContent />
    </DefaultToolbar>
  );
}

interface CustomUIProps {
  roomId: string;
}

function CustomUI({ roomId }: CustomUIProps) {
  const editor = useEditor();
  const { user } = useUser();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);

  // Setup real-time synchronization
  useBoardSync({
    editor,
    roomId,
    userId: user?.id?.toString() || 'anonymous',
    userName: user?.name || 'Anonymous',
  });

  const handleAddMedia = async (type: LessonItemType, content?: string | File, bankId?: number) => {
    if (!content) return;

    let src = '';
    let publicId = '';
    const assetId = AssetRecordType.createId();

    if (content instanceof File) {
      const formData = new FormData();
      formData.append('file', content);
      formData.append('assetId', assetId);
      formData.append('roomId', roomId);

      try {
        const { data } = await axiosInstance.post('/boards/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        src = data.url || data.src;
        publicId = data.publicId;
      } catch (error) {
        console.error('Failed to upload board asset:', error);
        return;
      }
    } else {
      src = content;
    }

    const { x, y } = editor.getViewportPageBounds().center;

    if (type === 'image') {
      editor.createAssets([
        {
          id: assetId,
          typeName: 'asset',
          type: 'image',
          props: {
            name: content instanceof File ? content.name : 'Image',
            src: src,
            w: 400,
            h: 400,
            isAnimated: content instanceof File ? content.type === 'image/gif' : false,
            mimeType: content instanceof File ? content.type : 'image/png',
          },
          meta: { publicId: publicId ?? '' },
        },
      ]);

      editor.createShape({
        type: 'image',
        x: x - 200,
        y: y - 200,
        props: {
          w: 400,
          h: 400,
          assetId: assetId,
        },
      });
    } else if (type === 'video') {
      const isYoutube = typeof src === 'string' && (src.includes('youtube.com') || src.includes('youtu.be'));
      if (isYoutube) {
        editor.createShape({
          type: 'embed',
          x: x - 300,
          y: y - 200,
          props: {
            w: 600,
            h: 400,
            url: src,
          },
        });
      } else {
        editor.createAssets([
          {
            id: assetId,
            typeName: 'asset',
            type: 'video',
            props: {
              name: content instanceof File ? content.name : 'Video',
              src: src,
              w: 600,
              h: 400,
              isAnimated: false,
              mimeType: content instanceof File ? content.type : 'video/mp4',
            },
            meta: {},
          },
        ]);

        editor.createShape({
          type: 'video',
          x: x - 300,
          y: y - 200,
          props: {
            w: 600,
            h: 400,
            assetId: assetId,
          },
        });
      }
    } else if (type === 'audio') {
      editor.createShape({
        id: createShapeId(),
        type: 'audio',
        x: x - 150,
        y: y - 27,
        props: {
          w: 300,
          h: 54,
          url: src,
        },
      });
    }
    
    setPhotoOpen(false);
    setVideoOpen(false);
    setAudioOpen(false);
  };

  return (
    <>
      {user?.role === 'super_admin' && (
        <>
          <div className="absolute top-[10px] right-[170px] z-[1000] pointer-events-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full shadow-md border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
                >
                  <Plus className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-gray-200 shadow-lg rounded-xl p-1 z-[1001] bg-white dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem 
                   onClick={() => setPhotoOpen(true)}
                   className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ImageIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span>Photo</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                   onClick={() => setAudioOpen(true)}
                   className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Music className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span>Audio</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                   onClick={() => setVideoOpen(true)}
                   className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Video className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span>Video</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ChoosePhotoModal
            open={photoOpen}
            closeModal={() => setPhotoOpen(false)}
            handleAdd={handleAddMedia}
          />
          <ChooseVideoModal
            open={videoOpen}
            closeModal={() => setVideoOpen(false)}
            handleAdd={handleAddMedia}
          />
          <ChooseAudioModal
            open={audioOpen}
            closeModal={() => setAudioOpen(false)}
            handleAdd={handleAddMedia}
          />
        </>
      )}
    </>
  );
}

interface BoardLayoutProps {
  studentId?: string;
  boardId?: string;
}

export default function BoardLayout({ studentId, boardId }: BoardLayoutProps) {
  const { user } = useUser();
  const { theme, resolvedTheme } = useTheme();
  const locale = useLocale();
  
  const currentTheme = (resolvedTheme || theme || 'light') as 'light' | 'dark';
  const roomId = boardId || studentId || user?.id?.toString() || 'default';
  
  const persistenceKey = studentId 
    ? `board-persistence-student-${studentId}` 
    : boardId 
      ? `board-persistence-${boardId}`
      : 'board-v2-persistence'; // Смена ключа для принудительного сброса при миграции

  // Синхронизация данных пользователя в localStorage
  useEffect(() => {
    const userDataStr = localStorage.getItem('TLDRAW_USER_DATA_v3');
    let userData = userDataStr ? JSON.parse(userDataStr) : { version: 9, user: { id: `user:${user?.id || 'anon'}`, color: '#F04F88' } };
    
    userData.user = {
      ...userData.user,
      colorScheme: currentTheme,
      locale: 'uk',
    };
    
    localStorage.setItem('TLDRAW_USER_DATA_v3', JSON.stringify(userData));
  }, [currentTheme, locale, user?.id]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-background">
      <Tldraw 
        persistenceKey={persistenceKey}
        shapeUtils={customShapeUtils}
        components={{
          Toolbar: CustomToolbar,
        }}
        onMount={(editor) => {
          editor.registerExternalAssetHandler('file', async ({ file }) => {
            const assetId = AssetRecordType.createId();
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await axiosInstance.post('/boards/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            return {
              id: assetId,
              typeName: 'asset',
              type: file.type.startsWith('video/') ? 'video' : 'image',
              props: {
                name: file.name,
                src: data.url || data.src,
                w: 400,
                h: 400,
                mimeType: file.type,
                isAnimated: file.type === 'image/gif',
              },
              meta: {
                publicId: data.publicId,
              },
            };
          });
        }}
      >
        <CustomUI roomId={roomId} />
      </Tldraw>
    </div>
  );
}