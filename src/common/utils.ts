export function returnEmptyIfValueEmpty<K extends string, T>(key: K, value: T) {
  if (value) {
    return { [key]: value };
  }
  return {};
}
