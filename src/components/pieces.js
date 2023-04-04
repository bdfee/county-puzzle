import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { stateDictionary } from '../dictionaries/state'
import { stateId } from '../utilities'

const Pieces = ({
  countyGeometry,
  stateGeometry,
  baseTopology,
  filteredStates,
  handleMouseMove,
  handleMouseOut,
  handleMouseOver,
  setTooltipText,
  updateCurrentTranslations
}) => {
  const mapRef = useRef()

  const transformUtility = (target, withReturn = true) => {
    const [x, y] = target.attr('transform').match(/-?\d+(\.\d+)?/g)
    if (Math.abs(+x) < 0.25 && Math.abs(+y) < 0.25) {
      target.attr('transform', 'translate(0,0)')
      located(target)
      if (withReturn) return [0, 0]
    } else if (withReturn) return [+x, +y]
  }

  const located = (target) => {
    target
      .attr('stroke-width', 0.1)
      .attr('stroke', 'lightgray')
      .attr('fill', 'dark gray')
      .on('.drag', null)
      .lower()
    d3.select(`#state-${target.attr('state-id')}`).lower()
  }

  const dragHandler = d3
    .drag()
    .on('start', function () {
      setTooltipText('')
      d3.select(this).raise()
      d3.selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      const { e: startX, f: startY } = d3.select(this).node().transform.baseVal[0].matrix
      d3.select(this).attr('transform', `translate(${startX + dx},${startY + dy})`)
    })
    .on('end', function (d) {
      updateCurrentTranslations(d.subject.id, transformUtility(d3.select(this)))
      d3.selectAll('.county').attr('pointer-events', 'all')
    })

  useEffect(() => {
    // remove any svg el from previous render
    d3.select(mapRef.current).selectAll('*').remove()

    const width = window.outerWidth
    const height = window.outerHeight

    const counties = { type: 'GeometryCollection', geometries: countyGeometry }
    const states = { type: 'GeometryCollection', geometries: stateGeometry }

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
      .attr('id', ({ id }) => `state-${id}`)

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
      .attr('id', ({ id }) => `county-${id}`)
      .attr('state-id', ({ id }) => `${stateId(id)}`)
      .attr('data-name', ({ properties }) => `${properties.name}`)
      .attr(
        'transform',
        ({
          properties: {
            transpose: [x, y]
          }
        }) => `translate(${x}, ${y})`
      )
      .on('mouseover', (e, d) => handleMouseOver(e, d))
      .on('mousemove', (e) => handleMouseMove(e))
      .on('mouseout', handleMouseOut)

    countyPaths.call(dragHandler).each(function () {
      transformUtility(d3.select(this), false)
    })
  }, [countyGeometry])

  useEffect(() => {
    d3.selectAll('.county, .state').style('visibility', 'visible')
    if (filteredStates.length) {
      d3.selectAll('.county, .state')
        .filter(({ id }) => (filteredStates.includes(stateId(id)) ? false : true))
        .style('visibility', 'hidden')
    }
  }, [filteredStates])

  return (
    <TransformWrapper>
      <TransformComponent>
        <div ref={mapRef} className="pieces"></div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default Pieces
