type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const LabeledInput = ({ label, error, ...rest }: InputProps) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        {...rest}
        className={`rounded-xl border bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-400 outline-none transition
        ${error ? "border-red-400" : "border-gray-700 focus:border-gray-500"}`}
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </div>
  );
}

export default LabeledInput;