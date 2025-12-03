export const formatCurrency = (value: number): string =>
  `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

export const formatChange = (value: number): string => {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}`;
};

export const createListItem = (content: string): HTMLLIElement => {
  const item = document.createElement("li");
  item.textContent = content;
  return item;
};
