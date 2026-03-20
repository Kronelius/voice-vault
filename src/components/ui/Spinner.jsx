export default function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="w-7 h-7 animate-spin"
        style={{
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
        }}
      />
    </div>
  )
}
