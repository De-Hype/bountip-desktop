const getWidthClass = (width: string | number) => {
  if (typeof width === "number") return `w-[${width}%]`;
  switch (width) {
    case "sm":
      return "w-[50%]";
    case "md":
      return "w-[70%]";
    case "lg":
      return "w-[80%]";
    case "xl":
      return "w-[90%]";
    case "full":
      return "w-full";
    default:
      return "w-[70%]";
  }
};
export default getWidthClass;
