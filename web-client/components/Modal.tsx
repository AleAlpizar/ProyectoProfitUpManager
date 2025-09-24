export default function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}) {
  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-5" onClick={(e)=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
