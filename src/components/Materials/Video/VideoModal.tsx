import VideoEditModal from './VideoEditModal';
import VideoAddModal from './VideoAddModal';
import { Dispatch, SetStateAction } from 'react';
import { IFile } from '@/components/Materials/utils/interfaces';

interface Props {
  openModal?: boolean;
  closeModal?: Dispatch<SetStateAction<boolean>>;
  video?: IFile | null;
  hideTrigger?: boolean;
  setSelectedFile?: Dispatch<SetStateAction<IFile | null>>;
  newFiles?: File[] | null;
  setNewFiles?: Dispatch<SetStateAction<File[] | null>>;
}

export default function VideoModal({
  openModal,
  closeModal,
  video,
  hideTrigger,
  setSelectedFile,
  newFiles,
  setNewFiles,
}: Props) {
  return video ? (
    <VideoEditModal video={video} hideTrigger={hideTrigger} setSelectedFile={setSelectedFile} />
  ) : (
    <VideoAddModal
      hideTrigger={hideTrigger}
      initialFiles={newFiles}
      setNewFiles={setNewFiles}
      open={openModal}
      close={closeModal}
    />
  );
}
