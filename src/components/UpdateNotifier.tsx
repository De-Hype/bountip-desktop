import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function UpdateNotifier() {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;

    const offAvailable = api.onUpdateAvailable(() => {
      setIsOpen(true);
      setMessage("A new version is available. Downloading...");
    });

    const offDownloaded = api.onUpdateDownloaded(() => {
      setDownloaded(true);
      setIsOpen(true);
      setMessage("Update downloaded. Restart now to apply.");
    });
    
    return () => {
      offAvailable();
      offDownloaded();
    };
  }, []);

  const handleUpdate = () => {
    const api = (window as any).electronAPI;
    if (api) {
      api.quitAndInstall();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>App Update</DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Later
          </Button>
          {downloaded && (
            <Button onClick={handleUpdate}>
              Restart & Update
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
