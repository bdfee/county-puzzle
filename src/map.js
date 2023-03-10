import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'

// on hover with the mouse, console.log the state
const stateNames = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming'
]

// const nonStateIds = ['60', '66', '69', '72', '78']

function USMap() {
  const mapRef = useRef()
  const [targetCounty, setTargetCounty] = useState('')
  const [targetState, setTargetState] = useState('')
  const [counties, setCounties] = useState(null)
  const [states, setStates] = useState(null)

  useEffect(() => {
    Promise.all([
      d3.json('https://cdn.jsdelivr.net/npm/us-atlas/states-10m.json'),
      d3.json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')
    ]).then(([usStates, usCounties]) => {
      setCounties(usCounties)
      setStates(usStates)
    })
  }, [])

  useEffect(() => {
    d3.select(mapRef.current).selectAll('*').remove()
    const width = 960
    const height = 600
    // Create a projection that maps latitude/longitude coordinates to x/y coordinates
    const projection = d3
      .geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(1000)

    // Create a path generator that converts GeoJSON geometries to SVG path elements
    const pathGenerator = d3.geoPath().projection(projection)

    // Create an SVG element and add it to the DOM
    const svg = d3.select(mapRef.current).append('svg').attr('width', width).attr('height', height)

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

    if (states && counties) {
      svg
        .selectAll('.state')
        .data(topojson.feature(states, states.objects.states).features)
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
        .data(topojson.feature(counties, counties.objects.counties).features)
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
        .attr(
          'transform',
          () => `translate(${Math.floor(Math.random() * 100)},${Math.floor(Math.random() * 100)})`
        )

      const dragHandler = d3
        .drag()
        .on('start', function () {
          d3.select(this).raise().classed('active', true)
        })
        .on('drag', function (event) {
          // Get the current transform value
          const transform = d3.select(this).node().transform.baseVal[0].matrix
          const tx = transform.e
          const ty = transform.f

          // Update the transform with the new translation values
          d3.select(this).attr('transform', `translate(${tx + event.dx},${ty + event.dy})`)
        })
        .on('end', function () {
          d3.select(this).classed('active', false)
        })

      countyPaths.call(dragHandler)
    }
  }, [states, counties])

  return (
    <div>
      <div
        ref={mapRef}
        onMouseOver={({ target }) => {
          setTargetCounty(target.getAttribute('data-name'))
          setTargetState(target.getAttribute('data-state-id'))
        }}></div>
      <div>
        <h4>Target State: {stateNames[targetState - 1]}</h4>
        <h4>Target County: {targetCounty}</h4>
      </div>
    </div>
  )
}

export default USMap
