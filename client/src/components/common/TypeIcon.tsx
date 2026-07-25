import { Pill, Scissors, Syringe, Zap } from "lucide-react";

export function TypeIcon({ type }: { type: string }) {
  if (type === "chemotherapy") return <Syringe size={14} className="text-[#7CAE8E]" />;
  if (type === "radiation") return <Zap size={14} className="text-amber-500" />;
  if (type === "surgery") return <Scissors size={14} className="text-blue-500" />;
  return <Pill size={14} className="text-gray-400" />;
}
