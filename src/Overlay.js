import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { AiFillCamera, AiOutlineArrowLeft, AiOutlineHighlight, AiOutlineShopping, AiOutlineUpload } from 'react-icons/ai'
import { useSnapshot } from 'valtio'
import { state } from './store'

export function Overlay() {
  const snap = useSnapshot(state)
  const headerRef = useRef(null)
  const mainSectionRef = useRef(null)
  const customSectionRef = useRef(null)

  useGSAP(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -100 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
    }
  }, { dependencies: [] })

  useGSAP(() => {
    if (snap.intro && mainSectionRef.current) {
      gsap.fromTo(
        mainSectionRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
    } else if (!snap.intro && customSectionRef.current) {
      gsap.fromTo(
        customSectionRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      )
    }
  }, { dependencies: [snap.intro] })

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <header ref={headerRef}>
        <img src={snap.logo} alt="logo" width="200" height="auto" />
      </header>
      {snap.intro ? (
        <section ref={mainSectionRef}>
          <div className="section--container">
            <div className="title-gsap">
              <h1>LET'S DO IT.</h1>
            </div>
            <div className="support--content">
              <div className="desc-gsap">
                <p>
                  Create your unique and exclusive shirt with our brand-new 3D customization tool. <strong>Unleash your imagination</strong> and define your
                  own style.
                </p>
                <button style={{ background: snap.color }} onClick={() => (state.intro = false)}>
                  CUSTOMIZE IT <AiOutlineHighlight size="1.3em" />
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section ref={customSectionRef}>
          <Customizer />
        </section>
      )}
    </div>
  )
}

