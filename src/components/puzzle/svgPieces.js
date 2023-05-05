import { useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { browserName } from 'react-device-detect'
import { select, selectAll } from 'd3-selection'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { drag } from 'd3-drag'
import { feature } from 'topojson-client'
import { stateDictionary } from '../../dictionaries/state'
import { stateId } from '../utilities'
import { transformUtility, filterStates, updateZoom } from './svgUtilities'

const Pieces = ({
  translatedCountyGeometry,
  stateGeometry,
  baseTopology,
  stateFilter,
  handlers,
  setTooltipText,
  updateTranslations
}) => {
  const mapRef = useRef()
  const transformRef = useRef()

  // chrome is automatically factoring in the scale factor from zoom pan pinch
  // the zoom factor needs to be accounted for when dragging
  const dragHandlerChrome = drag()
    .on('start', function () {
      setTooltipText('')
      select(this).raise()
      selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      const { e: startX, f: startY } = select(this).node().transform.baseVal[0].matrix
      select(this).attr('transform', `translate(${startX + dx},${startY + dy})`)
    })
    .on('end', function ({ subject }) {
      updateTranslations(subject.id, transformUtility(select(this)))
      selectAll('.county').attr('pointer-events', 'all')
    })

  // firefox needs the zoom factor from zoom pan pinch to be factored in manually
  // the zoom factor needs to be accounted for when dragging
  const dragHandlerFirefox = drag()
    .on('start', function () {
      setTooltipText('')
      select(this).raise()
      selectAll('.county').attr('pointer-events', 'none')
    })
    .on('drag', function ({ dx, dy }) {
      const transformMatrix = select(this).node().transform.baseVal[0].matrix
      const { e: translateX, f: translateY, a: scaleX, d: scaleY } = transformMatrix
      // get scale from react zoom pan pinch
      const zoomScale = transformRef.current.instance.transformState.scale
      // Calculate the scaled translation
      const scaledDx = dx / scaleX / zoomScale
      const scaledDy = dy / scaleY / zoomScale
      // calculate the new coords
      const newX = translateX + scaledDx
      const newY = translateY + scaledDy

      select(this).attr('transform', `translate(${newX},${newY})`)
    })
    .on('end', function ({ subject }) {
      updateTranslations(subject.id, transformUtility(select(this)))
      selectAll('.county').attr('pointer-events', 'all')
    })

  useEffect(() => {
    // remove any svg el from previous render
    select(mapRef.current).selectAll('*').remove()

    const width = window.outerWidth
    const height = window.outerHeight

    const counties = { type: 'GeometryCollection', geometries: translatedCountyGeometry }
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
      .on('mouseover', function ({ pageX, pageY }, { properties }) {
        if (select(this).attr('is-hidden') === 'false') {
          handlers.mouseOver(pageX, pageY, properties)
        }
      })
      .on('mousemove', ({ pageX, pageY }) => handlers.mouseMove(pageX, pageY))
      .on('mouseout', () => handlers.mouseOut())

    const dragHandler = browserName === 'Chrome' ? dragHandlerChrome : dragHandlerFirefox

    countyPaths.call(dragHandler).each(function () {
      transformUtility(select(this), false)
    })
  }, [translatedCountyGeometry])

  useEffect(() => {
    filterStates(stateFilter)
    updateZoom(transformRef, stateFilter)
  }, [stateFilter, translatedCountyGeometry])

  return (
    <TransformWrapper ref={transformRef}>
      <TransformComponent>
        <div ref={mapRef} className="pieces"></div>
      </TransformComponent>
    </TransformWrapper>
  )
}

export default Pieces
