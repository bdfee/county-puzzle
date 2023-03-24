import { stateNames } from '../states'

const StateFilter = (props) => {
  return (
    <div>
      <label htmlFor="state-filter">Filter Puzzle:</label>

      <select
        name="states"
        id="state-filter"
        onChange={({ target }) => props.setFilter(target.value)}>
        <option value="">All States</option>
        {Object.entries(stateNames).map(([stateId, stateName]) => {
          return (
            <option key={stateId} value={stateId}>
              {stateName}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export default StateFilter