function Customizer() {
  const snap = useSnapshot(state)
  // Handler for file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'image/png' || file.type === 'image/webp')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new window.Image()
        img.onload = () => {
          state.customDecal = event.target.result
          state.decal = 'custom'
          state.customDecalAspect = img.width / img.height
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please upload a PNG or WEBP file.')
    }
  }

  // Draggable dot for decal position
  const boxSize = 120
  const dotSize = 20
  const boxRef = useRef(null)

  // Set your desired limits
  const minX = -0.2, maxX = 0.2;
  const minY = -0.3, maxY = 0.2;

  // Convert decalPosition [minX,maxX] to px in box
  const getDotPosition = () => {
    const x = ((snap.decalPosition.x - minX) / (maxX - minX)) * (boxSize - dotSize);
    const y = ((1 - (snap.decalPosition.y - minY) / (maxY - minY))) * (boxSize - dotSize);
    return { left: x, top: y };
  };

  // Handle drag
  const handleBoxPointerDown = (e) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const dotPos = getDotPosition();
    const offsetX = startX - (rect.left + dotPos.left + dotSize / 2);
    const offsetY = startY - (rect.top + dotPos.top + dotSize / 2);

    function onPointerMove(ev) {
      const x = ev.clientX - rect.left - offsetX - dotSize / 2;
      const y = ev.clientY - rect.top - offsetY - dotSize / 2;
      // Clamp to box
      const clampedX = Math.max(0, Math.min(x, boxSize - dotSize));
      const clampedY = Math.max(0, Math.min(y, boxSize - dotSize));
      // Map to [minX,maxX] and [minY,maxY]
      const newX = (clampedX / (boxSize - dotSize)) * (maxX - minX) + minX;
      const newY = (1 - clampedY / (boxSize - dotSize)) * (maxY - minY) + minY;
      state.decalPosition.x = newX;
      state.decalPosition.y = newY;
    }
    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const dotPos = getDotPosition();

  // Custom slider logic for scale and rotation
  const sliderWidth = boxSize
  const thumbSize = 18

  // Helper for mapping value to px and px to value
  function valueToPx(value, min, max) {
    return ((value - min) / (max - min)) * (sliderWidth - thumbSize)
  }
  function pxToValue(px, min, max) {
    return (px / (sliderWidth - thumbSize)) * (max - min) + min
  }

  // State for rotation thumb interaction
  const [rotThumbActive, setRotThumbActive] = useState(false)
  const [rotThumbVisible, setRotThumbVisible] = useState(false)
  const rotFadeTimeout = useRef(null)
  // State for scale thumb interaction
  const [scaleThumbActive, setScaleThumbActive] = useState(false)
  const [scaleThumbVisible, setScaleThumbVisible] = useState(false)
  const scaleFadeTimeout = useRef(null)

  // Show/hide logic for rotation value (must be defined before use)
  const showRotationValue = () => {
    if (rotFadeTimeout.current) clearTimeout(rotFadeTimeout.current)
    setRotThumbActive(true)
    setRotThumbVisible(true)
  }
  const hideRotationValue = () => {
    setRotThumbActive(false)
    if (rotFadeTimeout.current) clearTimeout(rotFadeTimeout.current)
    setRotThumbVisible(false)
  }
  // Show/hide logic for scale value
  const showScaleValue = () => {
    if (scaleFadeTimeout.current) clearTimeout(scaleFadeTimeout.current)
    setScaleThumbActive(true)
    setScaleThumbVisible(true)
  }
  const hideScaleValue = () => {
    setScaleThumbActive(false)
    if (scaleFadeTimeout.current) clearTimeout(scaleFadeTimeout.current)
    setScaleThumbVisible(false)
  }

  // Drag logic for scale
  const scaleMin = 0.05, scaleMax = 0.5
  const scalePx = valueToPx(snap.decalScale, scaleMin, scaleMax)
  const scaleTrackRef = useRef(null)
  const handleScalePointerDown = (e) => {
    showScaleValue()
    const track = scaleTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    function onPointerMove(ev) {
      let x = ev.clientX - rect.left - thumbSize / 2
      x = Math.max(0, Math.min(x, sliderWidth - thumbSize))
      state.decalScale = parseFloat(pxToValue(x, scaleMin, scaleMax).toFixed(3))
    }
    function onPointerUp() {
      hideScaleValue()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // Drag logic for rotation
  const rotMin = -3.14, rotMax = 3.14
  const rotPx = valueToPx(snap.decalRotation, rotMin, rotMax)
  const rotTrackRef = useRef(null)
  const handleRotPointerDown = (e) => {
    showRotationValue()
    const track = rotTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    function onPointerMove(ev) {
      let x = ev.clientX - rect.left - thumbSize / 2
      x = Math.max(0, Math.min(x, sliderWidth - thumbSize))
      state.decalRotation = parseFloat(pxToValue(x, rotMin, rotMax).toFixed(3))
    }
    function onPointerUp() {
      hideRotationValue()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  return (
    <div className="customizer">
      <div className="color-options">
        {snap.colors.map((color) => (
          <div key={color} className={`circle`} style={{ background: color }} onClick={() => (state.color = color)}></div>
        ))}
      </div>
      <div className="decals">
        <div className="decals--container">
          {snap.decals.map((decal) => (
            <div key={decal} className={`decal`} onClick={() => (state.decal = decal)}>
              <img src={decal + '_thumb.png'} alt="brand" />
            </div>
          ))}
          {/* Upload icon/button */}
          <label className="decal upload" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <AiOutlineUpload size={24} />
            <input
              type="file"
              accept="image/png, image/webp"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>
        </div>
        <div style={{ marginTop: 30, width: boxSize }}>
          <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: 4 }}>Logo Position</label>
          <div
            ref={boxRef}
            style={{
              width: boxSize,
              height: boxSize,
              background: 'rgba(255,255,255,0.1)',
              border: '1.5px solid rgba(80,80,80,0.18)',
              borderRadius: 12,
              position: 'relative',
              marginBottom: 16,
              touchAction: 'none',
              userSelect: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #0001',
              overflow: 'hidden',
            }}
            onPointerDown={handleBoxPointerDown}
          >
            {/* Faint grid using absolutely positioned divs */}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <div key={'v'+i} style={{
                position: 'absolute',
                left: `${frac * 100}%`,
                top: 0,
                width: 1,
                height: '100%',
                background: 'rgba(80,80,80,0.10)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            ))}
            {[0.25, 0.5, 0.75].map((frac, i) => (
              <div key={'h'+i} style={{
                position: 'absolute',
                top: `${frac * 100}%`,
                left: 0,
                width: '100%',
                height: 1,
                background: 'rgba(80,80,80,0.10)',
                pointerEvents: 'none',
                zIndex: 1,
              }} />
            ))}
            <div
              style={{
                position: 'absolute',
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                background: snap.color,
                border: '2px solid #fff',
                boxShadow: '0 2px 8px #0002',
                left: dotPos.left,
                top: dotPos.top,
                cursor: 'grab',
                zIndex: 2,
                transition: 'background 0.2s',
              }}
            />
          </div>
          <label style={{ display: 'block', fontSize: '0.8rem', margin: '12px 0 4px 0' }}>Scale</label>
          <div
            ref={scaleTrackRef}
            style={{
              width: sliderWidth,
              height: 8,
              background: 'rgba(80,80,80,0.20)',
              borderRadius: 4,
              position: 'relative',
              margin: '8px 0 16px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onPointerDown={handleScalePointerDown}
          >
            <div
              style={{
                position: 'absolute',
                left: scalePx,
                top: -5,
                width: thumbSize,
                height: thumbSize,
                borderRadius: '50%',
                background: snap.color,
                border: '2px solid #fff',
                boxShadow: '0 2px 8px #0002',
                cursor: 'grab',
                zIndex: 2,
                transition: 'background 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={showScaleValue}
              onMouseLeave={hideScaleValue}
            />
            <span
              style={{
                position: 'absolute',
                right: -48,
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 700,
                color: '#222',
                fontSize: 15,
                background: 'none',
                borderRadius: 6,
                padding: '2px 10px',
                pointerEvents: 'none',
                zIndex: 3,
                opacity: scaleThumbVisible ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            >
              {snap.decalScale.toFixed(2)}
            </span>
          </div>
          <label style={{ display: 'block', fontSize: '0.8rem', margin: '12px 0 4px 0' }}>Rotation</label>
          <div
            ref={rotTrackRef}
            style={{
              width: sliderWidth,
              height: 8,
              background: 'rgba(80,80,80,0.20)',
              borderRadius: 4,
              position: 'relative',
              margin: '8px 0 16px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onPointerDown={handleRotPointerDown}
          >
            <div
              style={{
                position: 'absolute',
                left: rotPx,
                top: -5,
                width: thumbSize,
                height: thumbSize,
                borderRadius: '50%',
                background: snap.color,
                border: '2px solid #fff',
                boxShadow: '0 2px 8px #0002',
                cursor: 'grab',
                zIndex: 2,
                transition: 'background 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={showRotationValue}
              onMouseLeave={hideRotationValue}
            />
            {/* Show rotation value at right end when active */}
            <span
              style={{
                position: 'absolute',
                right: -48,
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 700,
                color: '#222',
                fontSize: 15,
                background: 'none',
                borderRadius: 6,
                padding: '2px 10px',
                pointerEvents: 'none',
                zIndex: 3,
                opacity: rotThumbVisible ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            >
              {`${Math.round((snap.decalRotation * 180) / Math.PI)}°`}
            </span>
          </div>
        </div>
      </div>
      <button
        className="share"
        style={{ background: snap.color }}
        onClick={() => {
          const link = document.createElement('a')
          link.setAttribute('download', 'canvas.png')
          link.setAttribute('href', document.querySelector('canvas').toDataURL('image/png').replace('image/png', 'image/octet-stream'))
          link.click()
        }}>
        DOWNLOAD
        <AiFillCamera size="1.3em" />
      </button>
      <button className="exit" style={{ background: snap.color }} onClick={() => (state.intro = true)}>
        GO BACK
        <AiOutlineArrowLeft size="1.3em" />
      </button>
    </div>
  )
}
