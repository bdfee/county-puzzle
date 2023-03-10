/* eslint-disable no-unused-vars */
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

function USMap() {
  const mapRef = useRef()
  const [targetCounty, setTargetCounty] = useState('')
  const [targetState, setTargetState] = useState('')

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

    // Load the Topojson data for states and counties from a CDN and convert them to GeoJSON
    Promise.all([
      d3.json('https://cdn.jsdelivr.net/npm/us-atlas/states-10m.json'),
      d3.json('https://cdn.jsdelivr.net/npm/us-atlas/counties-10m.json')
    ]).then(([usStates, usCounties]) => {
      console.log(usCounties.objects.counties)
      // Create a path element for each state
      svg
        .selectAll('.state')
        .data(topojson.feature(usStates, usStates.objects.states).features)
        .enter()
        .append('path')
        .attr('class', 'state')
        .attr('d', pathGenerator)
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('fill', 'none')
        .attr('id', (d) => `${d.id}`)

      // Create a path element for each county
      svg
        .selectAll('.county')
        .data(topojson.feature(usCounties, usCounties.objects.counties).features)
        .enter()
        .append('path')
        .attr('class', 'county')
        .attr('d', pathGenerator)
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('fill', 'lightgray')
        .attr('id', (d) => `${d.id}`)
        .attr('data-state-id', (d) => `${d.id.slice(0, 2)}`)
        .attr('data-name', (d) => `${d.properties.name}`)
        .attr('transform', () => `translate(${Math.random() * 100},${Math.random() * 100})`)
    })
  }, [])

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
