'use client';

import { GripVertical, Youtube } from 'lucide-react';
import { 
  BaseBoxShapeUtil, 
  HTMLContainer, 
  TLBaseShape, 
  TLUiOverrides,
  Tldraw, 
  DefaultToolbar,
  DefaultToolbarContent,
  TldrawUiMenuItem,
  useEditor,
  useIsToolSelected,
  useTools
} from 'tldraw';
import { useBoardSync } from './useBoardSync';
import { useUser } from '@/providers/UserContext';
import axiosInstance from '@/services/axios';
import 'tldraw/tldraw.css';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal';
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal';
import { LessonItemType } from '@/components/Materials/utils/interfaces';
import YouTubeInputModal from './YouTubeInputModal';

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
          {/* Audio area - stops propagation so controls work */}
          <div 
            className="flex-1 min-w-0 flex items-center justify-center"
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
    const assetId = `asset:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (content instanceof File) {
      const formData = new FormData();
      formData.append('file', content);
      formData.append('assetId', assetId);
      formData.append('roomId', roomId);

      try {
        const { data } = await axiosInstance.post('/boards/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        src = data.url; // Use returned URL from Cloudinary
        publicId = data.publicId;
      } catch (error) {
        console.error('Failed to upload board asset:', error);
        return;
      }
    } else {
      src = content;
    }

    if (type === 'image') {
      editor.createAssets([
        {
          id: assetId as any,
          typeName: 'asset',
          type: 'image',
          props: {
            name: content instanceof File ? content.name : 'Image',
            src: src,
            w: 200,
            h: 200,
            isAnimated: content instanceof File ? content.type === 'image/gif' : false,
            mimeType: content instanceof File ? content.type : 'image/png',
          },
          meta: {
            publicId: publicId ?? ''
          },
        },
      ]);

      editor.createShape({
        type: 'image',
        x: editor.getViewportScreenCenter().x - 100,
        y: editor.getViewportScreenCenter().y - 100,
        props: {
          w: 200,
          h: 200,
          assetId: assetId as any,
        },
      });
    } else if (type === 'video') {
      const isYoutube = typeof src === 'string' && (src.includes('youtube.com') || src.includes('youtu.be'));
      if (isYoutube) {
        editor.createShape({
          type: 'embed',
          x: editor.getViewportScreenCenter().x - 150,
          y: editor.getViewportScreenCenter().y - 100,
          props: {
            w: 300,
            h: 200,
            url: src,
          },
        });
      } else {
        editor.createAssets([
          {
            id: assetId as any,
            typeName: 'asset',
            type: 'video',
            props: {
              name: content instanceof File ? content.name : 'Video',
              src: src,
              w: 300,
              h: 200,
              isAnimated: false,
              mimeType: content instanceof File ? content.type : 'video/mp4',
            },
            meta: {},
          },
        ]);

        editor.createShape({
          type: 'video',
          x: editor.getViewportScreenCenter().x - 150,
          y: editor.getViewportScreenCenter().y - 100,
          props: {
            w: 300,
            h: 200,
            assetId: assetId as any,
          },
        });
      }
    } else if (type === 'audio') {
      editor.createShape({
        type: 'audio',
        x: editor.getViewportScreenCenter().x - 150,
        y: editor.getViewportScreenCenter().y - 50,
        props: {
          w: 300,
          h: 54,
          url: src,
        },
      });
    }
  };

  return (
    <>
      {user?.role === 'super_admin' && (
        <>
          <div className="absolute top-2 right-40 flex flex-col gap-2 z-[99999] pointer-events-auto bg-white p-2 rounded shadow-md border">
            <h3 className="text-sm font-bold mb-1 text-center">Media</h3>
            <Button size="sm" onClick={() => setPhotoOpen(true)} variant="outline">
              Add Photo
            </Button>
            <Button size="sm" onClick={() => setVideoOpen(true)} variant="outline">
              Add Video
            </Button>
            <Button size="sm" onClick={() => setAudioOpen(true)} variant="outline">
              Add Audio
            </Button>
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
}

export default function BoardLayout({ studentId }: BoardLayoutProps) {
  const { user } = useUser();
  
  // Determine room ID: use studentId if provided (admin viewing student board),
  // otherwise use current user's ID (student viewing own board)
  const roomId = studentId || user?.id?.toString() || 'default';
  
  const persistenceKey = studentId 
    ? `board-persistence-student-${studentId}` 
    : 'board-persistence';

  return (
    <div className="w-full h-screen relative">
      <Tldraw 
        persistenceKey={persistenceKey}
        shapeUtils={customShapeUtils}
        components={{
          Toolbar: CustomToolbar,
        }}
        onMount={(editor) => {
          editor.registerExternalAssetHandler('file', async ({ file }) => {
            const assetId = `asset:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await axiosInstance.post('/boards/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });

            console.log('data', data);

            return {
              id: assetId as any,
              typeName: 'asset',
              type: file.type.startsWith('video/') ? 'video' : 'image',
              props: {
                name: file.name,
                src: data.src,
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