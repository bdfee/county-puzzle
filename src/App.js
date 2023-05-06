import { useEffect, useState, useRef } from 'react'
import { json } from 'd3'
import { isMobile } from 'react-device-detect'

import Puzzle from './components/puzzle'
import { non50StatesIds } from './dictionaries/state'
import { stateId } from './components/utilities'
import { setStorage, clearStorage } from './services/localStorage'

import { generateNewTranslations, initializeTranslations } from './translation.helpers'
import { snap, snapReverb } from './audio/index'
import './App.css'

function App() {
  const audioRef = useRef()
  const baseGeometryRef = useRef(null)
  const baseTopologyRef = useRef(null)

  const [translatedCountyGeometry, setTranslatedCountyGeometry] = useState(null) // counties for rendering
  const [activeTranslations, setActiveTranslations] = useState({}) // piece translation state
  const [moveCount, setMoveCount] = useState(0)

  useEffect(() => {
    async function getBaseTopology() {
      try {
        // fetch topojson
        const topologyData = await json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')

        // filter out districts and territories leaving 50 US states and their counties
        // isolate geometry from topodata for processing
        baseGeometryRef.current = topologyData.objects = {
          counties: topologyData.objects.counties.geometries.filter(({ id }) =>
            !non50StatesIds.includes(stateId(id)) ? true : false
          ),
          states: topologyData.objects.states.geometries.filter(({ id }) =>
            !non50StatesIds.includes(stateId(id)) ? true : false
          )
        }
        // remove geometry from topology data
        delete topologyData.objects
        // store arcs, bbox, type, and map transform to be passed to d3 as-is
        baseTopologyRef.current = topologyData
        // load existing translations from local storage or generate new translations if no store
        initializeTranslations(
          setTranslatedCountyGeometry,
          setActiveTranslations,
          baseGeometryRef.current
        )
      } catch (error) {
        console.log(error)
      }
    }
    getBaseTopology()
  }, [])

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

  const resetTranslations = () => {
    clearStorage()
    setTranslatedCountyGeometry(
      generateNewTranslations(setActiveTranslations, baseGeometryRef.current)
    )
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
          baseTopology={baseTopologyRef.current}
          stateGeometry={baseGeometryRef.current.states}
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
