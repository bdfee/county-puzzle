import { useState, Suspense, lazy } from 'react'
import ToolTip from './tooltip'
const LazySvgPieces = lazy(() => import('./svgPieces.js'))

const Puzzle = ({
  updateTranslations,
  translatedCountyGeometry,
  baseTopology,
  stateGeometry,
  stateFilter
}) => {
  // const [stateFilter, setStateFilter] = useState('')
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  // handlers for setting tool tip
  const handlers = {
    mouseOver(pageX, pageY, properties) {
      setTooltipCoords([pageX, pageY])
      setTooltipText(properties.name)
    },
    mouseMove(pageX, pageY) {
      setTooltipCoords([pageX, pageY])
    },
    mouseOut() {
      setTooltipText('')
    }
  }

  return (
    <div>
      <Suspense fallback={<div>loading...</div>}>
        <LazySvgPieces
          setTooltipText={setTooltipText}
          updateTranslations={updateTranslations}
          translatedCountyGeometry={translatedCountyGeometry}
          baseTopology={baseTopology}
          stateGeometry={stateGeometry}
          stateFilter={stateFilter}
          handlers={handlers}
        />
      </Suspense>
      {tooltipText.length ? <ToolTip text={tooltipText} coords={tooltipCoords} /> : ''}
    </div>
  )
}

export default Puzzle
