
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (url: string) => void;
}

export default function YouTubeInputModal({ open, onClose, onConfirm }: Props) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateYouTubeUrl = (url: string) => {
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regExp.test(url);
  };

  const handleConfirm = () => {
    if (validateYouTubeUrl(url)) {
      onConfirm(url);
      setUrl('');
      setError('');
      onClose();
    } else {
      setError('Invalid YouTube URL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Label htmlFor="youtube-url">Video URL</Label>
          <Input
            id="youtube-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            onKeyDown={(e) => {
               if(e.key === 'Enter') {
                   handleConfirm();
               }
            }}
          />
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Add Video</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
