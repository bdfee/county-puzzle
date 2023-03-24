import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import StateFilter from './components/state-filter'
import { non50StatesIds, stateDictionary } from './states'

import './App.css'

const stateId = (id) => id.substring(0, 2)

function USMap() {
  const mapRef = useRef()
  const [baseTopology, setBaseTopology] = useState(null)
  const [topology, setTopology] = useState(null)
  const [filteredStates, setFilteredStates] = useState('')
  const [countyCoords, setCountyCoords] = useState(JSON.parse(localStorage.getItem('puzzleCoords')))
  const [tooltipText, setTooltipText] = useState('')
  const [tooltipCoords, setTooltipCoords] = useState([])
  const [moveCount, setMoveCount] = useState(0)
  const tooltipStyle = { left: tooltipCoords[0], top: tooltipCoords[1] }

  const updateProgress = (id, coordsArr) => {
    const update = countyCoords
    update[stateId(id)][id] = coordsArr
    setCountyCoords(update)
    setMoveCount((moveCount) => moveCount + 1)
  }
  // local storage on unload
  addEventListener('beforeunload', () => {
    if (moveCount) {
      localStorage.setItem('puzzleCoords', JSON.stringify(countyCoords))
    }
  })

  // every ten moves set local storage
  useEffect(() => {
    if (moveCount >= 10) {
      localStorage.setItem('puzzleCoords', JSON.stringify(countyCoords))
      setMoveCount(0)
    }
  }, [moveCount])

  // get base topology
  useEffect(() => {
    async function getBaseTopology() {
      try {
        // fetch topojson
        setBaseTopology(await d3.json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json'))
      } catch (error) {
        console.log(error)
      }
    }
    getBaseTopology()
    console.log('fetched')
  }, [])

  useEffect(() => {
    if (baseTopology !== null) {
      // filter out counties in territories and districts
      const fiftyStatesCountiesGeo = baseTopology.objects.counties.geometries.filter(({ id }) => {
        if (filteredStates.length) {
          return filteredStates.includes(stateId(id)) ? true : false
        } else return !non50StatesIds.includes(stateId(id)) ? true : false
      })

      // filter out territories and districts
      const fiftyStatesGeo = baseTopology.objects.states.geometries.filter(({ id }) => {
        if (filteredStates.length) {
          return filteredStates.includes(stateId(id)) ? true : false
        } else return !non50StatesIds.includes(stateId(id)) ? true : false
      })

      // scatter puzzle pieces
      const randomTranslation = () => {
        const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
        const randomNumber = () => Math.floor(Math.random() * 100 * randomNegative())
        return [randomNumber(), randomNumber()]
      }

      let countiesGeo = []

      // add local storage coords if present, otherwise scatter pieces
      if (countyCoords === null) {
        countiesGeo = fiftyStatesCountiesGeo.map((county) => {
          county.properties.transpose = randomTranslation()
          return county
        })

        const countyCoordsObj = {}

        countiesGeo.map(({ id, properties }) => {
          if (stateId(id) in countyCoordsObj) {
            countyCoordsObj[stateId(id)][id] = properties.transpose
          } else {
            countyCoordsObj[stateId(id)] = { [id]: properties.transpose }
          }
        })
        setCountyCoords(countyCoordsObj)
      } else {
        countiesGeo = fiftyStatesCountiesGeo.map((county) => {
          county.properties.transpose = countyCoords[county.id.substring(0, 2)][county.id]
          return county
        })
      }

      // trim down topology obj before setting state
      const filterTopology = {
        arcs: baseTopology.arcs,
        bbox: baseTopology.bbox,
        objects: {
          ...baseTopology.objects,
          counties: { type: 'GeometryCollection', geometries: countiesGeo },
          states: { type: 'GeometryCollection', geometries: fiftyStatesGeo }
        },
        transform: baseTopology.transform,
        type: baseTopology.type
      }
      // prune nation geo off
      delete filterTopology.objects.nation
      setTopology(filterTopology)
    }
  }, [baseTopology, filteredStates])

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

      const coords = d3
        .select(this)
        .attr('transform')
        .match(/-?\d+(\.\d+)?/g)

      const [x, y] = [+coords[0], +coords[1]]
      updateProgress(d.subject.id, [x, y])

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
    setTooltipCoords([e.offsetX + 20, e.offsetY + 20])
    setTooltipText(d.properties.name)
  }

  function handleMouseMove(e) {
    setTooltipCoords([e.offsetX + 20, e.offsetY + 20])
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
    // const stateColorScale = d3.scaleOrdinal().range(d3.schemeCategory10)

    if (topology) {
      svg
        .selectAll('.state')
        .data(topojson.feature(topology, topology.objects.states).features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', pathGenerator)
        .attr('fill', ({ id }) => stateDictionary[id].color)
        .attr('id', ({ id }) => `${id}`)

      // Create a path element for each count

      const countyPaths = svg
        .selectAll('.county')
        .data(topojson.feature(topology, topology.objects.counties).features)
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
    }
  }, [topology])

  return (
    <div>
      <StateFilter setFilter={setFilteredStates} />
      <div className="tooltip" style={tooltipStyle}>
        {tooltipText.length ? tooltipText : ''}
      </div>
      <div ref={mapRef}></div>
    </div>
  )
}

export default USMap
