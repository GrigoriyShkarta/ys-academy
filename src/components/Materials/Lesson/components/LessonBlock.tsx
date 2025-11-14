import { Block, BlockNoteEditor, filterSuggestionItems } from '@blocknote/core';
import * as locales from '@blocknote/core/locales';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import {
  DefaultReactSuggestionItem,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react';
import { locales as multiColumnLocales, multiColumnDropCursor } from '@blocknote/xl-multi-column';
import { BlockNoteView } from '@blocknote/shadcn';
import { useEffect, useState } from 'react';
import ChoosePhotoModal from '@/common/MaterialsCommon/ChoosePhotoModal';
import ChooseVideoModal from '@/common/MaterialsCommon/ChooseVideoModal';
import ChooseAudioModal from '@/common/MaterialsCommon/ChooseAudioModal';
import { schema } from '@/components/Materials/utils/utils';

interface Props {
  lesson?: Block[];
  blockId: number;
  editable?: boolean;
  onUpdate?: (blockId: number, content: Block[]) => void;
}

export default function LessonBlock({ blockId, onUpdate, lesson, editable = true }: Props) {
  const [openChoosePhoto, setOpenChoosePhoto] = useState(false);
  const [openChooseAudio, setOpenChooseAudio] = useState(false);
  const [openChooseVideo, setOpenChooseVideo] = useState(false);

  const editor = useCreateBlockNote({
    // @ts-ignore
    schema,
    // @ts-ignore
    dropCursor: multiColumnDropCursor,
    dictionary: {
      ...locales.uk,
      multi_column: multiColumnLocales.ru,
    },
    initialContent: lesson,
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

  const insertMedia = (type: 'image' | 'video' | 'audio', url: string) => {
    const cursor = editor.getTextCursorPosition();
    if (!cursor?.block) return;

    // @ts-ignore
    const newBlock: any = {
      type,
      props: { url },
    };

    if (type === 'image' || type === 'video') {
      newBlock.props.previewWidth = '100%';
      newBlock.props.caption = '';
    }

    if (type === 'audio') {
      newBlock.props.name = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Аудіо');
    }

    editor.insertBlocks([newBlock], cursor.block, 'before');
  };

  // Обработчики добавления медиа
  const handleAddPhoto = (url: string) => {
    insertMedia('image', url);
    setOpenChoosePhoto(false);
  };

  const handleAddVideo = (url: string) => {
    const isYoutubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
    const match = url.match(/(?:youtube\.com\/(?:.*v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : '';
    if (isYoutubeUrl) {
      editor.insertBlocks(
        [
          {
            // @ts-ignore
            type: 'youtube',
            props: { url, videoId },
          },
        ],
        editor.getTextCursorPosition()?.block ?? null,
        'after'
      );
    } else {
      insertMedia('video', url);
    }

    setOpenChooseVideo(false);
  };

  const handleAddAudio = (url: string) => {
    insertMedia('audio', url);
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

  return (
    <>
      <BlockNoteView editor={editor} onChange={handleEditorChange} editable={editable}>
        <SuggestionMenuController
          triggerCharacter={'/'}
          getItems={async query => filterSuggestionItems(getCustomSlashMenuItems(editor), query)}
        />
      </BlockNoteView>

      <ChoosePhotoModal
        open={openChoosePhoto}
        closeModal={() => {
          setOpenChoosePhoto(false);
        }}
        handleAdd={(type, content, bankId) => handleAddPhoto(content as string)}
      />

      <ChooseVideoModal
        open={openChooseVideo}
        closeModal={() => {
          setOpenChooseVideo(false);
        }}
        handleAdd={(type, content, bankId) => {
          handleAddVideo(content as string);
        }}
      />

      <ChooseAudioModal
        open={openChooseAudio}
        closeModal={() => {
          setOpenChooseAudio(false);
        }}
        handleAdd={(type, content, bankId) => handleAddAudio(content as string)}
      />
    </>
  );
}
