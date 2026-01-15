import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { addLessonRecording } from '@/components/LessonRecordings/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { checkYouTubeVideoExists } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  lessonId: number;
  studentId: number;
  closeModal: () => void;
}

export default function UrlModal({ lessonId, studentId, closeModal }: Props) {
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [url, setUrl] = useState('');
  const t = useTranslations('Materials');
  const client = useQueryClient();

  useEffect(() => {
    const validateUrl = async () => {
      const valid = await checkYouTubeVideoExists(url);
      setIsValid(valid);
    };

    validateUrl();
  }, [url]);

  const handleAddUrl = async () => {
    try {
      setLoading(true);
      await addLessonRecording(lessonId, url);
      client.invalidateQueries({ queryKey: ['student', studentId] });
      closeModal();
    } catch (e) {
      console.log('Error adding url:', e);
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  return (
    <Dialog open={!!lessonId} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[1024px] max-h-[90vh] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
        <DialogTitle>
          <VisuallyHidden />
        </DialogTitle>

        <Label className="mb-2">{t('url')}</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder={t('enterUrl')} />

        <DialogFooter>
          <Button className="bg-accent" onClick={handleAddUrl} disabled={loading || !isValid}>
            {loading ? <Loader2 className="animate-spin" /> : t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
