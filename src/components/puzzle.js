import { useState, Suspense, lazy } from 'react'
// import * as topojson from 'topojson-client'
import StateFilter from './state-filter'
import ToolTip from './tool-tip'
// import { stateDictionary } from '../dictionaries/state'
// import { stateId } from '../utilities'
import '../App.css'
const LazyPieces = lazy(() => import('./pieces.js'))

const Puzzle = ({
  updateCurrentTranslations,
  countyGeometry,
  baseTopology,
  stateGeometry,
  reset
}) => {
  // const mapRef = useRef()
  const [filteredStates, setFilteredStates] = useState('')
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  // // regex transform coordinates, if 0,0 style located, optional return value
  // const transformUtility = (target, withReturn = true) => {
  //   const [x, y] = target.attr('transform').match(/-?\d+(\.\d+)?/g)
  //   if (+x === 0 && +y === 0) located(target)
  //   if (withReturn) return [+x, +y]
  // }

  // const located = (target) => {
  //   target.attr('stroke-width', 0.1).attr('stroke', 'lightgray').on('.drag', null).lower()
  //   d3.select(`#state-${target.attr('state-id')}`).lower()
  // }

  // const dragHandler = d3
  //   .drag()
  //   .on('start', function () {
  //     setTooltipText('')
  //     d3.select(this).raise()
  //     d3.selectAll('.county').attr('pointer-events', 'none')
  //   })
  //   .on('drag', function ({ dx, dy }) {
  //     const { e: changeX, f: changeY } = d3.select(this).node().transform.baseVal[0].matrix
  //     d3.select(this).attr('transform', `translate(${changeX + dx},${changeY + dy})`)
  //   })
  //   .on('end', function (d) {
  //     d3.selectAll('.county').attr('pointer-events', 'all')
  //     updateCurrentTranslations(d.subject.id, transformUtility(d3.select(this)))
  //   })

  function handleMouseOver(e, d) {
    setTooltipCoords([e.offsetX, e.offsetY])
    setTooltipText(d.properties.name)
  }

  function handleMouseMove(e) {
    setTooltipCoords([e.offsetX, e.offsetY])
  }

  function handleMouseOut() {
    setTooltipText('')
  }

  // useEffect(() => {
  //   // remove any svg el from previous render
  //   d3.select(mapRef.current).selectAll('*').remove()

  //   const width = window.outerWidth
  //   const height = window.outerHeight

  //   const counties = { type: 'GeometryCollection', geometries: countyGeometry }
  //   const states = { type: 'GeometryCollection', geometries: stateGeometry }

  //   // geoAlbersUSA projection, center on window/svg
  //   const projection = d3
  //     .geoAlbersUsa()
  //     .translate([width / 2, height / 2])
  //     .scale(1200)

  //   // Create a path generator that converts GeoJSON geometries to SVG path elements
  //   const pathGenerator = d3.geoPath().projection(projection)

  //   const svg = d3
  //     .select(mapRef.current)
  //     .append('svg')
  //     .attr('width', width)
  //     .attr('height', height)
  //     .attr('viewBox', `0 0 ${width} ${height}`)

  //   svg
  //     .selectAll('.state')
  //     .data(topojson.feature(baseTopology, states).features)
  //     .enter()
  //     .append('path')
  //     .attr('class', 'state')
  //     .attr('d', pathGenerator)
  //     .attr('fill', ({ id }) => stateDictionary[id].color)
  //     .attr('id', ({ id }) => `state-${id}`)

  //   // Create a path element for each count
  //   const countyPaths = svg
  //     .selectAll('.county')
  //     .data(topojson.feature(baseTopology, counties).features)
  //     .enter()
  //     .append('path')
  //     .attr('class', 'county')
  //     .attr('d', pathGenerator)
  //     .attr('stroke', ({ id }) => stateDictionary[stateId(id)].color)
  //     .attr('stroke-width', 0.25)
  //     .attr('fill', 'lightgray')
  //     .attr('id', ({ id }) => `county-${id}`)
  //     .attr('state-id', ({ id }) => `${stateId(id)}`)
  //     .attr('data-name', ({ properties }) => `${properties.name}`)
  //     .attr(
  //       'transform',
  //       ({
  //         properties: {
  //           transpose: [x, y]
  //         }
  //       }) => `translate(${x}, ${y})`
  //     )
  //     .on('mouseover', (e, d) => handleMouseOver(e, d))
  //     .on('mousemove', (e) => handleMouseMove(e))
  //     .on('mouseout', handleMouseOut)
  //     .on('end', console.log('end'))

  //   countyPaths.call(dragHandler).each(function () {
  //     transformUtility(d3.select(this), false)
  //   })
  // }, [countyGeometry])

  // useEffect(() => {
  //   if (filteredStates.length) {
  //     d3.selectAll('.county, .state')
  //       .filter(({ id }) => (filteredStates.includes(stateId(id)) ? false : true))
  //       .style('visibility', 'hidden')
  //   } else {
  //     d3.selectAll('.county, .state').style('visibility', 'visible')
  //   }
  // }, [filteredStates])

  return (
    <div>
      <StateFilter setFilter={setFilteredStates} />
      <button onClick={() => reset()}>reset local</button>
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
      {/* <div ref={mapRef}></div> */}
    </div>
  )
}

export default Puzzle
