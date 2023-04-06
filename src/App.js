import { useEffect, useState, useRef } from 'react'
import * as d3 from 'd3'
import Puzzle from './components/puzzle'
import { non50StatesIds } from './dictionaries/state'
import { stateId, randomTranslation } from './utilities'
import { clear, setItem, getItem, doesItemExist } from './services/localStorage'
import { snap, snapReverb } from './audio/index'

function App() {
  const audioRef = useRef()

  const [baseTopology, setBaseTopology] = useState(null) // all static topo
  const [baseGeometry, setBaseGeometry] = useState(null) // US50 county / state geometry
  const [countyGeometry, setCountyGeometry] = useState(null) //
  const [currentTranslations, setCurrentTranslations] = useState({})
  const [moveCount, setMoveCount] = useState(0)

  useEffect(() => {
    async function getBaseTopology() {
      try {
        // fetch topojson
        const topologyData = await d3.json(
          'https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json'
        )
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

  const setCountyGeometryCoordinates = () => {
    let countyGeometry
    // check for existing coordinates in local storage
    if (doesItemExist()) {
      const localStorageCoords = getItem()
      setCurrentTranslations(localStorageCoords)
      // apply local translation to counties
      countyGeometry = baseGeometry.counties.map((county) => {
        county.properties.transpose = localStorageCoords[stateId(county.id)][county.id]
        return county
      })
    } else {
      const localStorageObj = {}
      // apply random translation to each county coords
      countyGeometry = baseGeometry.counties.map((county) => {
        const translation = randomTranslation()
        county.properties.transpose = translation

        // while mapping counties, populate local storage obj with translation
        const { id } = county
        if (stateId(id) in localStorageObj) {
          localStorageObj[stateId(id)][id] = translation
          localStorageObj[stateId(id)].count++
        } else {
          localStorageObj[stateId(id)] = { [id]: translation, count: 0 }
        }

        return county
      })
      setCurrentTranslations(localStorageObj)
    }
    setCountyGeometry(countyGeometry)
  }

  useEffect(() => {
    if (baseTopology) setCountyGeometryCoordinates()
  }, [baseTopology])

  // local storage on unload
  addEventListener('beforeunload', () => {
    if (moveCount) {
      setItem(currentTranslations)
    }
  })

  // every ten moves set local storage
  useEffect(() => {
    if (moveCount >= 10) {
      setItem(currentTranslations)
      setMoveCount(0)
    }
  }, [moveCount])

  const updateCurrentTranslations = (id, coordsArr) => {
    const updatedCoords = currentTranslations
    updatedCoords[stateId(id)][id] = coordsArr
    if (coordsArr[0] === 0 && coordsArr[1] === 0) {
      updatedCoords[stateId(id)].count--
      console.log(updatedCoords[stateId(id)])
      if (updatedCoords[stateId(id)].count === -1) {
        handlePlay(snapReverb, 0.3)
      } else {
        handlePlay(snap, 0.3)
      }
    }
    setCurrentTranslations(updatedCoords)
    setMoveCount((moveCount) => moveCount + 1)
  }

  const handlePlay = (src, currentTime) => {
    const audio = audioRef.current
    audio.src = src
    audio.currentTime = currentTime
    audio.play()
  }

  const handleReset = () => {
    clear()
    setCountyGeometryCoordinates()
  }

  return (
    <div className="App">
      <audio ref={audioRef}>
        <source type="audio/mpeg" />
      </audio>
      {countyGeometry && (
        <Puzzle
          updateCurrentTranslations={updateCurrentTranslations}
          currentTranslations={currentTranslations}
          baseTopology={baseTopology}
          stateGeometry={baseGeometry.states}
          countyGeometry={countyGeometry}
          reset={handleReset}
        />
      )}
    </div>
  )
}

export default App
