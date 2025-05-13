const hexToRGBA = (hex: string, opacity: number) => {
  if (!hex) {
    return "rgba(0, 0, 0, 0)";
  }
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default hexToRGBA;
