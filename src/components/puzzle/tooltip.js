const ToolTip = ({ text, coords }) => {
  const [x, y] = coords
  const tooltipStyle = { left: x + 20, top: y + 20 }

  return (
    <div className="tooltip" style={tooltipStyle}>
      {text}
    </div>
  )
}

export default ToolTip
