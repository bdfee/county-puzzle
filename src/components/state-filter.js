import { stateDictionary } from '../dictionaries/state'

const StateFilter = (props) => {
  return (
    <div>
      <select
        name="states"
        className="state-filter"
        onChange={({ target }) => props.setFilter(target.value)}>
        <option value="">All States</option>
        {Object.entries(stateDictionary)
          .sort((a, b) => a[1].name.localeCompare(b[1].name))
          .map(([stateId, { name }]) => {
            return (
              <option key={stateId} value={stateId}>
                {name}
              </option>
            )
          })}
      </select>
    </div>
  )
}

export default StateFilter
