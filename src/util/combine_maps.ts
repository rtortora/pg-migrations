export function combineMaps<K extends string | number, V>(map1: Map<K, V>, map2: Map<K, V>): Map<K, V> {
  return new Map([...Array.from(map1.entries()), ...Array.from(map2.entries())]);
}
