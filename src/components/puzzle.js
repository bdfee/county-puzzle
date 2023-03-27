import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import StateFilter from './state-filter'
import ToolTip from './tool-tip'
import { stateDictionary } from '../dictionaries/state'
import { stateId } from '../utilities'
import '../App.css'

const Puzzle = ({
  updateCurrentTranslations,
  countyGeometry,
  baseTopology,
  stateGeometry,
  reset
}) => {
  const mapRef = useRef()
  const [filteredStates, setFilteredStates] = useState('')
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  const dragHandler = d3
    .drag()
    .on('start', function () {
      setTooltipText('')
      // class active to bring to the top, remove tooltip
      d3.select(this).raise().classed('active', true)
      // remove tool tip on other counties
      d3.selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      // Get the current transform value
      const transform = d3.select(this).node().transform.baseVal[0].matrix
      const changeX = transform.e
      const changeY = transform.f
      // add the new translation values to dx
      d3.select(this).attr('transform', `translate(${changeX + dx},${changeY + dy})`)
    })
    .on('end', function (d) {
      d3.select(this).classed('active', false)
      // add tool tips
      d3.selectAll('.county').attr('pointer-events', 'all')
      // if county translate is 0 0, it is located correctly

      const coords = d3
        .select(this)
        .attr('transform')
        .match(/-?\d+(\.\d+)?/g)

      const [x, y] = [+coords[0], +coords[1]]
      updateCurrentTranslations(d.subject.id, [x, y])

      if (x === 0 && y === 0) {
        // remove drag handler and adjust stroke style when correctly located
        d3.select(this)
          .classed('located', true)
          .attr('stroke-width', 0.1)
          .attr('stroke', 'lightgray')
          .on('.drag', null)
      }
    })

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

  const width = window.outerWidth
  const height = window.outerHeight

  useEffect(() => {
    // remove any svg el from previous render
    d3.select(mapRef.current).selectAll('*').remove()

    const counties = { type: 'GeometryCollection' }
    const states = { type: 'GeometryCollection' }

    if (filteredStates.length) {
      counties.geometries = countyGeometry.filter(({ id }) =>
        filteredStates.includes(stateId(id)) ? true : false
      )
      states.geometries = stateGeometry.filter(({ id }) =>
        filteredStates.includes(stateId(id)) ? true : false
      )
    } else {
      counties.geometries = countyGeometry
      states.geometries = stateGeometry
    }

    // geoAlbersUSA projection, center on window/svg
    const projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1200)

    // Create a path generator that converts GeoJSON geometries to SVG path elements
    const pathGenerator = d3.geoPath().projection(projection)

    const svg = d3
      .select(mapRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    svg
      .selectAll('.state')
      .data(topojson.feature(baseTopology, states).features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', pathGenerator)
      .attr('fill', ({ id }) => stateDictionary[id].color)
      .attr('id', ({ id }) => `${id}`)

    // Create a path element for each count
    const countyPaths = svg
      .selectAll('.county')
      .data(topojson.feature(baseTopology, counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('d', pathGenerator)
      .attr('stroke', ({ id }) => stateDictionary[stateId(id)].color)
      .attr('stroke-width', 0.25)
      .attr('fill', 'lightgray')
      .attr('id', ({ id }) => `county-id-${id}`)
      .attr('data-state-id', ({ id }) => `state-id-${stateId(id)}`)
      .attr('data-name', ({ properties }) => `${properties.name}`)
      .attr(
        'transform',
        ({ properties }) => `translate(${properties.transpose[0]}, ${properties.transpose[1]})`
      )
      .on('mouseover', (e, d) => handleMouseOver(e, d))
      .on('mousemove', (e) => handleMouseMove(e))
      .on('mouseout', handleMouseOut)

    countyPaths.call(dragHandler)
  }, [countyGeometry, filteredStates])

  return (
    <div>
      <StateFilter setFilter={setFilteredStates} />
      <button onClick={() => reset()}>reset local</button>
      {tooltipText.length ? <ToolTip text={tooltipText} coords={tooltipCoords} /> : ''}
      <div ref={mapRef}></div>
    </div>
  )
}

export default Puzzle
