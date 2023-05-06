import { getStorage, doesStorageItemExist } from '../services/localStorage'
import { stateId } from './utilities'

// Generates a random translation for each county geometry
const randomTranslation = () => {
  const scatterFactor = 50
  const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
  const randomNumber = () => Math.floor(Math.random() * scatterFactor * randomNegative())
  return [randomNumber(), randomNumber()]
}

// Loads stored translations from local storage and applies them to the county geometries
const loadStoredTranslations = (setTranslations, baseGeometry) => {
  const storedTranslations = getStorage()
  setTranslations(storedTranslations)

  // Apply the translations to each county geometry and return the modified geometry array
  return baseGeometry.counties.map((county) => {
    // Retrieve the translation for the current county from the storedTranslations object
    county.properties.transpose = storedTranslations[stateId(county.id)][county.id]
    return county
  })
}

// Generates new translations for each county geometry
export const generateNewTranslations = (setTranslations, baseGeometry) => {
  const translationStore = {}

  // Adds a translation to the translationStore object for the current county
  const addTranslationToStore = (county, translation) => {
    const state = stateId(county.id)
    if (state in translationStore) {
      translationStore[state][county.id] = translation
      translationStore[state].count++
    } else {
      translationStore[state] = { [county.id]: translation, count: 1 }
    }
  }

  // Generate a random translation for each county geometry and add it to the translationStore object
  const countyGeometry = baseGeometry.counties.map((county) => {
    const translation = randomTranslation()
    addTranslationToStore(county, translation)
    county.properties.transpose = translation
    return county
  })

  // Set the translations in state using setTranslations and return the modified geometry array
  setTranslations(translationStore)
  return countyGeometry
}

// Initializes translations by loading stored translations if they exist, or generating new translations if they don't
export const initializeTranslations = (
  setTranslatedCountyGeometry,
  setActiveTranslations,
  baseGeometry
) => {
  if (doesStorageItemExist()) {
    setTranslatedCountyGeometry(loadStoredTranslations(setActiveTranslations, baseGeometry))
  } else {
    setTranslatedCountyGeometry(generateNewTranslations(setActiveTranslations, baseGeometry))
  }
}
