const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-sm font-medium text-secondary">{label}</div>
    {children}
  </label>
);

export default Field;