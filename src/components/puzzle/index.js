import { useState, Suspense, lazy } from 'react'
import ToolTip from './tooltip'
const LazySvgPieces = lazy(() => import('./svg-pieces.js'))

const Puzzle = ({
  updateTranslations,
  translatedCountyGeometry,
  baseTopology,
  stateGeometry,
  stateFilter
}) => {
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  // handlers for setting react tool tip
  const toolTipHandlers = {
    showTip(pageX, pageY, { name }) {
      setTooltipCoords([pageX, pageY])
      setTooltipText(name)
    },
    moveTip(pageX, pageY) {
      setTooltipCoords([pageX, pageY])
    },
    clearTip() {
      setTooltipText('')
    }
  }

  return (
    <div>
      <Suspense fallback={<div>loading puzzle...</div>}>
        <LazySvgPieces
          updateTranslations={updateTranslations}
          translatedCountyGeometry={translatedCountyGeometry}
          baseTopology={baseTopology}
          stateGeometry={stateGeometry}
          stateFilter={stateFilter}
          setTooltipText={setTooltipText}
          toolTipHandlers={toolTipHandlers}
        />
      </Suspense>
      {tooltipText.length ? <ToolTip text={tooltipText} coords={tooltipCoords} /> : ''}
    </div>
  )
}

export default Puzzle
