import { useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { browserName } from 'react-device-detect'

import { select, selectAll } from 'd3-selection'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { drag } from 'd3-drag'
import { feature } from 'topojson-client'

import { stateDictionary } from '../../dictionaries/state'
import { stateId } from '../utilities'

const Pieces = ({
  countyGeometry,
  stateGeometry,
  baseTopology,
  stateFilter,
  handleMouseMove,
  handleMouseOut,
  handleMouseOver,
  setTooltipText,
  updateTranslations
}) => {
  const mapRef = useRef()
  const transformRef = useRef()

  // checks if target's transform values are within threshold to be considered located
  // optionally returns the x, y values as number
  const transformUtility = (selection, withReturn = true) => {
    const threshold = 0.75
    const [x, y] = selection.attr('transform').match(/-?\d+(\.\d+)?/g)
    if (Math.abs(+x) < threshold && Math.abs(+y) < threshold) {
      applyLocatedAttr(selection)
      if (withReturn) return [0, 0]
    } else if (withReturn) return [+x, +y]
  }

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

  const dragHandlerChrome = drag()
    .on('start', function () {
      setTooltipText('')
      select(this).raise()
      selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      const { e: startX, f: startY } = select(this).node().transform.baseVal[0].matrix
      select(this).attr('transform', `translate(${startX + dx},${startY + dy})`)

      // Log the new transform string
    })
    .on('end', function (d) {
      updateTranslations(d.subject.id, transformUtility(select(this)))
      selectAll('.county').attr('pointer-events', 'all')
    })

  const dragHandlerFirefox = drag()
    .on('start', function () {
      setTooltipText('')
      select(this).raise()
      selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      const transformMatrix = select(this).node().transform.baseVal[0].matrix
      const { e: translateX, f: translateY } = transformMatrix
      const scaleX = transformMatrix.a
      const scaleY = transformMatrix.d
      // get scale from react zoom pan pinch
      const zoomScale = transformRef.current.instance.transformState.scale
      // Calculate the new scaled translation
      const scaledDx = dx / scaleX / zoomScale
      const scaledDy = dy / scaleY / zoomScale

      const newX = translateX + scaledDx
      const newY = translateY + scaledDy

      select(this).attr('transform', `translate(${newX},${newY})`)

      // Log the new transform string
    })
    .on('end', function (d) {
      updateTranslations(d.subject.id, transformUtility(select(this)))
      selectAll('.county').attr('pointer-events', 'all')
    })

  useEffect(() => {
    // remove any svg el from previous render
    select(mapRef.current).selectAll('*').remove()

    const width = window.outerWidth
    const height = window.outerHeight

    const counties = { type: 'GeometryCollection', geometries: countyGeometry }
    const states = { type: 'GeometryCollection', geometries: stateGeometry }

    // geoAlbersUSA projection, center on window/svg
    const projection = geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(900)

    // Create a path generator that converts GeoJSON geometries to SVG path elements
    const pathGenerator = geoPath().projection(projection)

    const svg = select(mapRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    svg
      .selectAll('.state')
      .data(feature(baseTopology, states).features)
      .enter()
      .append('path')
      .attr('class', 'state')
      .attr('d', pathGenerator)
      .attr('fill', ({ id }) => stateDictionary[id].color)
      .attr('id', ({ id }) => `state-${id}`)

    // Create a path element for each count
    const countyPaths = svg
      .selectAll('.county')
      .data(feature(baseTopology, counties).features)
      .enter()
      .append('path')
      .attr('class', 'county')
      .attr('d', pathGenerator)
      .attr('stroke', ({ id }) => stateDictionary[stateId(id)].color)
      .attr('stroke-width', 0.15)
      .attr('fill', 'lightgray')
      .attr('id', ({ id }) => `county-${id}`)
      .attr('state-id', ({ id }) => `${stateId(id)}`)
      .attr('data-name', ({ properties }) => `${properties.name}`)
      .attr('is-hidden', false)
      .attr(
        'transform',
        ({
          properties: {
            transpose: [x, y]
          }
        }) => `translate(${x}, ${y})`
      )
      .on('mouseover', function (e, d) {
        if (select(this).attr('is-hidden') === 'false') {
          handleMouseOver(e, d)
        }
      })
      .on('mousemove', (e) => handleMouseMove(e))
      .on('mouseout', handleMouseOut)

    const dragHandler = browserName === 'Chrome' ? dragHandlerChrome : dragHandlerFirefox

    countyPaths.call(dragHandler).each(function () {
      transformUtility(select(this), false)
    })
  }, [countyGeometry])

  useEffect(() => {
    if (stateFilter) {
      const node = select(`#state-${stateFilter}`).node()
      transformRef.current.zoomToElement(node, 2, 500, 'easeOut')
    } else {
      transformRef.current.resetTransform(500, 'easeOut')
    }

    selectAll('.county, .state')
      .style('visibility', 'visible')
      .attr('pointer-events', 'all')
      .attr('is-hidden', false)
    if (stateFilter.length) {
      selectAll('.county, .state')
        .filter(({ id }) => (stateFilter.includes(stateId(id)) ? false : true))
        .style('visibility', 'hidden')
        .attr('pointer-events', 'none')
        .attr('is-hidden', true)
    }
  }, [stateFilter, countyGeometry])

  return (
    <TransformWrapper ref={transformRef}>
      <TransformComponent>
        <div ref={mapRef} className="pieces"></div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default Pieces
