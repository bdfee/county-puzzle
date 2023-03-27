export const stateId = (id) => id.substring(0, 2)

export const randomTranslation = () => {
  const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
  const randomNumber = () => Math.floor(Math.random() * 100 * randomNegative())
  return [randomNumber(), randomNumber()]
}
