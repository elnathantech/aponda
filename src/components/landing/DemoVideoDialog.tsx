import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface DemoVideoDialogProps {
  children: React.ReactNode;
}

export function DemoVideoDialog({ children }: DemoVideoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none">
          <video
            src="/aponda-demo.mp4"
            controls
            autoPlay
            className="w-full h-auto rounded-lg"
            onEnded={() => setOpen(false)}
          >
            Your browser does not support the video tag.
          </video>
        </DialogContent>
      </Dialog>
    </>
  );
}
