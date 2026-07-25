export const intensityColor = (v: number) => {
  if (v <= 2) return "#166534";
  if (v <= 5) return "#92400E";
  if (v <= 8) return "#C2410C";
  return "#991B1B";
};

export const intensityLabel = (v: number) => {
  if (v <= 2) return "Mild";
  if (v <= 5) return "Moderate";
  if (v <= 8) return "Severe";
  return "Very Severe";
};
