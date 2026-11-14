import { Link } from "@tanstack/react-router"

// The one place that knows the thread route. Passed to QuackItem/QuackList as
// `renderThreadLink` so those stay free of the router.
export const renderThreadLink = (quackId: string, label: string) => (
  <Link
    to="/quacks/$quackId"
    params={{ quackId }}
    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
  >
    {label}
  </Link>
)
