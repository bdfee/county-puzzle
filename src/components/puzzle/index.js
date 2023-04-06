import { useState, Suspense, lazy } from 'react'
import Toolbar from './toolbar/index'
import ToolTip from './tooltip'
const LazyPieces = lazy(() => import('./pieces.js'))

const Puzzle = ({
  updateTranslations,
  countyGeometry,
  baseTopology,
  stateGeometry,
  setCountyGeometryTranslations
}) => {
  const [stateFilter, setStateFilter] = useState('')
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
      <Toolbar
        setStateFilter={setStateFilter}
        stateFilter={stateFilter}
        setCountyGeometryTranslations={setCountyGeometryTranslations}
      />
      <Suspense fallback={<div>loading...</div>}>
        <LazyPieces
          setTooltipText={setTooltipText}
          updateTranslations={updateTranslations}
          countyGeometry={countyGeometry}
          baseTopology={baseTopology}
          stateGeometry={stateGeometry}
          stateFilter={stateFilter}
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
