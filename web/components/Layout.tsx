/**
 * Base Layout Component
 *
 * Header with app name and navigation.
 */

interface Props {
  children: preact.ComponentChildren;
}

export function Layout(props: Props) {
  return (
    <div class="app-layout">
      <header class="app-header">
        <h1 class="app-title">Kayak-Lab</h1>
        <nav class="app-nav">
          <a href="/" class="nav-link">Dashboard</a>
        </nav>
      </header>
      <main class="app-main">
        {props.children}
      </main>
    </div>
  );
}
