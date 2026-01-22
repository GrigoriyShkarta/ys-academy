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

  const handleAddMedia = (type: LessonItemType, content?: string | File, bankId?: number) => {
    if (!content || typeof content !== 'string') return;

    if (type === 'image') {
      const assetId = `asset:${Date.now()}`;
      editor.createAssets([
        {
          id: assetId as any,
          typeName: 'asset',
          type: 'image',
          props: {
            name: 'Image',
            src: content,
            w: 200,
            h: 200,
            isAnimated: false,
            mimeType: 'image/png',
          },
          meta: {},
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
      const isYoutube = content.includes('youtube.com') || content.includes('youtu.be');
      if (isYoutube) {
        editor.createShape({
          type: 'embed',
          x: editor.getViewportScreenCenter().x - 150,
          y: editor.getViewportScreenCenter().y - 100,
          props: {
            w: 300,
            h: 200,
            url: content,
          },
        });
      } else {
        const assetId = `asset:${Date.now()}`;
        editor.createAssets([
          {
            id: assetId as any,
            typeName: 'asset',
            type: 'video',
            props: {
              name: 'Video',
              src: content,
              w: 300,
              h: 200,
              isAnimated: false,
              mimeType: 'video/mp4',
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
          url: content,
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
      >
        <CustomUI roomId={roomId} />
      </Tldraw>
    </div>
  );
}