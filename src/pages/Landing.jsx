import { Link } from 'react-router-dom'
import { Nav } from '../components/Nav'

export function Landing() {
  return (
    <>
      <Nav />
      <div className="landing-hero">
        <h1>What if your project failed?</h1>
        <p>Pre-mortem helps teams surface risks before they happen — async input, team voting, clear action items.</p>
        <Link to="/auth"><button className="btn">Get started free</button></Link>
      </div>
      <div className="landing-steps">
        {[
          ['1', 'Create a session', 'Facilitator creates a pre-mortem session and shares the link.'],
          ['2', 'Team adds risks', 'Everyone submits what could go wrong — privately, at their own pace.'],
          ['3', 'Reveal & vote', 'Facilitator reveals all risks. Team votes on what matters most.'],
          ['4', 'Assign & export', 'Top risks get owners and remarks. Export to your task tool.'],
        ].map(([n, title, desc]) => (
          <div className="landing-step" key={n}>
            <div className="step-num">{n}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
