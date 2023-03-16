import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import './App.css'

// scatter puzzle pieces
const randomTranslation = () => {
  const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
  const randomNumber = () => Math.floor(Math.random() * 100 * randomNegative())
  // reduce y random translate by 50%
  const translation = `translate(${randomNumber()},${randomNumber() * 0.5})`
  return translation
}

function USMap() {
  const mapRef = useRef()
  const [targetCounty, setTargetCounty] = useState('')
  const [topology, setTopology] = useState(null)
  const [piecesLocated, setPiecesLocated] = useState({})

  // check if pieceLocated obj needs updating, and update
  const updatePieceLocated = (id, bool) => {
    const state = id.substring(0, 2)
    const county = piecesLocated[state][id]

    if (!bool && county) {
      piecesLocated[state][id] = false
      return
    }

    if (bool && !county) {
      piecesLocated[state][id] = true
      if (Object.values(piecesLocated[state]).every((value) => value === true)) {
        // todo
        console.log('delete county svgs')
      }
    }
  }

  const non50StatesIds = ['11', '60', '66', '69', '72', '78']

  useEffect(() => {
    async function getTopology() {
      try {
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

        // trim down topology obj before setting state
        const filterTopology = {
          arcs: usTopology.arcs,
          bbox: usTopology.bbox,
          objects: {
            ...usTopology.objects,
            counties: { type: 'GeometryCollection', geometries: fiftyStatesCountiesGeo },
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
        setPiecesLocated(countyLocationTracker)
      } catch (error) {
        // todo
        console.error(error)
      }
    }
    getTopology()
  }, [])

  useEffect(() => {
    // remove any svg el from previous render
    d3.select(mapRef.current).selectAll('*').remove()

    const width = window.outerWidth
    const height = window.outerHeight

    // geoAlbersUSA projection, center on window/svg
    const projection = d3.geoAlbersUsa().translate([width / 2, height / 2])

    // Create a path generator that converts GeoJSON geometries to SVG path elements
    const pathGenerator = d3.geoPath().projection(projection)

    // Create an SVG element and add it to the DOM
    const svg = d3.select(mapRef.current).append('svg').attr('width', width).attr('height', height)

    // improve color randomization
    const stateColorScale = d3.scaleOrdinal().range(d3.schemeCategory10)

    if (topology) {
      svg
        .selectAll('.state')
        .data(topojson.feature(topology, topology.objects.states).features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', pathGenerator)
        .attr('stroke', (d) => stateColorScale(d.id.slice(0, 2)))
        .attr('stroke-width', 0.5)
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
        .attr('stroke-width', 0.5)
        .attr('fill', 'lightgray')
        .attr('id', (d) => `county-id-${d.id}`)
        .attr('data-state-id', (d) => `state-id-${d.id.slice(0, 2)}`)
        .attr('data-name', (d) => `${d.properties.name}`)
        .attr('transform', () => randomTranslation())

      const dragHandler = d3
        .drag()
        .on('start', function () {
          // use function so that this is present
          // class active to bring to the top css
          d3.select(this).raise().classed('active', true)
        })
        .on('drag', function ({ dx, dy }) {
          // Get the current transform value
          const transform = d3.select(this).node().transform.baseVal[0].matrix
          const changeX = transform.e
          const changeY = transform.f
          console.log('this', changeX, changeY, dx, dy)
          // add the new translation values to dx
          d3.select(this).attr('transform', `translate(${changeX + dx},${changeY + dy})`)
        })
        .on('end', function (d) {
          d3.select(this).classed('active', false)
          const isLocated = d3.select(this).attr('transform') === 'translate(0,0)'
          updatePieceLocated(d.subject.id, isLocated)
        })
      countyPaths.call(dragHandler)
    }
  }, [topology])
  return (
    <div>
      <div className="tip-box">
        <h4>{targetCounty}</h4>
      </div>
      <div
        ref={mapRef}
        onMouseOver={({ target }) => {
          setTargetCounty(target.getAttribute('data-name'))
        }}></div>
    </div>
  )
}

export default USMap
