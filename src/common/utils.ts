export function returnEmptyIfValueEmpty<K extends string, T>(key: K, value: T) {
  if (value) {
    return { [key]: value };
  }
  return {};
}

export function joinStringSet(orignSet: string, newItem: string | number) {
  return orignSet ? `${orignSet},${newItem}` : `${newItem}`;
}
