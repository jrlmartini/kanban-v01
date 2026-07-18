export function FieldPills<T extends string>({ label, onChange, options, value }: { label: string; onChange: (value: T) => void; options: Array<[T, string]>; value: T }) {
  return (
    <fieldset className="field-pills">
      <legend>{label}</legend>
      <div>
        {options.map(([option, text]) => (
          <button className={`${value === option ? "active" : ""} pill-${option}`} key={option} onClick={() => onChange(option)} type="button">{text}</button>
        ))}
      </div>
    </fieldset>
  );
}
