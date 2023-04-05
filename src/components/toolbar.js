import StateFilter from './state-filter'

const Toolbar = ({ reset, setFilteredStates }) => {
  return (
    <div>
      <StateFilter setFilter={setFilteredStates} />
      <button onClick={() => reset()}>reset local</button>
    </div>
  )
}

export default Toolbar
