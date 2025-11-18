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
    vec2 centerUV = vec2(0.0, 0.0); // Center in UV space
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
    alpha = smoothstep(0.0, 0.3, alpha); // Enhance contrast
    alpha = min(alpha, 1.0); // Clamp to maximum 1.0
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

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

  // 이벤트 핸들러들을 useCallback으로 메모이제이션
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ctnDom.current) return;
    const rect = ctnDom.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    
    // Check if mouse is within bounds
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    } else {
      targetMouseActive.current = 0.0;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);

  const handleWindowBlur = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);

  const handleWindowFocus = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      targetMouseActive.current = 0.0;
    }
  }, []);

  const handleDocumentMouseLeave = useCallback(() => {
    targetMouseActive.current = 0.0;
  }, []);

  // uniforms 객체를 useMemo로 메모이제이션
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new Color(0, 0, 0) }, // 초기값, 나중에 업데이트
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
    
    // 사파리 호환성을 위한 WebGL 컨텍스트 체크
    if (!gl) {
      // WebGL not supported in this browser
      return;
    }

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }
    
    // 사파리 호환성을 위한 WebGL 확장 체크
    try {
      gl.getExtension('OES_standard_derivatives');
      gl.getExtension('WEBGL_depth_texture');
    } catch {
      // 사파리에서 일부 WebGL 확장이 지원되지 않는 경우 무시
      // Some WebGL extensions not supported
    }

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: uniforms,
    });

    // uniforms 참조 업데이트
    Object.keys(uniforms).forEach(key => {
      if (program.uniforms[key as keyof typeof program.uniforms]) {
        (program.uniforms as Record<string, unknown>)[key] = uniforms[key as keyof typeof uniforms];
      }
    });

    function resize() {
      // 사파리 호환성을 위한 devicePixelRatio 체크
      const scale = Math.min(window.devicePixelRatio || 1, 2); // 고해상도 지원하되 2배까지만
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      
      renderer.setSize(width * scale, height * scale);
      
      // 캔버스 스타일 크기 설정 (실제 표시 크기)
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
    // 캔버스 기본 스타일 설정
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
      // 사파리 호환성을 위한 WebGL 확장 체크
      try {
        const loseContext = gl.getExtension("WEBGL_lose_context");
        if (loseContext) {
          loseContext.loseContext();
        }
      } catch {
        // 사파리에서 WebGL 확장이 지원되지 않는 경우 무시
        // WebGL lose context extension not supported
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
