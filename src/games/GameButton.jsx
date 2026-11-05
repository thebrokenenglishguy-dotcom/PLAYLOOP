export default function GameButton({ children, onClick, className = '', disabled = false, ...props }) {
  return <button type="button" className={`game-button ${className}`} onClick={onClick} disabled={disabled} {...props}>{children}</button>
}
