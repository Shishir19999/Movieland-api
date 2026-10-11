// Horizontal bar chart drawn with plain elements. Every bar has its label and value as real text,
// so the chart reads as a list for screen readers and the bars themselves are decorative.
export default function BarChart({ title, data, noun = '', empty = 'Nothing to show yet.', note }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const total = data.reduce((n, d) => n + d.value, 0)
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      {total === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ul className="bars">
          {data.map((d) => (
            <li key={d.label}>
              <span className="bar-label">{d.label}</span>
              <span className="bar-track" aria-hidden="true">
                {d.value > 0 && <span className="bar-fill" style={{ width: `${(d.value / max) * 100}%` }} />}
              </span>
              <span className="bar-value">
                {d.value}
                {noun ? ` ${noun}${d.value === 1 ? '' : 's'}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {note && total > 0 && <p className="muted chart-note">{note}</p>}
    </figure>
  )
}
