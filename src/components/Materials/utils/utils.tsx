import { createReactBlockSpec } from '@blocknote/react';
import { withMultiColumn } from '@blocknote/xl-multi-column';
import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';

const createYoutube = createReactBlockSpec(
  {
    type: 'youtube',
    propSchema: {
      url: { default: '' },
      videoId: { default: '' },
      width: { default: '50%' },
      height: { default: 315 },
    },
    content: 'inline',
  },
  {
    render: ({ block }) => (
      <iframe
        src={`https://www.youtube.com/embed/${block.props.videoId}`}
        width={block.props.width}
        height={block.props.height}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ),
  }
);

export const schema = withMultiColumn(
  // @ts-ignore
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      youtube: createYoutube(),
    },
  })
);
