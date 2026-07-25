import { weekdayKeys, weekdayLabels, type WeekdayKey } from "../../utils/treatmentDisplay";

export function WeekdaySelector({
  selected,
  onChange,
  disabled,
}: {
  selected: WeekdayKey[];
  onChange: (days: WeekdayKey[]) => void;
  disabled?: boolean;
}) {
  const toggleDay = (day: WeekdayKey) => {
    if (selected.includes(day)) {
      onChange(selected.filter((selectedDay) => selectedDay !== day));
      return;
    }

    onChange([...selected, day]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {weekdayKeys.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggleDay(day)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-60 ${
            selected.includes(day)
              ? "bg-[#7CAE8E] text-white border-[#7CAE8E]"
              : "bg-white text-[#6B7280] border-[#E5E2DC] hover:border-[#7CAE8E]"
          }`}
        >
          {weekdayLabels[day]}
        </button>
      ))}
    </div>
  );
}
