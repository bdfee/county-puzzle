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
  const [countyGeometry, setCountyGeometry] = useState(null) // counties for rendering
  const [activePieceTranslations, setActivePieceTranslations] = useState({}) // piece translation state
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

  // set puzzle piece translations to counties
  const setCountyGeometryTranslations = () => {
    let translatedCountyGeometry

    // check for existing coordinates in local storage
    if (doesStorageItemExist()) {
      const storedTranslations = getStorage()
      setActivePieceTranslations(storedTranslations)

      // apply local translation to counties
      translatedCountyGeometry = baseGeometry.counties.map((county) => {
        county.properties.transpose = storedTranslations[stateId(county.id)][county.id]
        return county
      })
    } else {
      const translationStorage = {}

      const scatterFactor = 40
      const randomTranslation = () => {
        const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
        const randomNumber = () => Math.floor(Math.random() * scatterFactor * randomNegative())
        return [randomNumber(), randomNumber()]
      }
      // apply random translation to each county coords
      translatedCountyGeometry = baseGeometry.counties.map((county) => {
        const translation = randomTranslation()
        county.properties.transpose = translation

        // while mapping counties, populate local storage obj with translation
        const { id } = county
        if (stateId(id) in translationStorage) {
          translationStorage[stateId(id)][id] = translation
          translationStorage[stateId(id)].count++
        } else {
          translationStorage[stateId(id)] = { [id]: translation, count: 0 }
        }

        return county
      })
      setActivePieceTranslations(translationStorage)
    }
    setCountyGeometry(translatedCountyGeometry)
  }

  useEffect(() => {
    if (baseTopology) setCountyGeometryTranslations()
  }, [baseTopology])

  // local storage on unload
  addEventListener('beforeunload', () => {
    if (moveCount) {
      setStorage(activePieceTranslations)
    }
  })

  // every ten moves set local storage
  useEffect(() => {
    if (moveCount >= 9) {
      setStorage(activePieceTranslations)
      setMoveCount(0)
    }
  }, [moveCount])

  const updateTranslations = (id, coordsArr) => {
    const updatedCoords = activePieceTranslations
    updatedCoords[stateId(id)][id] = coordsArr
    if (coordsArr[0] === 0 && coordsArr[1] === 0) {
      updatedCoords[stateId(id)].count--
      if (updatedCoords[stateId(id)].count === -1) {
        handlePlay(snapReverb, 0.3)
      } else {
        handlePlay(snap, 0.3)
      }
    }
    setActivePieceTranslations(updatedCoords)
    setMoveCount((moveCount) => moveCount + 1)
  }

  const handlePlay = (src, currentTime) => {
    const audio = audioRef.current
    audio.src = src
    audio.currentTime = currentTime
    audio.play()
  }

  if (isMobile) {
    return <div>This content is currently supported for desktop</div>
  }
  return (
    <div className="App">
      {countyGeometry && (
        <Puzzle
          updateTranslations={updateTranslations}
          setCountyGeometryTranslations={setCountyGeometryTranslations}
          baseTopology={baseTopology}
          stateGeometry={baseGeometry.states}
          countyGeometry={countyGeometry}
        />
      )}
      <audio ref={audioRef}>
        <source type="audio/mpeg" />
      </audio>
    </div>
  )
}

export default App
