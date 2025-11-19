import { withMultiColumn } from '@blocknote/xl-multi-column';
import { BlockNoteSchema, createBlockSpec, defaultBlockSpecs } from '@blocknote/core';

const youtubeBlock = createBlockSpec(
  {
    type: 'youtube',
    propSchema: {
      url: { default: '' },
      videoId: { default: '' },
      width: { default: '100%' },
      height: { default: 315 },
    },
    content: 'none',
  },
  {
    render: block => {
      const wrapper = document.createElement('div');
      wrapper.className = 'w-full flex justify-center';

      const iframeContainer = document.createElement('div');
      // w-full до больших экранов, и только на lg делаем уже
      iframeContainer.className = 'w-full lg:w-[65%]';

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${block.props.videoId}?rel=0`;
      iframe.className = 'w-full h-[315px] lg:h-[415px] aspect-video rounded-lg shadow-lg';
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

      iframeContainer.appendChild(iframe);
      wrapper.appendChild(iframeContainer);

      return { dom: wrapper };
    },
  }
);

export const schema = withMultiColumn(
  // @ts-ignore
  BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,

      numberedList: {
        ...defaultBlockSpecs.numberedListItem,
        config: {
          ...defaultBlockSpecs.numberedListItem.config,
          propSchema: {
            ...defaultBlockSpecs.numberedListItem.config.propSchema,
            start: { default: 1 },
          },
        },
      },

      youtube: youtubeBlock(),
    },
  })
);
