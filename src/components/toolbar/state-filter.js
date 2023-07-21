import { stateDictionary } from '../../helpers/state.dictionary'

const StateFilter = ({ setStateFilter }) => {
  return (
    <>
      <select
        name="states"
        className="state-filter"
        onChange={({ target }) => setStateFilter(target.value)}>
        <option value="">all states</option>
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
    </>
  )
}

export default StateFilter
