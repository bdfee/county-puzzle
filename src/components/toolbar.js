import StateFilter from './state-filter'

const Toolbar = ({ reset, setFilteredStates }) => {
  return (
    <div className={'toolbar'}>
      <StateFilter setFilter={setFilteredStates} />
      <button onClick={() => reset()}>reset puzzle</button>
    </div>
  )
}

export default Toolbar
