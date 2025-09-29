const Modal: React.FC<React.PropsWithChildren<{ onClose: () => void }>> = ({
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-3xl rounded-2xl border border-black/5 bg-secondary  p-5 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);


export default Modal;