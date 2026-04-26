import './styles.css'
import { getDownloadURL, listAll, ref } from 'firebase/storage'
import { storage } from './firebase'

type Route = 'home' | 'meows' | 'excorium' | 'unexposd' | 'vitrify'

type Section = {
  route: Exclude<Route, 'home'>
  number: string
  title: string
  description: string
}

const appElement = document.querySelector<HTMLDivElement>('#app')

if (!appElement) {
  throw new Error('Missing #app mount element')
}

const app = appElement
const hostname = window.location.hostname.toLowerCase()
const shouldRedirectToRomeo =
  hostname === 'resfactae.xyz' && window.location.pathname === '/'

if (shouldRedirectToRomeo) {
  window.location.replace('https://romeo.resfactae.xyz/')
}

const sections: Section[] = [
  {
    route: 'meows',
    number: 'I.',
    title: 'Romeo ex machina',
    description: 'Romeo ex machina. A photo viewer of my cat, Romeo.',
  },
  {
    route: 'excorium',
    number: 'II.',
    title: 'Excorium',
    description: 'leather, skin, surface',
  },
  {
    route: 'unexposd',
    number: 'III.',
    title: 'unexposd',
    description: 'images not yet fixed',
  },
  {
    route: 'vitrify',
    number: 'IV.',
    title: 'Vitrify App',
    description: 'tools for ceramists',
  },
]

const imageExtension = /\.(jpe?g|png|webp)$/i
let teardownRoute: (() => void) | null = null

function currentRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (hostname === 'romeo.resfactae.xyz' && path === '/') {
    return 'meows'
  }

  if (path === '/') return 'home'
  if (path === '/meows') return 'meows'
  if (path === '/excorium') return 'excorium'
  if (path === '/unexposd') return 'unexposd'
  if (path === '/vitrify') return 'vitrify'

  return 'home'
}

function sectionPath(route: Section['route']) {
  return `/${route}`
}

function render() {
  teardownRoute?.()
  teardownRoute = null

  const route = currentRoute()
  document.body.dataset.route = route

  if (route === 'meows') {
    teardownRoute = renderMeows()
    return
  }

  if (route === 'home') {
    renderHome()
    return
  }

  renderPlaceholder(route)
}

function renderHome() {
  document.title = 'Res factae'
  app.innerHTML = `
    <main class="home-shell" aria-labelledby="site-title">
      <section class="cabinet-label" aria-describedby="site-subtitle">
        <div class="label-rule" aria-hidden="true"></div>
        <h1 id="site-title">Res factae</h1>
        <p id="site-subtitle" class="subtitle">
          A show of things I make.
        </p>
        <nav class="site-index" aria-label="Cabinet index">
          <ol>
            ${sections.map(renderIndexItem).join('')}
          </ol>
        </nav>
      </section>
    </main>
  `
}

function renderIndexItem(section: Section) {
  return `
    <li>
      <a href="${sectionPath(section.route)}">
        <span class="index-number">${section.number}</span>
        <span class="index-copy">
          <span class="index-title">${section.title}</span>
          <span class="index-description">${section.description}</span>
        </span>
      </a>
    </li>
  `
}

function renderPlaceholder(route: Exclude<Route, 'home' | 'meows'>) {
  const section = sections.find((item) => item.route === route)

  if (!section) {
    renderHome()
    return
  }

  document.title = `${section.title} | Res factae`
  app.innerHTML = `
    <main class="placeholder-shell" aria-labelledby="placeholder-title">
      <article class="placeholder-label">
        <a class="home-link" href="/">Res factae</a>
        <p class="placeholder-number">${section.number}</p>
        <h1 id="placeholder-title">${section.title}</h1>
        <p>${section.description}</p>
        <p class="placeholder-note">not yet placed</p>
      </article>
    </main>
  `
}

