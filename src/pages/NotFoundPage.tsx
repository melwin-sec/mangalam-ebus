import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section aria-labelledby="page-title" className="space-y-4">
      <p className="text-sm font-medium text-success">404 · Not found</p>
      <h1 id="page-title">Page not found</h1>
      <p>The requested route does not exist.</p>
      <Link to="/">Return to the landing page</Link>
    </section>
  )
}

export default NotFoundPage
