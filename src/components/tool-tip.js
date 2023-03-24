const ToolTip = ({ text, coords }) => {
  const tooltipStyle = { left: coords[0] + 20, top: coords[1] + 20 }

  return (
    <div className="tooltip" style={tooltipStyle}>
      {text}
    </div>
  )
}

export default ToolTip
