import StateFilter from './state-filter'
import ResetButton from './reset-button'
import { clearStorage } from '../../../services/localStorage'

const Toolbar = ({ resetTranslations, setStateFilter, stateFilter }) => {
  const handleReset = () => {
    clearStorage()
    resetTranslations()
  }

  return (
    <div className={'toolbar'}>
      <div className="toolbar-left">
        <div>county puzzle</div>
      </div>
      <div className="toolbar-right">
        <StateFilter setStateFilter={setStateFilter} stateFilter={stateFilter} />
        <ResetButton handleReset={handleReset} />
      </div>
    </div>
  )
}

export default Toolbar
