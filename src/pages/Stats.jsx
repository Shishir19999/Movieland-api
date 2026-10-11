import { useMemo } from 'react'
import { useApp, useLib } from '../context.jsx'
import { computeStats } from '../lib/stats.js'
import { buildHash } from '../lib/route.js'
import BarChart from '../components/BarChart.jsx'
import { EmptyState } from '../components/States.jsx'

function Tile({ label, value, sub }) {
  return (
    <div className="tile">
      <dt>{label}</dt>
      <dd>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </dd>
    </div>
  )
}

export default function Stats() {
  const { lib, get } = useLib()
  const { navigate, openMovie } = useApp()
  const st = useMemo(() => {
    const watched = lib.lists.find((l) => l.id === 'watched').ids.map(get).filter(Boolean)
    return computeStats({ watched, mine: lib.mine, diary: lib.diary })
  }, [lib, get])

  return (
    <div className="page">
      <h1 id="page-title" tabIndex={-1}>
        Your stats
      </h1>
      {st.films === 0 ? (
        <EmptyState
          title="Nothing to chart yet"
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate('#/browse')}>
              Find something to watch
            </button>
          }
        >
          Mark films as seen (the eye button) or log them in your diary and your genres, decades and viewing habits show up here.
        </EmptyState>
      ) : (
        <>
          <dl className="tiles">
            <Tile label="Films seen" value={st.films} sub={`${st.viewings} logged viewing${st.viewings === 1 ? '' : 's'}`} />
            <Tile label="Time watched" value={`${st.hours} h`} sub={`${st.minutes.toLocaleString('en')} minutes`} />
            <Tile label="Average rating" value={st.avgRating ?? 'None yet'} sub={st.ratedCount ? `out of 5, ${st.ratedCount} rated` : 'rate films to see this'} />
            <Tile label="Top genre" value={st.genres[0]?.label ?? 'None'} sub={st.genres[0] ? `${st.genres[0].value} film${st.genres[0].value === 1 ? '' : 's'}` : ''} />
          </dl>
          <div className="charts">
            <BarChart title="Genres" data={st.genres} noun="film" />
            <BarChart title="Decades" data={st.decades} noun="film" />
            <BarChart title="Your ratings" data={st.ratingDist} noun="film" empty="Rate a film to see how you score." />
            <BarChart title="Runtime" data={st.runtimeBuckets} noun="film" />
            <BarChart title="Viewings per month (last 12 months)" data={st.byMonth} noun="viewing" empty="Log viewings in your diary to see this." />
            <BarChart title="Languages" data={st.languages} noun="film" />
            <BarChart title="Directors you watch most" data={st.directors.slice(0, 6)} noun="film" />
            <BarChart title="Most-seen actors" data={st.actors.slice(0, 6)} noun="film" />
          </div>
          <section className="extremes" aria-labelledby="ext-h">
            <h2 id="ext-h">Highlights</h2>
            <ul className="plain">
              {st.longest && (
                <li>
                  Longest: <button type="button" className="link-btn" onClick={() => openMovie(st.longest)}>{st.longest.title}</button> ({st.longest.runtime} min)
                </li>
              )}
              {st.shortest && (
                <li>
                  Shortest: <button type="button" className="link-btn" onClick={() => openMovie(st.shortest)}>{st.shortest.title}</button> ({st.shortest.runtime} min)
                </li>
              )}
              {st.directors[0] && (
                <li>
                  Most-watched director: <a href={buildHash('person', { arg: st.directors[0].label })}>{st.directors[0].label}</a>
                </li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
