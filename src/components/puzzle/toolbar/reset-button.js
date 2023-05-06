const ResetButton = ({ resetTranslations }) => {
  return (
    <button className="reset-btn" onClick={() => resetTranslations()}>
      reset puzzle
    </button>
  )
}

export default ResetButton
