import { useState, Suspense, lazy } from 'react'
// import StateFilter from './state-filter'
import Toolbar from './toolbar'
import ToolTip from './tool-tip'
import '../App.css'

const LazyPieces = lazy(() => import('./pieces.js'))

const Puzzle = ({
  updateCurrentTranslations,
  countyGeometry,
  baseTopology,
  stateGeometry,
  reset
}) => {
  const [filteredStates, setFilteredStates] = useState('')
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  function handleMouseOver(e, d) {
    setTooltipCoords([e.pageX, e.pageY])
    setTooltipText(d.properties.name)
  }

  function handleMouseMove(e) {
    setTooltipCoords([e.pageX, e.pageY])
  }

  function handleMouseOut() {
    setTooltipText('')
  }

  return (
    <div>
      {/* <StateFilter setFilter={setFilteredStates} />
      <button onClick={() => reset()}>reset local</button> */}
      <Toolbar reset={reset} setFilteredStates={setFilteredStates} />
      <Suspense fallback={<div>loading...</div>}>
        <LazyPieces
          setTooltipText={setTooltipText}
          updateCurrentTranslations={updateCurrentTranslations}
          countyGeometry={countyGeometry}
          baseTopology={baseTopology}
          stateGeometry={stateGeometry}
          filteredStates={filteredStates}
          handleMouseMove={handleMouseMove}
          handleMouseOut={handleMouseOut}
          handleMouseOver={handleMouseOver}
        />
      </Suspense>
      {tooltipText.length ? <ToolTip text={tooltipText} coords={tooltipCoords} /> : ''}
    </div>
  )
}

export default Puzzle
