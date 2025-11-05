'use client';

import React from 'react';
import type { Layout } from 'react-grid-layout';
import dynamic from 'next/dynamic';
import { LessonBlockType } from '@/components/Materials/utils/interfaces';
import { BlockItem } from '@/components/Materials/Lesson/components/BlockItem';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import('react-grid-layout/css/styles.css');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import('react-resizable/css/styles.css');
}

const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => mod.WidthProvider(mod.Responsive)),
  { ssr: false }
);

interface Props {
  name: string;
  blocks: LessonBlockType[];
  layoutsByBlockId?: Record<number, Layout[]>;
}

export default function LessonPreviewLayout({ name, blocks, layoutsByBlockId = {} }: Props) {
  return (
    <div className="space-y-6">
      <h1 className="text-center text-5xl font-bold">{name}</h1>
      {blocks.map(block => {
        const layouts = { lg: layoutsByBlockId[block.id] || [] };
        return (
          <div key={block.id} className="p-4">
            <h2 className="font-semibold text-xl">{block.title}</h2>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{
                xxl: 1400,
                xl: 1200,
                lg: 992,
                md: 768,
                sm: 576,
                xs: 0,
              }}
              cols={{
                xxl: 12,
                xl: 12,
                lg: 12,
                md: 3,
                sm: 1,
                xs: 1,
              }}
              rowHeight={1}
              isDraggable={false}
              isResizable={false}
              useCSSTransforms={true}
              preventCollision={true}
              compactType={null}
            >
              {block.items.map(item => (
                <div
                  key={item.id}
                  data-grid={
                    (layouts.lg || []).find(l => l.i === item.id) || {
                      i: String(item.id),
                      x: 0,
                      y: 0,
                      w: 3,
                      h: 8,
                    }
                  }
                  className="p-2 bg-transparent overflow-hidden"
                >
                  <BlockItem item={item} />
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        );
      })}
    </div>
  );
}
