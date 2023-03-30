const key = 'puzzleCoords'

export const clear = () => localStorage.clear()

export const setItem = (item) => localStorage.setItem(key, JSON.stringify(item))

export const getItem = () => JSON.parse(localStorage.getItem(key))

export const doesItemExist = () => localStorage.getItem(key) !== null
