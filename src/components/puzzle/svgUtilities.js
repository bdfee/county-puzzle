import { select, selectAll } from 'd3-selection'
import { stateId } from '../utilities'

// pass a d3 selection, applys 'located' attributes
// lowers the county to the bottom then lowers the state to bottom
const applyLocatedAttr = (selection) => {
  selection
    .attr('transform', 'translate(0,0)')
    .attr('stroke-width', 0.1)
    .attr('stroke', 'lightgray')
    .attr('fill', 'slategray')
    .on('.drag', null)
    .lower()

  select(`#state-${selection.attr('state-id')}`).lower()
}

// checks if target's transform values are within threshold to be considered located
// optionally returns the x, y values as number
export const transformUtility = (selection, withReturn = true) => {
  const threshold = 0.75
  const [x, y] = selection.attr('transform').match(/-?\d+(\.\d+)?/g)
  if (Math.abs(+x) < threshold && Math.abs(+y) < threshold) {
    applyLocatedAttr(selection)
    if (withReturn) return [0, 0]
  } else if (withReturn) return [+x, +y]
}

// sets visibility attributes of counties by state
export const filterStates = (stateFilter) => {
  selectAll('.county, .state')
    .style('visibility', 'visible')
    .attr('pointer-events', 'all')
    .attr('is-hidden', false)
  if (stateFilter) {
    selectAll('.county, .state')
      .filter(({ id }) => (stateFilter.includes(stateId(id)) ? false : true))
      .style('visibility', 'hidden')
      .attr('pointer-events', 'none')
      .attr('is-hidden', true)
  }
}
// if state filter is selected, update zoom pan pinch to state node coords
export const updateZoom = (transformRef, stateFilter) => {
  if (stateFilter) {
    const node = select(`#state-${stateFilter}`).node()
    transformRef.current.zoomToElement(node, 4, 500, 'easeOut')
  } else {
    transformRef.current.resetTransform(500, 'easeOut')
  }
}
