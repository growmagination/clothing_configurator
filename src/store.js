import { proxy } from 'valtio'

const state = proxy({
  intro: true,
  logo: 'logo_growm+tagline_colour_retina.webp',
  colors: ['#ccc', '#EFBD4E', '#80C670', '#726DE8', '#EF674E', '#353934'],
  decals: ['react', 'three2', 'pmndrs'],
  color: '#EFBD4E',
  decal: 'three2',
  decalPosition: { x: 0, y: 0.04 },
  decalScale: 0.15,
  decalRotation: 0,
  customDecal: null,
  customDecalAspect: 1
})

export { state }
