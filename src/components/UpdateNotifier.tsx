import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UpdateNotifier() {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;

    const cleanupStatus = api.onUpdateStatus?.((status: string) => {
      console.log("Update status:", status);
      setMessage(status);
    });

    const cleanupProgress = api.onDownloadProgress?.((progressObj: any) => {
      setDownloadProgress(Math.floor(progressObj.percent));
    });

    const offAvailable = api.onUpdateAvailable(() => {
      setIsOpen(true);
      setMessage("A new version is available. Downloading...");
    });

    const offDownloaded = api.onUpdateDownloaded(() => {
      setDownloaded(true);
      setDownloadProgress(null);
      setIsOpen(true);
      setMessage("Update downloaded. Restart now to apply.");
    });

    return () => {
      if (cleanupStatus) cleanupStatus();
      if (cleanupProgress) cleanupProgress();
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
            <div className="flex flex-col gap-2">
              <p className="text-[#1E1E1E] text-sm">
                {message || "A new version is being downloaded..."}
              </p>
              {downloadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#15BA5C] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-500 mt-1 block text-right">
                    {downloadProgress}%
                  </span>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Later
          </Button>
          {downloaded && (
            <Button onClick={handleUpdate}>Restart & Update</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
