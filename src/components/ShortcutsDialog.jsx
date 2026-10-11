import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'

const GROUPS = [
  [
    'Anywhere',
    [
      ['/', 'Search'],
      ['?', 'Show this help'],
      ['t', 'Switch light or dark theme'],
      ['r', 'Surprise me with a random film'],
      ['g then h', 'Go to Home'],
      ['g then b', 'Go to Browse'],
      ['g then l', 'Go to My lists'],
      ['g then d', 'Go to Diary'],
      ['g then s', 'Go to Stats'],
      ['g then n', 'Go to Movie night'],
      ['g then q', 'Go to Quiz'],
      ['g then c', 'Go to Compare'],
    ],
  ],
  [
    'In a movie dialog',
    [
      ['f', 'Toggle favorite'],
      ['w', 'Toggle watchlist'],
      ['s', 'Toggle seen'],
      ['Esc', 'Close'],
    ],
  ],
  [
    'In the quiz',
    [
      ['1 to 4', 'Choose an answer'],
      ['Enter', 'Next question'],
    ],
  ],
]

export default function ShortcutsDialog({ onClose }) {
  return (
    <Dialog labelledBy="keys-title" onClose={onClose} className="dialog-settings">
      <button type="button" className="icon-btn dialog-close" onClick={onClose} aria-label="Close shortcuts">
        <Icon name="close" />
      </button>
      <h2 id="keys-title">Keyboard shortcuts</h2>
      <p className="muted">Shortcuts are ignored while you are typing in a field.</p>
      {GROUPS.map(([title, rows]) => (
        <section key={title} aria-label={title}>
          <h3 className="keys-h">{title}</h3>
          <dl className="keys">
            {rows.map(([k, d]) => (
              <div key={k}>
                <dt>
                  {k.split(' then ').map((p, i) => (
                    <span key={p}>
                      {i > 0 && <span className="then"> then </span>}
                      <kbd>{p}</kbd>
                    </span>
                  ))}
                </dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </Dialog>
  )
}
