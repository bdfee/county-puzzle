const key = 'puzzleCoords'

export const clearStorage = () => localStorage.clear()

export const setStorage = (item) => localStorage.setItem(key, JSON.stringify(item))

export const getStorage = () => JSON.parse(localStorage.getItem(key))

export const doesStorageItemExist = () => localStorage.getItem(key) !== null