function renderMeows() {
  document.title = 'Romeo ex machina | Res factae'
  app.innerHTML = `
    <main
      class="meows-viewer"
      tabindex="0"
      aria-label="Romeo ex machina. Romeo photo viewer."
    >
      <img
        class="meows-image"
        alt="Romeo photo"
        decoding="async"
        draggable="false"
        hidden
      />
      <p class="viewer-message" role="status" aria-live="polite"></p>
    </main>
  `

  const viewer = app.querySelector<HTMLElement>('.meows-viewer')
  const image = app.querySelector<HTMLImageElement>('.meows-image')
  const message = app.querySelector<HTMLParagraphElement>('.viewer-message')

  if (!viewer || !image || !message) {
    return null
  }

  let urls: string[] = []
  let queue: string[] = []
  let currentUrl = ''
  let touchStartX = 0
  let touchStartY = 0
  let ignoreClickUntil = 0
  let cancelled = false
  let preloadedImage: HTMLImageElement | null = null

  const showNoImages = () => {
    image.hidden = true
    image.removeAttribute('src')
    message.textContent = 'no images found'
  }

  const ensureQueue = () => {
    if (queue.length > 0) return
    queue = shuffledQueue(urls, currentUrl)
  }

  const preloadNext = () => {
    ensureQueue()

    const nextUrl = queue[0]

    if (!nextUrl || nextUrl === currentUrl) return

    preloadedImage = new Image()
    preloadedImage.decoding = 'async'
    preloadedImage.src = nextUrl
  }

  const showNext = () => {
    if (urls.length === 0) return

    ensureQueue()

    const nextUrl = queue.shift()

    if (!nextUrl) return

    currentUrl = nextUrl
    message.textContent = ''
    image.hidden = false
    image.src = nextUrl
    preloadNext()
  }

  const loadImages = async () => {
    try {
      urls = await loadCatImageUrls()
    } catch {
      urls = []
    }

    if (cancelled) return

    if (urls.length === 0) {
      showNoImages()
      return
    }

    queue = shuffledQueue(urls, '')
    showNext()
  }

  const handleClick = () => {
    if (Date.now() < ignoreClickUntil) return
    showNext()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

    event.preventDefault()
    showNext()
  }

  const handleTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0]

    if (!touch) return

    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }

  const handleTouchEnd = (event: TouchEvent) => {
    const touch = event.changedTouches[0]

    if (!touch) return

    const deltaX = touch.clientX - touchStartX
    const deltaY = touch.clientY - touchStartY

    if (Math.abs(deltaX) < 42 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      return
    }

    ignoreClickUntil = Date.now() + 500
    showNext()
  }

  viewer.addEventListener('click', handleClick)
  viewer.addEventListener('touchstart', handleTouchStart, { passive: true })
  viewer.addEventListener('touchend', handleTouchEnd, { passive: true })
  window.addEventListener('keydown', handleKeyDown)

  window.requestAnimationFrame(() => {
    viewer.focus({ preventScroll: true })
  })

  void loadImages()

  return () => {
    cancelled = true
    preloadedImage = null
    viewer.removeEventListener('click', handleClick)
    viewer.removeEventListener('touchstart', handleTouchStart)
    viewer.removeEventListener('touchend', handleTouchEnd)
    window.removeEventListener('keydown', handleKeyDown)
  }
}

async function loadCatImageUrls() {
  if (!storage) {
    throw new Error('Firebase Storage is not configured')
  }

  const catsFolder = ref(storage, 'cats')
  const result = await listAll(catsFolder)
  const imageItems = result.items.filter((item) => imageExtension.test(item.name))
  const urls = await Promise.all(
    imageItems.map(async (item) => {
      try {
        return await getDownloadURL(item)
      } catch {
        return null
      }
    }),
  )

  return urls.filter((url): url is string => Boolean(url))
}

function shuffledQueue(values: readonly string[], avoidFirst: string) {
  const shuffled = [...values]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const value = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = value
  }

  if (avoidFirst && shuffled.length > 1 && shuffled[0] === avoidFirst) {
    const swapIndex = shuffled.findIndex((url) => url !== avoidFirst)

    if (swapIndex > 0) {
      const value = shuffled[0]
      shuffled[0] = shuffled[swapIndex]
      shuffled[swapIndex] = value
    }
  }

  return shuffled
}

document.addEventListener('click', (event) => {
  if (!(event instanceof MouseEvent) || event.defaultPrevented) return
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  if (!(event.target instanceof Element)) return

  const link = event.target.closest<HTMLAnchorElement>('a[href^="/"]')

  if (!link || link.target) return

  const url = new URL(link.href)

  if (url.origin !== window.location.origin) return

  event.preventDefault()
  window.history.pushState({}, '', url.pathname)
  render()
})

if (!shouldRedirectToRomeo) {
  window.addEventListener('popstate', render)

  render()
}
