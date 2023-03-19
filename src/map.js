import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import './App.css'

// scatter puzzle pieces
const randomTranslation = () => {
  const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
  const randomNumber = () => Math.floor(Math.random() * 100 * randomNegative())
  const translation = `translate(${randomNumber()},${randomNumber()})`
  return translation
}

function USMap() {
  const mapRef = useRef()
  const [topology, setTopology] = useState(null)
  const [puzzleProgress, setPuzzleProgress] = useState({})
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])

  const tooltipStyle = { left: tooltipCoords[0], top: tooltipCoords[1] }

  // update puzzle progress obj when county is located
  const updateProgress = (id) => {
    const state = id.substring(0, 2)
    setPuzzleProgress({ ...puzzleProgress, [state]: { ...puzzleProgress[state], [id]: true } })
  }

  const non50StatesIds = ['11', '60', '66', '69', '72', '78']

  useEffect(() => {
    async function getTopology() {
      try {
        // if no locale storage, setup
        // fetch topojson
        const usTopology = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')
        // filter out counties in territories and districts
        const fiftyStatesCountiesGeo = usTopology.objects.counties.geometries.filter((geo) => {
          const state = geo.id.substring(0, 2)
          return !non50StatesIds.includes(state) ? true : false
        })

        // filter out territories and districts
        const fiftyStatesGeo = usTopology.objects.states.geometries.filter(({ id }) => {
          return !non50StatesIds.includes(id) ? true : false
        })

        // add random coordinates to object
        const countiesGeo = fiftyStatesCountiesGeo.map((county) => {
          county.properties.initialTranspose = randomTranslation()
          return county
        })

        // trim down topology obj before setting state
        const filterTopology = {
          arcs: usTopology.arcs,
          bbox: usTopology.bbox,
          objects: {
            ...usTopology.objects,
            counties: { type: 'GeometryCollection', geometries: countiesGeo },
            states: { type: 'GeometryCollection', geometries: fiftyStatesGeo }
          },
          transform: usTopology.transform,
          type: usTopology.type
        }
        // prune nation geo off
        delete filterTopology.objects.nation
        setTopology(filterTopology)

        // create obj for bool of pieces located
        const countyLocationTracker = {}
        filterTopology.objects.counties.geometries.map(({ id }) => {
          const state = id.substring(0, 2)
          if (state in countyLocationTracker) {
            countyLocationTracker[state][id] = false
          } else {
            countyLocationTracker[state] = { [id]: false }
          }
        })
        setPuzzleProgress(countyLocationTracker)
      } catch (error) {
        // todo
        console.error(error)
      }
    }
    getTopology()
  }, [])

  // handlers
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
      const isLocated = d3.select(this).attr('transform') === 'translate(0,0)'
      if (isLocated) {
        // remove drag handler and adjust stroke style when correctly located
        d3.select(this)
          .classed('located', true)
          .attr('stroke-width', 0.1)
          .attr('stroke', 'lightgray')
          .on('.drag', null)

        updateProgress(d.subject.id)
      }
    })

  function handleMouseOver(e, d) {
    setTooltipCoords([e.clientX, e.clientY])
    setTooltipText(d.properties.name)
  }

  function handleMouseMove(e) {
    setTooltipCoords([e.clientX, e.clientY])
  }

  function handleMouseOut() {
    setTooltipText('')
  }

  useEffect(() => {
    // remove any svg el from previous render
    d3.select(mapRef.current).selectAll('*').remove()

    const width = window.outerWidth
    const height = window.outerHeight

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

    // todo improve color randomization
    const stateColorScale = d3.scaleOrdinal().range(d3.schemeCategory10)

    if (topology) {
      svg
        .selectAll('.state')
        .data(topojson.feature(topology, topology.objects.states).features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', pathGenerator)
        .attr('fill', (d) => stateColorScale(d.id.slice(0, 2)))
        .attr('id', (d) => `${d.id}`)

      // Create a path element for each count
      const countyPaths = svg
        .selectAll('.county')
        .data(topojson.feature(topology, topology.objects.counties).features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('d', pathGenerator)
        .attr('stroke', (d) => stateColorScale(d.id.slice(0, 2)))
        .attr('stroke-width', 0.25)
        .attr('fill', 'lightgray')
        .attr('id', (d) => `county-id-${d.id}`)
        .attr('data-state-id', (d) => `state-id-${d.id.slice(0, 2)}`)
        .attr('data-name', (d) => `${d.properties.name}`)
        .attr('transform', (d) => d.properties.initialTranspose) // d or local storage
        .on('mouseover', (e, d) => handleMouseOver(e, d))
        .on('mousemove', (e) => handleMouseMove(e))
        .on('mouseout', handleMouseOut)

      countyPaths.call(dragHandler)
    }
  }, [topology])

  return (
    <div>
      <div className="tooltip" style={tooltipStyle}>
        {tooltipText.length ? tooltipText : ''}
      </div>
      <div ref={mapRef}></div>
    </div>
  )
}

export default USMap
