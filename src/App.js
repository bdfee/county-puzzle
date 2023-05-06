import { useEffect, useState, useRef } from 'react'
import { json } from 'd3'
import { isMobile } from 'react-device-detect'

import Puzzle from './components/puzzle'
import AudioPlayer from './components/audio-player'
import Toolbar from './components/toolbar'

import { setStorage, clearStorage } from './services/localStorage'
import { non50StatesIds } from './helpers/state.dictionary'
import { generateNewTranslations, initializeTranslations } from './helpers/translation.helpers'
import { stateId } from './helpers/utilities'

import './App.css'

function App() {
  const baseGeometryRef = useRef(null)
  const baseTopologyRef = useRef(null)
  const audioPlayerRef = useRef()

  const [translatedCountyGeometry, setTranslatedCountyGeometry] = useState(null) // counties for rendering
  const [activeTranslations, setActiveTranslations] = useState({}) // piece translation state
  const [moveCount, setMoveCount] = useState(0)
  const [stateFilter, setStateFilter] = useState('')

  const [error, setError] = useState(null)

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
        try {
          initializeTranslations(
            setTranslatedCountyGeometry,
            setActiveTranslations,
            baseGeometryRef.current
          )
        } catch (error) {
          setError('error initializing puzzle pieces', error)
        }
      } catch (error) {
        setError('error fetching topology data', error)
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

  // update puzzle state, storage, and play audio for located pieces
  const updateTranslations = (id, [x, y]) => {
    const updatedCoords = activeTranslations
    updatedCoords[stateId(id)][id] = [x, y]
    if (x === 0 && y === 0) {
      updatedCoords[stateId(id)].count--
      audioPlayerRef.current.playAudio(updatedCoords[stateId(id)].count)
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

  if (isMobile) {
    return (
      <>
        <Toolbar />
        <div>This content is currently supported for desktop</div>
      </>
    )
  }

  if (error) {
    return (
      <div>
        <Toolbar />
        {`Error loading puzzle... ${error}`}
        <button onClick={() => window.location.reload()}>reload puzzle</button>
      </div>
    )
  }

  return (
    <div className="App">
      <Toolbar
        setStateFilter={setStateFilter}
        stateFilter={stateFilter}
        resetTranslations={resetTranslations}
      />
      {translatedCountyGeometry && (
        <Puzzle
          updateTranslations={updateTranslations}
          resetTranslations={resetTranslations}
          baseTopology={baseTopologyRef.current}
          stateGeometry={baseGeometryRef.current.states}
          translatedCountyGeometry={translatedCountyGeometry}
          stateFilter={stateFilter}
        />
      )}
      <AudioPlayer ref={audioPlayerRef} />
    </div>
  )
}

export default App
