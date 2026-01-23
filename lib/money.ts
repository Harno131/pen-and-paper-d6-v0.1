export const formatCopper = (copper: number | undefined | null): string => {
  const total = Math.max(0, Number.isFinite(copper) ? Math.floor(Number(copper)) : 0)
  const gold = Math.floor(total / 100)
  const silver = Math.floor((total % 100) / 10)
  const rest = total % 10
  return `${gold}g ${silver}s ${rest}k`
}
