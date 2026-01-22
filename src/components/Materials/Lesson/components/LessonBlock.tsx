import { Block, BlockNoteEditor, filterSuggestionItems } from '@blocknote/core';
import { useTheme } from 'next-themes';
import * as locales from '@blocknote/core/locales';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react';
import { multiColumnDropCursor } from '@blocknote/xl-multi-column';
import { BlockNoteView } from '@blocknote/shadcn';
import { useEffect, useState, useRef } from 'react';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal';
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal';
import { schema } from '@/components/Materials/utils/utils';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import PreviewModal from '@/common/PreviewModal';

interface Props {
  lesson?: Block[];
  blockId: number;
  editable?: boolean;
  isLessonDetail?: boolean;
  isSelectBlock?: boolean;
  selectBlock?: (blockId: number) => void;
  onUpdate?: (blockId: number, content: Block[]) => void;
  deleteSection?: (blockId: number) => void;
  attributes?: any;
  listeners?: any;
}

export default function LessonBlock({
  blockId,
  onUpdate,
  lesson,
  editable = true,
  isLessonDetail = false,
  selectBlock,
  isSelectBlock,
  deleteSection,
  attributes,
  listeners,
}: Props) {
  const [openChoosePhoto, setOpenChoosePhoto] = useState(false);
  const [openChooseAudio, setOpenChooseAudio] = useState(false);
  const [openChooseVideo, setOpenChooseVideo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editable) return;

    const protectContent = () => {
      if (!containerRef.current) return;
      const mediaElements = containerRef.current.querySelectorAll('video, audio');
      mediaElements.forEach((el) => {
        el.setAttribute('controlsList', 'nodownload');
      });
    };

    protectContent();

    const observer = new MutationObserver(protectContent);
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [editable]);

  const editor = useCreateBlockNote({
    // @ts-ignore
    schema,
    // @ts-ignore
    dropCursor: multiColumnDropCursor,
    dictionary: {
      ...locales.uk,
    },
    initialContent: lesson && lesson.length > 0 ? lesson : undefined,
  });

  const getCustomSlashMenuItems = (editor: BlockNoteEditor): DefaultReactSuggestionItem[] => {
    const items = getDefaultReactSlashMenuItems(editor);

    return (
      items
        // @ts-ignore
        .filter(item => item.key !== 'file')
        .map(item => {
          // @ts-ignore
          if (item.key === 'image') {
            return {
              ...item,
              onItemClick: () => setOpenChoosePhoto(true),
            };
          }

          // @ts-ignore
          if (item.key === 'video') {
            return {
              ...item,
              onItemClick: () => setOpenChooseVideo(true),
            };
          }

          // @ts-ignore
          if (item.key === 'audio') {
            return {
              ...item,
              onItemClick: () => setOpenChooseAudio(true),
            };
          }

          return item;
        })
    );
  };

  const resolveInsertTarget = (block: Block | null) => {
    if (!block) return null;
    const maybeId = (block as unknown as { id?: string }).id;
    return maybeId ?? block;
  };

  const insertMedia = (type: 'image' | 'video' | 'audio', url: string, bankId?: number) => {
    const cursor = editor.getTextCursorPosition();
    if (!cursor?.block) return;

    // @ts-ignore
    const newBlock: Partial<BNBlock> = {
      type,
      props: { url, bankId },
    };

    if (type === 'image' || type === 'video') {
      newBlock.props = {
        ...(newBlock.props ?? {}),
        previewWidth: '100%',
        caption: '',
        name: bankId,
        bankId,
      };
    }

    if (type === 'audio') {
      newBlock.props = {
        ...(newBlock.props ?? {}),
        name: bankId,
        bankId,
      };
    }

    const target = resolveInsertTarget(cursor.block);
    if (target) {
      editor.insertBlocks([newBlock as Block], target, 'before');
    }
  };

  // Обработчики добавления медиа
  const handleAddPhoto = (url: string, bankId?: number) => {
    insertMedia('image', url, bankId);
    setOpenChoosePhoto(false);
  };

  const handleAddVideo = (url: string, bankId?: number) => {
    const isYoutubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
    const match = url.match(/(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : '';
    if (isYoutubeUrl) {
      editor.insertBlocks(
        [
          {
            // @ts-ignore
            type: 'youtube',
            props: { url, videoId, name: bankId },
          },
        ],
        editor.getTextCursorPosition()?.block ?? null,
        'after'
      );
    } else {
      insertMedia('video', url, bankId);
    }

    setOpenChooseVideo(false);
  };

  const handleAddAudio = (url: string, bankId?: number) => {
    insertMedia('audio', url, bankId);
    setOpenChooseAudio(false);
  };

  // Обновляем родителя при любом изменении
  const handleEditorChange = () => {
    const content = editor.document;
    if (!onUpdate) return;
    onUpdate(blockId, content);
  };

  // Подписываемся на изменения редактора
  useEffect(() => {
    editor.onChange(handleEditorChange);
    return () => {
      // editor.onChange.removeListener(handleEditorChange);
    };
  }, [editor]);

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.getAttribute('src')) {
      e.stopPropagation();
      setPreviewUrl(target.getAttribute('src'));
    }
  };

  return (
    <>
      {editable && (
        <div className="flex w-full justify-end px-4 gap-2">
          <Button variant="ghost" className="cursor-grab touch-none" {...attributes} {...listeners}>
            <GripVertical />
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={() => deleteSection && deleteSection(blockId)}
          >
            <Trash2 />
          </Button>
        </div>
      )}

      {isLessonDetail && selectBlock && (
        <Checkbox
          checked={isSelectBlock}
          onCheckedChange={() => selectBlock(blockId)}
          className="w-6 h-6"
        />
      )}

      <div 
        ref={containerRef}
        onClick={handleContentClick}
        onContextMenu={(e) => !editable && e.preventDefault()}
        className={!editable ? 'select-none' : undefined}
      >
        <BlockNoteView
          editor={editor}
          onChange={handleEditorChange}
          editable={editable}
          theme={theme === 'light' ? 'light' : 'dark'}
        >
          <SuggestionMenuController
            triggerCharacter={'/'}
            getItems={async query => filterSuggestionItems(getCustomSlashMenuItems(editor), query)}
          />
        </BlockNoteView>
      </div>

      <ChoosePhotoModal
        open={openChoosePhoto}
        closeModal={() => {
          setOpenChoosePhoto(false);
        }}
        handleAdd={(type, content, bankId) => handleAddPhoto(content as string, bankId)}
      />

      <ChooseVideoModal
        open={openChooseVideo}
        closeModal={() => {
          setOpenChooseVideo(false);
        }}
        handleAdd={(type, content, bankId) => {
          handleAddVideo(content as string, bankId);
        }}
      />

      <ChooseAudioModal
        open={openChooseAudio}
        closeModal={() => {
          setOpenChooseAudio(false);
        }}
        handleAdd={(type, content, bankId) => handleAddAudio(content as string, bankId)}
      />

      {previewUrl && (
        <PreviewModal
          open={!!previewUrl}
          setOpen={() => setPreviewUrl(null)}
          content={previewUrl}
        />
      )}
    </>
  );
}
