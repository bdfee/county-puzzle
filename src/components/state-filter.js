import { stateDictionary } from '../dictionaries/state'

const StateFilter = (props) => {
  return (
    <div>
      <select
        name="states"
        className="state-filter"
        onChange={({ target }) => props.setFilter(target.value)}>
        <option value={props.filteredStates}>all states</option>
        {Object.entries(stateDictionary)
          .sort((a, b) => a[1].name.localeCompare(b[1].name))
          .map(([stateId, { name }]) => {
            return (
              <option key={stateId} value={stateId}>
                {name.toLowerCase()}
              </option>
            )
          })}
      </select>
    </div>
  )
}

export default StateFilter
