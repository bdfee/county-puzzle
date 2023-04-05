import StateFilter from './state-filter'

const Toolbar = ({ reset, setFilteredStates, filteredStates }) => {
  const handleReset = () => {
    reset()
    setFilteredStates('')
  }

  return (
    <div className={'toolbar'}>
      <div className="toolbar-left">
        <div>county puzzle</div>
      </div>
      <div className="toolbar-right">
        <StateFilter setFilter={setFilteredStates} filteredStates={filteredStates} />
        <button className="reset-btn" onClick={handleReset}>
          reset puzzle
        </button>
      </div>
    </div>
  )
}

export default Toolbar
