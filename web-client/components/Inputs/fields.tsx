const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-sm font-medium text-gray-300">{label}</div>
    {children}
  </label>
);

export default Field;