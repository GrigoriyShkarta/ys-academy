import { useEffect, useState } from 'react';
import { Layout, Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BlockSource,
  LessonBlockType,
  LessonItem,
  LessonItemType,
} from '@/components/Materials/utils/interfaces';
import PopupMenu from '@/components/Materials/Lesson/components/PopupMenu';
import { BlockItem } from '@/components/Materials/Lesson/components/BlockItem';
import RedactorModal from '@/common/RedactorModal';
import {
  getImageDimensions,
  getImageDimensionsFromFile,
  getVideoDimensions,
  getVideoDimensionsFromFile,
} from '@/components/Materials/utils/helpers';
import { nanoid } from 'nanoid';
import ItemContextMenu from '@/components/Materials/Lesson/components/ItemContextMenu';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function LessonBlock({
  block,
  onUpdate,
  initialLayout,
  onDeleteBlock,
}: {
  block: LessonBlockType;
  onUpdate: (blockId: number, newItems: LessonItem[], layout?: Layout[], title?: string) => void;
  onDeleteBlock: (blockId: number) => void;
  initialLayout?: Layout[];
}) {
  const [title, setTitle] = useState<string>(() => block.title ?? '');
  const [openEditModal, setOpenEditModal] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [layout, setLayout] = useState<Layout[]>(() =>
    initialLayout && initialLayout.length > 0
      ? initialLayout.filter(
          l =>
            l.i &&
            Number.isFinite(l.x) &&
            Number.isFinite(l.y) &&
            Number.isFinite(l.w) &&
            Number.isFinite(l.h)
        )
      : block.items
          .filter(item => item.id)
          .map((item, index) => ({
            i: String(item.id),
            x: 0,
            y: index * 8,
            w: 3,
            h: item.type === 'text' ? 10 : 8,
            minH: item.type === 'text' ? 10 : 2,
          }))
  );

  useEffect(() => {
    if (initialLayout && initialLayout.length > 0) {
      const validLayout = initialLayout.filter(
        l =>
          l.i &&
          Number.isFinite(l.x) &&
          Number.isFinite(l.y) &&
          Number.isFinite(l.w) &&
          Number.isFinite(l.h)
      );
      setLayout(validLayout);
    }
  }, [initialLayout]);

  useEffect(() => {
    setTitle(block.title ?? '');
  }, [block.title]);

  useEffect(() => {
    const ensureLayoutForItems = (items: LessonItem[], currentLayout: Layout[]): Layout[] => {
      const map = new Map(currentLayout.map(l => [String(l.i), l]));
      const newLayout = items
        .filter(item => item.id)
        .map((item, index) => {
          const key = String(item.id);
          const existing = map.get(key);
          if (existing && Number.isFinite(existing.x) && Number.isFinite(existing.y)) {
            return {
              ...existing,
              x: Number.isFinite(existing.x) ? existing.x : 0,
              y: Number.isFinite(existing.y) ? existing.y : index * 8,
              w: Number.isFinite(existing.w) ? existing.w : 3,
              h: Number.isFinite(existing.h) ? existing.h : item.type === 'text' ? 10 : 8,
              minH: item.type === 'text' ? 10 : 2,
            };
          }
          return {
            i: key,
            x: 0,
            y: index * 8,
            w: 3,
            h: item.type === 'text' ? 10 : 8,
            minH: item.type === 'text' ? 10 : 2,
          } as Layout;
        });

      return newLayout;
    };

    const next = ensureLayoutForItems(block.items, layout);
    const sameKeys =
      next.length === layout.length && next.every((n, i) => String(n.i) === String(layout[i]?.i));
    if (!sameKeys) {
      setLayout(next);
    }
  }, [block.items]);

  const handleAddItem = async (type: LessonItemType, content: string | File, bankId?: number) => {
    const newItem: LessonItem = {
      id: nanoid(),
      type,
      content,
      source: bankId ? 'bank' : 'custom',
      bankId,
    };

    let width = 4;
    let height = 6;
    const cols = 12;
    const maxWidthPx = 1200;
    const rowHeightPx = 10;

    if (type === 'image' || type === 'video') {
      try {
        let mediaDimensions: { width: number; height: number } | undefined;

        if (type === 'image') {
          mediaDimensions =
            typeof content === 'string'
              ? await getImageDimensions(content)
              : await getImageDimensionsFromFile(content);
        } else if (type === 'video') {
          mediaDimensions =
            typeof content === 'string' &&
            (content.includes('youtube.com') || content.includes('youtu.be'))
              ? { width: 1280, height: 720 }
              : typeof content === 'string'
              ? await getVideoDimensions(content)
              : await getVideoDimensionsFromFile(content);
        }

        if (!mediaDimensions) throw new Error('Media dimensions not found');

        const { width: mediaWidth, height: mediaHeight } = mediaDimensions;

        const SCALE_FACTOR = 0.5;
        const aspectRatio = mediaWidth / mediaHeight;

        const baseHeightPx = mediaHeight * SCALE_FACTOR;
        const baseWidthPx = mediaWidth * SCALE_FACTOR;

        const gridUnitWidth = maxWidthPx / cols;

        width = Math.max(2, Math.min(cols, Math.ceil(baseWidthPx / gridUnitWidth)));
        height = Math.max(2, Math.ceil(baseHeightPx / rowHeightPx));

        const correctedHeight = Math.round((width / aspectRatio) * rowHeightPx);
        height = Math.max(2, correctedHeight);
      } catch (error) {
        console.error(`Error loading ${type} dimensions:`, error);
        width = 4;
        height = 6;
      }
    }

    const newLayoutItem: Layout = {
      i: newItem.id as string,
      x: 0,
      y: block.items.length * 8,
      w: width,
      h: height,
      minH: type === 'text' ? 5 : 2,
      resizeHandles: type === 'audio' ? ['e'] : ['se', 'e', 's'],
    };

    const newItems = [...block.items, newItem];
    const newLayout = [...layout, newLayoutItem];

    onUpdate(block.id, newItems, newLayout);
    setLayout(newLayout);
  };

  const handleEditItem = (itemId: string, newContent: string | File) => {
    const newItems = block.items.map(item =>
      item.id === itemId ? { ...item, content: newContent, source: 'custom' as BlockSource } : item
    );
    onUpdate(block.id, newItems, layout);
  };

  const handleDeleteItem = (itemId: string) => {
    const newItems = block.items.filter(item => String(item.id) !== String(itemId));

    // Rebuild layout in the order of newItems to avoid gaps / undefined entries
    const newLayout = newItems.map((it, idx) => {
      const existing = layout.find(l => String(l.i) === String(it.id));
      if (existing) {
        return {
          ...existing,
          x: Number.isFinite(existing.x) ? existing.x : 0,
          y: idx * 8,
          w: Number.isFinite(existing.w) ? existing.w : 3,
          h: Number.isFinite(existing.h) ? existing.h : it.type === 'text' ? 10 : 8,
          minH: it.type === 'text' ? 10 : 2,
        };
      }
      return {
        i: String(it.id),
        x: 0,
        y: idx * 8,
        w: 3,
        h: it.type === 'text' ? 10 : 8,
        minH: it.type === 'text' ? 10 : 2,
      };
    });

    const filtered = newLayout.filter(l => typeof l.x === 'number' && typeof l.y === 'number');
    setLayout(filtered);
    onUpdate(block.id, newItems, filtered);
  };

  const handleLayoutChange = (newLayout: Layout[]) => {
    const correctedLayout = newLayout
      .filter(
        l =>
          l.i &&
          Number.isFinite(l.x) &&
          Number.isFinite(l.y) &&
          Number.isFinite(l.w) &&
          Number.isFinite(l.h)
      )
      .map((item, index) => {
        const originalItem = block.items.find(i => String(i.id) === String(item.i));
        return {
          i: String(item.i),
          x: Number.isFinite(item.x) ? item.x : 0,
          y: Number.isFinite(item.y) ? item.y : index * 8,
          w: Number.isFinite(item.w) ? item.w : 3,
          h: Number.isFinite(item.h) ? item.h : originalItem?.type === 'text' ? 10 : 8,
          minH: originalItem?.type === 'text' ? 10 : 2,
        };
      });
    setLayout(correctedLayout);
    onUpdate(block.id, block.items, correctedLayout);
  };

  const getSafeLayoutForItem = (item: LessonItem, index: number) => {
    const found = layout.find(l => String(l.i) === String(item.id));
    if (found && Number.isFinite(found.x) && Number.isFinite(found.y)) {
      return {
        ...found,
        i: String(found.i),
        x: Number.isFinite(found.x) ? found.x : 0,
        y: Number.isFinite(found.y) ? found.y : index * 8,
        w: Number.isFinite(found.w) ? found.w : 3,
        h: Number.isFinite(found.h) ? found.h : item.type === 'text' ? 10 : 8,
        minH: item.type === 'text' ? 10 : 2,
      };
    }
    return {
      i: String(item.id),
      x: 0,
      y: index * 8,
      w: 3,
      h: item.type === 'text' ? 10 : 8,
      minH: item.type === 'text' ? 10 : 2,
    } as Layout;
  };

  return (
    <>
      <div className="flex gap-2">
        <Input
          value={title}
          placeholder="Заголовок блока"
          onChange={e => onUpdate(block.id, block.items, layout, e.target.value)}
          className="mb-2"
        />
        <Button variant="destructive" onClick={() => onDeleteBlock(block.id)}>
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="p-4 border rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <PopupMenu handleAdd={handleAddItem} />
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, sm: 768 }}
          cols={{ lg: 12, sm: 2 }}
          draggableHandle={'.drag-handle'}
          onLayoutChange={handleLayoutChange}
          rowHeight={1}
          isResizable={true}
          isDraggable={true}
        >
          {block.items.map((item, idx) => {
            const safeLayout = getSafeLayoutForItem(item, idx);
            return (
              <div
                key={String(item.id)}
                data-grid={{
                  ...safeLayout,
                  resizeHandles: item.type === 'audio' ? ['e'] : ['se', 'e', 's'],
                }}
                className="border rounded-lg shadow-sm relative overflow-visible"
              >
                <ItemContextMenu
                  type={item.type}
                  editAction={() =>
                    setOpenEditModal({ id: String(item.id), content: String(item.content) })
                  }
                  deleteAction={() => handleDeleteItem(String(item.id))}
                />

                <BlockItem item={item} />
              </div>
            );
          })}
        </ResponsiveGridLayout>

        {openEditModal && (
          <RedactorModal
            open={!!openEditModal}
            close={() => {
              setOpenEditModal(null);
            }}
            confirm={content => {
              handleEditItem(openEditModal.id, content);
              setOpenEditModal(null);
            }}
            content={openEditModal.content}
          />
        )}
      </div>
    </>
  );
}

export default LessonBlock;
