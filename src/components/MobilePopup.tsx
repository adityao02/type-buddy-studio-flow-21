import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const MobilePopup = () => {
  const isMobile = useIsMobile();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setShowPopup(true);
    }
  }, [isMobile]);

  const handleBackToWebsite = () => {
    // You can customize this behavior - for now it just closes the popup
    setShowPopup(false);
  };

  const handleContinueToApp = () => {
    setShowPopup(false);
  };

  if (!isMobile) return null;

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="sm:max-w-md mx-4 rounded-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-normal text-foreground">
            Wrdo works better on a bigger screen.
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleBackToWebsite}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2.5"
          >
            Back to Website
          </Button>
          
          <Button
            onClick={handleContinueToApp}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md py-2.5"
          >
            Continue to App
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobilePopup;