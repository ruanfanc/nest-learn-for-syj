export function returnEmptyIfValueEmpty<K extends string, T>(key: K, value: T) {
  if (value) {
    return { [key]: value };
  }
  return {};
}

export function joinStringSet(
  originValueKey: string,
  newItem: string | number,
) {
  return `CONCAT(IFNULL(${originValueKey}, ''), '${newItem},')`;
}
