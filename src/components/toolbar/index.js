import StateFilter from './state-filter'
import ResetButton from './reset-button'

const Toolbar = ({ resetTranslations, setStateFilter, stateFilter }) => {
  return (
    <div className={'toolbar'}>
      <div className="toolbar-left">
        <div>county puzzle</div>
      </div>
      <div className="toolbar-right">
        <StateFilter setStateFilter={setStateFilter} stateFilter={stateFilter} />
        <ResetButton resetTranslations={resetTranslations} />
      </div>
    </div>
  )
}

export default Toolbar
