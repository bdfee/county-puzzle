import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import './App.css'

const nonStateIds = ['11', '60', '66', '69', '72', '78']

const randomTranslation = () => {
  const randomNegative = () => (Math.random() > 0.5 ? -1 : 1)
  const randomNumber = () => Math.floor(Math.random() * 100 * randomNegative())
  const translation = `translate(${randomNumber()},${randomNumber()})`
  return translation
}

function USMap() {
  const mapRef = useRef()
  const [targetCounty, setTargetCounty] = useState('')
  const [topology, setTopology] = useState(null)
  const [locationObj, setLocationObj] = useState({})
  // const [click, setClick] = useState(false)
  // const [filteredGeometries, setfilteredGeometries] = useState({})

  const updateLocation = (id, bool) => {
    const state = id.substring(0, 2)
    const county = locationObj[state][id]

    if (!bool && county) {
      locationObj[state][id] = false
      return
    }

    if (bool && !county) {
      locationObj[state][id] = true
      if (Object.values(locationObj[state]).every((value) => value === true)) {
        console.log('delete county svgs')
      }
    }
    console.log(locationObj[state])
  }

  useEffect(() => {
    async function getTopology() {
      try {
        const usTopology = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')

        const fiftyStatesCountiesGeo = usTopology.objects.counties.geometries.filter((geo) => {
          const state = geo.id.substring(0, 2)
          return !nonStateIds.includes(state) ? true : false
        })

        const fiftyStatesGeo = usTopology.objects.states.geometries.filter(({ id }) => {
          return !nonStateIds.includes(id) ? true : false
        })

        // filter obj
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

        const locationTracker = {}
        filterTopology.objects.counties.geometries.map(({ id }) => {
          const state = id.substring(0, 2)
          if (state in locationTracker) {
            locationTracker[state][id] = false
          } else {
            locationTracker[state] = { [id]: false }
          }
        })
        setLocationObj(locationTracker)
      } catch (error) {
        console.error(error)
      }
    }
    getTopology()
  }, [])

  // useEffect(() => {
  //   const svg = d3.select(mapRef.current)
  //   console.log(svg)
  //   console.log('here')
  // }, [click])

  useEffect(() => {
    d3.select(mapRef.current).selectAll('*').remove()
    const width = 1080
    const height = 900
    // Create a projection that maps latitude/longitude coordinates to x/y coordinates
    const projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1200)

    // Create a path generator that converts GeoJSON geometries to SVG path elements
    const pathGenerator = d3.geoPath().projection(projection)

    // Create an SVG element and add it to the DOM
    const svg = d3.select(mapRef.current).append('svg').attr('width', width).attr('height', height)

    svg.attr('viewBox', `0 0 ${width} ${height}`) // set the viewBox attribute

    const stateColorScale = d3
      .scaleOrdinal()
      .domain([
        '01',
        '02',
        '04',
        '05',
        '06',
        '08',
        '09',
        '10',
        '11',
        '12',
        '13',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '44',
        '45',
        '46',
        '47',
        '48',
        '49',
        '50',
        '51',
        '53',
        '54',
        '55',
        '56'
      ])
      .range(d3.schemeCategory10)

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
          updateLocation(d.subject.id, isLocated)

          // console.log(locationObj)
          // console.log('id', d.subject.id)
          // console.log(d3.select(this).attr('transform'))
        })
      countyPaths.call(dragHandler)
    }
  }, [topology])
  return (
    <div>
      <div className="tip-box">
        <h4>Target County: {targetCounty}</h4>
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
