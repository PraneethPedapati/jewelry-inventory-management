import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  confirmButtonVariant = 'default'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getHeaderClass = () => {
    switch (variant) {
      case 'destructive':
        return 'border-l-4 border-red-500 pl-4';
      case 'warning':
        return 'border-l-4 border-yellow-500 pl-4';
      case 'success':
        return 'border-l-4 border-green-500 pl-4';
      default:
        return 'border-l-4 border-blue-500 pl-4';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader className={getHeaderClass()}>
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={confirmButtonVariant}
              onClick={onConfirm}
              className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
            >
              {confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog; 
