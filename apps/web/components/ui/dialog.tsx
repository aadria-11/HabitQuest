import { Button } from './button';

interface DialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function Dialog({ open, title, message, onClose }: DialogProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-orange-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </>
  );
}
