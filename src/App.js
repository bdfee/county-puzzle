import { useEffect, useState, useRef } from 'react'
import { json } from 'd3'
import { isMobile } from 'react-device-detect'

import Puzzle from './components/puzzle'
import { non50StatesIds } from './dictionaries/state'
import { stateId } from './components/utilities'
import { setStorage, getStorage, doesStorageItemExist } from './services/localStorage'

import { snap, snapReverb } from './audio/index'
import './App.css'

function App() {
  const audioRef = useRef()
  const [baseTopology, setBaseTopology] = useState(null) // all static topo
  const [baseGeometry, setBaseGeometry] = useState(null) // US50 county / state geometry
  const [translatedCountyGeometry, setTranslatedCountyGeometry] = useState(null) // counties for rendering
  const [activeTranslations, setActiveTranslations] = useState({}) // piece translation state
  const [moveCount, setMoveCount] = useState(0)

  useEffect(() => {
    async function getBaseTopology() {
      try {
        // fetch topojson
        const topologyData = await json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')
        // filter out districts and territories, set base geometry of 50 US states
        setBaseGeometry(
          (topologyData.objects = {
            counties: topologyData.objects.counties.geometries.filter(({ id }) =>
              !non50StatesIds.includes(stateId(id)) ? true : false
            ),
            states: topologyData.objects.states.geometries.filter(({ id }) =>
              !non50StatesIds.includes(stateId(id)) ? true : false
            )
          })
        )
        // remove national geometry from rest of topology data
        delete topologyData.objects
        setBaseTopology(topologyData)
      } catch (error) {
        console.log(error)
      }
    }
    getBaseTopology()
  }, [])

  // we store or generate only the x,y coordinate of the translation. Once basetopology is loaded, set translations for each county
  useEffect(() => {
    if (baseTopology) initializeTranslations()
  }, [baseTopology])

  // setting local storage periodically
  useEffect(() => {
    if (moveCount >= 9) {
      setStorage(activeTranslations)
      setMoveCount(0)
    }
  }, [moveCount])

  // set local storage on unload
  addEventListener('beforeunload', () => {
    if (moveCount) {
      setStorage(activeTranslations)
    }
  })

  const randomTranslation = () => {
    const scatterFactor = 50
    const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
    const randomNumber = () => Math.floor(Math.random() * scatterFactor * randomNegative())
    return [randomNumber(), randomNumber()]
  }

  const loadStoredTranslations = () => {
    const storedTranslations = getStorage()
    setActiveTranslations(storedTranslations)

    return baseGeometry.counties.map((county) => {
      county.properties.transpose = storedTranslations[stateId(county.id)][county.id]
      return county
    })
  }

  const generateNewTranslations = () => {
    const translationStore = {}
    const addTranslationToStore = (county, translation) => {
      const state = stateId(county.id)
      if (state in translationStore) {
        translationStore[state][county.id] = translation
        translationStore[state].count++
      } else {
        translationStore[state] = { [county.id]: translation, count: 1 }
      }
    }

    const countyGeometry = baseGeometry.counties.map((county) => {
      const translation = randomTranslation()
      addTranslationToStore(county, translation)
      county.properties.transpose = translation
      return county
    })

    setActiveTranslations(translationStore)
    return countyGeometry
  }

  const initializeTranslations = () => {
    if (doesStorageItemExist()) {
      setTranslatedCountyGeometry(loadStoredTranslations())
    } else {
      setTranslatedCountyGeometry(generateNewTranslations())
    }
  }

  const resetTranslations = () => {
    setTranslatedCountyGeometry(generateNewTranslations())
  }

  // if translation = 0,0 play sound. if it is the final county to be located in a given state, play reverbsnap
  const updateTranslations = (id, [x, y]) => {
    const updatedCoords = activeTranslations
    updatedCoords[stateId(id)][id] = [x, y]
    if (x === 0 && y === 0) {
      updatedCoords[stateId(id)].count--
      handlePlay(updatedCoords[stateId(id)].count)
    }
    setActiveTranslations(updatedCoords)
    setMoveCount((moveCount) => moveCount + 1)
  }

  const handlePlay = (count) => {
    const audio = audioRef.current
    audio.src = count === 0 ? snapReverb : snap
    audio.currentTime = 0.3
    audio.play()
  }

  if (isMobile) {
    return <div>This content is currently supported for desktop</div>
  }
  return (
    <div className="App">
      {translatedCountyGeometry && (
        <Puzzle
          updateTranslations={updateTranslations}
          resetTranslations={resetTranslations}
          baseTopology={baseTopology}
          stateGeometry={baseGeometry.states}
          translatedCountyGeometry={translatedCountyGeometry}
        />
      )}
      <audio ref={audioRef}>
        <source type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
