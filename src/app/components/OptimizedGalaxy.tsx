import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useRef, useEffect, useCallback, useMemo, memo } from 'react';
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;
const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
varying vec2 vUv;
#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0
float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}
float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}
float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}
vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5; 
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;
      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);
      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));
      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;
      col += star * size * color;
    }
  }
  return col;
}
void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);
  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0);
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }
  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;
  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }
  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;
/**
 * @interface GalaxyProps
 * @description 은하 배경 캔버스를 구성하는 설정 값입니다.
 * @property {[number, number]} [focal] 효과의 정규화된 초점 좌표.
 * @property {[number, number]} [rotation] 기본 회전 행렬 값.
 * @property {number} [starSpeed] 별 애니메이션 속도 배수.
 * @property {number} [density] 레이어당 별 밀도 배수.
 * @property {number} [hueShift] 전체 색상 스펙트럼에 적용할 색상 이동 값.
 * @property {boolean} [disableAnimation] 시간 기반 애니메이션을 비활성화할지 여부.
 * @property {number} [speed] 전역 애니메이션 속도 조절값.
 * @property {boolean} [mouseInteraction] 마우스 기반 패럴랙스 효과를 활성화할지 여부.
 * @property {number} [glowIntensity] 별의 광채 강도.
 * @property {number} [saturation] 색상 채도 배수.
 * @property {boolean} [mouseRepulsion] 커서 주변에서 반발 효과를 사용할지 여부.
 * @property {number} [twinkleIntensity] 별 깜박임 강도.
 * @property {number} [rotationSpeed] 자동 회전 속도 비율.
 * @property {number} [repulsionStrength] 마우스 반발력 강도.
 * @property {number} [autoCenterRepulsion] 캔버스 중심에서 적용할 반발력.
 * @property {boolean} [transparent] true일 때 캔버스를 투명 배경으로 렌더링할지 여부.
 */
interface GalaxyProps {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
}
/**
 * @component OptimizedGalaxy
 * @description OGL을 활용해 인터랙티브 은하 배경을 고성능으로 렌더링하는 캔버스 애니메이션입니다.
 * @param {GalaxyProps} props 은하 효과를 커스터마이징하는 옵션.
 * @returns {JSX.Element} WebGL 캔버스를 담는 컨테이너 div를 반환합니다.
 */
const OptimizedGalaxy = memo(function OptimizedGalaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.3,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  ...rest
}: GalaxyProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);
  /**
   * @function handleMouseMove
   * @description 컨테이너 내부의 포인터 위치를 추적해 셰이더 유니폼 값을 갱신합니다.
   * @param {MouseEvent} e 마우스 이동 이벤트.
   * @returns {void}
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ctnDom.current) return;
    const rect = ctnDom.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    } else {
      targetMouseActive.current = 0.0;
    }
  }, []);
  /**
   * @function handleMouseLeave
   * @description 커서가 컨테이너를 벗어나면 마우스 활성화 정도를 초기화합니다.
   * @returns {void}
   */
  const handleMouseLeave = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);
  /**
   * @function handleWindowBlur
   * @description 창 포커스를 잃었을 때 마우스 기반 효과를 비활성화합니다.
   * @returns {void}
   */
  const handleWindowBlur = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);
  /**
   * @function handleWindowFocus
   * @description 창이 다시 포커스를 얻으면 마우스 활성화 상태를 초기화합니다.
   * @returns {void}
   */
  const handleWindowFocus = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);
  /**
   * @function handleVisibilityChange
   * @description 문서가 숨겨지면 포인터 상호작용을 일시 중지합니다.
   * @returns {void}
   */
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      targetMouseActive.current = 0.0;
    }
  }, []);
  /**
   * @function handleDocumentMouseLeave
   * @description 포인터가 문서 바디를 벗어나면 마우스 활성화 상태를 초기화합니다.
   * @returns {void}
   */
  const handleDocumentMouseLeave = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new Color(0, 0, 0) }, 
    uFocal: { value: new Float32Array(focal) },
    uRotation: { value: new Float32Array(rotation) },
    uStarSpeed: { value: starSpeed },
    uDensity: { value: density },
    uHueShift: { value: hueShift },
    uSpeed: { value: speed },
    uMouse: { value: new Float32Array([0.5, 0.5]) },
    uGlowIntensity: { value: glowIntensity },
    uSaturation: { value: saturation },
    uMouseRepulsion: { value: mouseRepulsion },
    uTwinkleIntensity: { value: twinkleIntensity },
    uRotationSpeed: { value: rotationSpeed },
    uRepulsionStrength: { value: repulsionStrength },
    uMouseActiveFactor: { value: 0.0 },
    uAutoCenterRepulsion: { value: autoCenterRepulsion },
    uTransparent: { value: transparent },
  }), [
    focal,
    rotation,
    starSpeed,
    density,
    hueShift,
    speed,
    glowIntensity,
    saturation,
    mouseRepulsion,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    autoCenterRepulsion,
    transparent,
  ]);
  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false,
    });
    const gl = renderer.gl;
    if (!gl) {
      return;
    }
    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }
    try {
      gl.getExtension('OES_standard_derivatives');
      gl.getExtension('WEBGL_depth_texture');
    } catch {
    }
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: uniforms,
    });
    Object.keys(uniforms).forEach(key => {
      if (program.uniforms[key as keyof typeof program.uniforms]) {
        (program.uniforms as Record<string, unknown>)[key] = uniforms[key as keyof typeof uniforms];
      }
    });
    /**
     * @function resize
     * @description 캔버스 크기가 변할 때 렌더러와 유니폼 값을 재조정합니다.
     * @returns {void}
     */
    function resize() {
      const scale = Math.min(window.devicePixelRatio || 1, 2); 
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width * scale, height * scale);
      gl.canvas.style.width = width + 'px';
      gl.canvas.style.height = height + 'px';
      program.uniforms.uResolution.value = new Color(
        width * scale,
        height * scale,
        width / height
      );
    }
    window.addEventListener("resize", resize, false);
    resize();
    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;
    /**
     * @function update
     * @description 셰이더 유니폼을 갱신하고 매 프레임마다 장면을 렌더링합니다.
     * @param {number} t requestAnimationFrame 타임스탬프.
     * @returns {void}
     */
    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
        program.uniforms.uStarSpeed.value = (t * 0.001 * starSpeed) / 10.0;
      }
      const lerpFactor = 0.05;
      smoothMousePos.current.x +=
        (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y +=
        (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;
      smoothMouseActive.current +=
        (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;
      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;
      renderer.render({ scene: mesh });
    }
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.display = 'block';
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);
    if (mouseInteraction) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("focus", handleWindowFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.body.addEventListener("mouseleave", handleDocumentMouseLeave);
      ctn.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (mouseInteraction) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("blur", handleWindowBlur);
        window.removeEventListener("focus", handleWindowFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.body.removeEventListener("mouseleave", handleDocumentMouseLeave);
        ctn.removeEventListener("mouseleave", handleMouseLeave);
      }
      ctn.removeChild(gl.canvas);
      try {
        const loseContext = gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }
      } catch {
      }
    };
  }, [
    uniforms,
    disableAnimation,
    starSpeed,
    mouseInteraction,
    handleMouseMove,
    handleMouseLeave,
    handleWindowBlur,
    handleWindowFocus,
    handleVisibilityChange,
    handleDocumentMouseLeave,
    transparent,
  ]);
  return <div ref={ctnDom} className="w-full h-full relative" {...rest} />;
});
export default OptimizedGalaxy;
