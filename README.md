# 🎨 Portfolio Frontend (Next.js)

**Next.js 15 기반의 현대적이고 반응형 포트폴리오 프론트엔드 애플리케이션**

개인 포트폴리오 웹사이트를 위한 고성능, SEO 최적화된 Next.js 애플리케이션입니다. 정적 사이트 생성(SSG)을 지원하며, 관리자 대시보드, 블로그, 프로젝트 포트폴리오 등 완전한 기능을 제공합니다.

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [환경 설정](#-환경-설정)
- [페이지 구조](#-페이지-구조)
- [컴포넌트 시스템](#-컴포넌트-시스템)
- [API 통합](#-api-통합)
- [성능 최적화](#-성능-최적화)
- [SEO 최적화](#-seo-최적화)
- [배포](#-배포)
- [개발 가이드](#-개발-가이드)

## ✨ 주요 기능

### 🏠 **포트폴리오 홈페이지**

- ✅ 반응형 디자인 (모바일, 태블릿, 데스크톱)
- ✅ 인터랙티브 갤럭시 애니메이션
- ✅ 개인 정보 및 소셜 링크 표시
- ✅ 프로젝트 포트폴리오 갤러리
- ✅ 기술 스택 시각화

### 📝 **블로그 시스템**

- ✅ 블로그 포스트 목록 및 상세 페이지
- ✅ 마크다운 지원 및 구문 강조
- ✅ 태그 기반 분류 및 검색
- ✅ 반응형 블로그 레이아웃
- ✅ SEO 최적화된 블로그 포스트

### 🔐 **관리자 대시보드**

- ✅ JWT 기반 인증 시스템
- ✅ 블로그 포스트 관리 (CRUD)
- ✅ 프로젝트 포트폴리오 관리
- ✅ 연락처 메시지 관리
- ✅ 사이트 설정 관리
- ✅ 활동 로그 및 통계

### 📧 **연락처 시스템**

- ✅ 반응형 연락처 폼
- ✅ 실시간 유효성 검사
- ✅ 성공/에러 토스트 알림

### ⚡ **성능 최적화**

- ✅ 정적 사이트 생성 (SSG)
- ✅ 이미지 최적화 및 지연 로딩
- ✅ 코드 스플리팅 및 번들 최적화
- ✅ 캐싱 전략
- ✅ Core Web Vitals 최적화

## 🛠 기술 스택

### **Frontend Framework**

- **Next.js 15** - React 기반 풀스택 프레임워크
- **React 19** - 사용자 인터페이스 라이브러리
- **TypeScript** - 타입 안전성

### **스타일링**

- **Tailwind CSS 4** - 유틸리티 우선 CSS 프레임워크
- **Framer Motion** - 애니메이션 라이브러리
- **Lucide React** - 아이콘 라이브러리

### **상태 관리**

- **React Context** - 전역 상태 관리
- **Custom Hooks** - 로직 재사용

### **폼 및 유효성 검사**

- **React Hook Form** - 폼 관리
- **Custom Validation** - 유효성 검사

### **UI/UX**

- **React Hot Toast** - 토스트 알림
- **React Spring** - 애니메이션
- **Markdown Editor** - 마크다운 에디터

### **개발 도구**

- **ESLint** - 코드 품질 검사
- **TypeScript** - 타입 체킹
- **Turbopack** - 빠른 개발 서버

## 📁 프로젝트 구조

```
portfolio-next/
├── 📄 next.config.ts               # Next.js 설정
├── 📄 tailwind.config.js           # Tailwind CSS 설정
├── 📄 tsconfig.json                # TypeScript 설정
├── 📄 package.json                 # 프로젝트 의존성
│
├── 📁 public/                      # 정적 파일
│   ├── 📄 favicon.svg              # 파비콘
│   ├── 📄 robots.txt               # SEO 설정
│   └── 📄 sitemap.xml              # 사이트맵
│
├── 📁 src/
│   ├── 📁 app/                     # Next.js App Router
│   │   ├── 📄 layout.tsx           # 루트 레이아웃
│   │   ├── 📄 page.tsx             # 홈페이지
│   │   ├── 📄 globals.css          # 전역 스타일
│   │   │
│   │   ├── 📁 about/               # 소개 페이지
│   │   │   └── 📄 page.tsx
│   │   │
│   │   ├── 📁 blog/                # 블로그
│   │   │   ├── 📄 page.tsx         # 블로그 목록
│   │   │   └── 📁 post/
│   │   │       └── 📄 [slug]/
│   │   │           └── 📄 page.tsx # 블로그 포스트
│   │   │
│   │   ├── 📁 projects/            # 프로젝트
│   │   │   ├── 📄 page.tsx         # 프로젝트 목록
│   │   │   └── 📁 detail/
│   │   │       └── 📄 [id]/
│   │   │           └── 📄 page.tsx # 프로젝트 상세
│   │   │
│   │   ├── 📁 contact/             # 연락처
│   │   │   └── 📄 page.tsx
│   │   │
│   │   ├── 📁 admin/               # 관리자 대시보드
│   │   │   ├── 📄 layout.tsx       # 관리자 레이아웃
│   │   │   ├── 📄 page.tsx         # 대시보드
│   │   │   ├── 📁 blog/            # 블로그 관리
│   │   │   ├── 📁 projects/        # 프로젝트 관리
│   │   │   ├── 📁 contacts/        # 연락처 관리
│   │   │   └── ...                 # 기타 관리 페이지
│   │   │
│   │   └── 📁 components/          # 페이지별 컴포넌트
│   │       ├── 📄 ClientHome.tsx   # 홈페이지 클라이언트 컴포넌트
│   │       ├── 📄 LoadingSpinner.tsx
│   │       ├── 📄 OptimizedGalaxy.tsx # 갤럭시 애니메이션
│   │       └── 📄 ScrollProgress.tsx
│   │
│   ├── 📁 components/              # 재사용 가능한 컴포넌트
│   │   ├── 📄 Header.tsx           # 헤더
│   │   ├── 📄 Footer.tsx           # 푸터
│   │   ├── 📄 AuthGuard.tsx        # 인증 가드
│   │   ├── 📄 ConditionalLayout.tsx # 조건부 레이아웃
│   │   ├── 📄 ErrorBoundary.tsx    # 에러 바운더리
│   │   ├── 📄 LazyImage.tsx        # 지연 로딩 이미지
│   │   ├── 📄 OptimizedImage.tsx   # 최적화된 이미지
│   │   ├── 📄 Pagination.tsx       # 페이지네이션
│   │   └── 📄 ConfirmModal.tsx     # 확인 모달
│   │
│   ├── 📁 contexts/                # React Context
│   │   └── 📄 AdminContext.tsx     # 관리자 컨텍스트
│   │
│   ├── 📁 hooks/                   # Custom Hooks
│   │   ├── 📄 useApi.ts            # API 호출 훅
│   │   ├── 📄 useAuth.ts           # 인증 훅
│   │   ├── 📄 useDebounce.ts       # 디바운스 훅
│   │   ├── 📄 useForm.ts           # 폼 훅
│   │   ├── 📄 useIntersectionObserver.ts # 교차점 관찰 훅
│   │   └── 📄 useModal.ts          # 모달 훅
│   │
│   ├── 📁 lib/                     # 유틸리티 라이브러리
│   │   ├── 📄 api.ts               # API 클라이언트
│   │   └── 📄 seo.ts               # SEO 유틸리티
│   │
│   ├── 📁 types/                   # TypeScript 타입 정의
│   │   ├── 📄 blog.ts              # 블로그 타입
│   │   ├── 📄 common.ts            # 공통 타입
│   │   ├── 📄 project.ts           # 프로젝트 타입
│   │   ├── 📄 skill.ts             # 스킬 타입
│   │   ├── 📄 user.ts              # 사용자 타입
│   │   └── 📄 index.ts             # 타입 통합 export
│   │
│   └── 📁 utils/                   # 유틸리티 함수
│       ├── 📄 constants.ts         # 상수
│       ├── 📄 format.ts            # 포맷팅 함수
│       ├── 📄 markdown.ts          # 마크다운 처리
│       ├── 📄 performance.ts       # 성능 유틸리티
│       └── 📄 validation.ts        # 유효성 검사
│
└── 📁 out/                         # 정적 빌드 결과물
    └── 📄 *.html                   # 생성된 HTML 파일들
```

## 🚀 설치 및 실행

### **1. 저장소 클론**

```bash
git clone <repository-url>
cd portfolio-next
```

### **2. 의존성 설치**

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

### **3. 환경 변수 설정**

```bash
# .env.local 파일 생성
cp .env.example .env.local

# 환경 변수 설정
nano .env.local
```

### **4. 개발 서버 실행**

```bash
# 개발 모드 (Turbopack 사용)
npm run dev

# 또는
yarn dev
# 또는
pnpm dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### **5. 프로덕션 빌드**

```bash
# 정적 사이트 생성
npm run build

# 빌드 결과물은 out/ 디렉토리에 생성됩니다
```

## ⚙️ 환경 설정

### **필수 환경 변수**

```env
# API 서버 URL
NEXT_PUBLIC_API_URL=https://your-api-server.com/api

# 사이트 설정
NEXT_PUBLIC_SITE_URL=https://your-portfolio.com
NEXT_PUBLIC_SITE_NAME=포트폴리오
```

### **선택적 환경 변수**

```env
# 개발 도구
ANALYZE=true                    # 번들 분석기 활성화
NODE_ENV=development            # 환경 설정

# 성능 모니터링
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID  # Google Analytics
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX      # Google Tag Manager
```

## 📄 페이지 구조

### **🏠 공개 페이지**

| 페이지        | 경로                    | 설명                     |
| ------------- | ----------------------- | ------------------------ |
| 홈페이지      | `/`                     | 메인 포트폴리오 페이지   |
| 소개          | `/about`                | 개인 정보 및 소개        |
| 블로그        | `/blog`                 | 블로그 포스트 목록       |
| 블로그 포스트 | `/blog/post/[slug]`     | 개별 블로그 포스트       |
| 프로젝트      | `/projects`             | 프로젝트 포트폴리오 목록 |
| 프로젝트 상세 | `/projects/detail/[id]` | 프로젝트 상세 정보       |
| 연락처        | `/contact`              | 연락처 폼                |

### **🔐 관리자 페이지**

| 페이지        | 경로              | 설명               |
| ------------- | ----------------- | ------------------ |
| 관리자 로그인 | `/admin-login`    | 관리자 로그인      |
| 대시보드      | `/admin`          | 관리자 대시보드    |
| 블로그 관리   | `/admin/blog`     | 블로그 포스트 관리 |
| 프로젝트 관리 | `/admin/projects` | 프로젝트 관리      |
| 연락처 관리   | `/admin/contacts` | 연락처 메시지 관리 |
| 설정 관리     | `/admin/settings` | 사이트 설정        |
| 사용자 관리   | `/admin/users`    | 관리자 계정 관리   |

## 🧩 컴포넌트 시스템

### **재사용 가능한 컴포넌트**

#### **Header 컴포넌트**

```typescript
// 네비게이션, 다크모드 토글, 모바일 메뉴
<Header />
```

#### **Footer 컴포넌트**

```typescript
// 소셜 링크, 저작권 정보
<Footer />
```

#### **LazyImage 컴포넌트**

```typescript
// 지연 로딩 이미지
<LazyImage src="/image.jpg" alt="설명" width={800} height={600} />
```

#### **Pagination 컴포넌트**

```typescript
// 페이지네이션
<Pagination currentPage={1} totalPages={10} onPageChange={handlePageChange} />
```

### **관리자 전용 컴포넌트**

#### **AuthGuard 컴포넌트**

```typescript
// 인증 확인 및 리다이렉트
<AuthGuard>
  <AdminContent />
</AuthGuard>
```

#### **ConfirmModal 컴포넌트**

```typescript
// 확인 모달
<ConfirmModal
  isOpen={isModalOpen}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  title="정말 삭제하시겠습니까?"
/>
```

## 🔌 API 통합

### **API 클라이언트 설정**

```typescript
// src/lib/api.ts
const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL);

// 사용 예시
const blogPosts = await apiClient.blog.getPosts();
const projects = await apiClient.projects.getProjects();
```

### **API 훅 사용**

```typescript
// Custom Hook 사용
const { data: posts, loading, error } = useApi("blog/posts");
const { login, logout, user } = useAuth();
```

### **타입 안전성**

```typescript
// TypeScript 타입 정의
interface BlogPost {
  id: number;
  title: string;
  content: string;
  slug: string;
  is_published: boolean;
  created_at: string;
}
```

## ⚡ 성능 최적화

### **정적 사이트 생성 (SSG)**

```typescript
// next.config.ts
export const nextConfig = {
  output: "export", // 정적 사이트 생성
  trailingSlash: true, // URL 일관성
  compress: true, // 압축 활성화
};
```

### **이미지 최적화**

```typescript
// Next.js Image 컴포넌트 사용
import Image from "next/image";

<Image
  src="/hero-image.jpg"
  alt="Hero Image"
  width={1920}
  height={1080}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>;
```

### **코드 스플리팅**

```typescript
// 동적 import로 코드 스플리팅
const AdminDashboard = dynamic(() => import("@/components/AdminDashboard"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});
```

### **번들 최적화**

```typescript
// next.config.ts - 웹팩 최적화
webpack: (config) => {
  config.optimization.splitChunks = {
    chunks: "all",
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: "vendors",
        priority: 10,
      },
    },
  };
  return config;
};
```

## 🔍 SEO 최적화

### **메타데이터 설정**

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: "포트폴리오 | 웹 개발자",
  description: "웹 개발자 포트폴리오입니다.",
  keywords: "개발자,포트폴리오,웹개발",
  openGraph: {
    title: "승우 포트폴리오",
    description: "웹 개발자 포트폴리오",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "승우 포트폴리오",
    description: "웹 개발자 포트폴리오",
  },
};
```

### **동적 메타데이터**

```typescript
// app/blog/post/[slug]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featured_image],
    },
  };
}
```

### **사이트맵 생성**

```typescript
// app/sitemap.ts
export default async function sitemap() {
  const posts = await getBlogPosts();
  const projects = await getProjects();

  return [
    {
      url: "https://your-domain.com",
      lastModified: new Date(),
    },
    ...posts.map((post) => ({
      url: `https://your-domain.com/blog/post/${post.slug}`,
      lastModified: new Date(post.updated_at),
    })),
    ...projects.map((project) => ({
      url: `https://your-domain.com/projects/detail/${project.id}`,
      lastModified: new Date(project.updated_at),
    })),
  ];
}
```

## 🚀 배포

### **정적 사이트 배포**

```bash
# 빌드
npm run build

# out/ 디렉토리의 파일들을 웹 서버에 업로드
# (Nginx, Apache, Vercel, Netlify 등)
```

### **Vercel 배포 (권장)**

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경 변수 설정
vercel env add NEXT_PUBLIC_API_URL
```

### **Docker 배포**

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 👨‍💻 개발 가이드

### **개발 환경 설정**

```bash
# TypeScript 타입 체킹
npm run type-check

# ESLint 실행
npm run lint

# 코드 포맷팅
npm run format
```

### **컴포넌트 개발**

```typescript
// 새 컴포넌트 생성 시
// 1. TypeScript 인터페이스 정의
interface ComponentProps {
  title: string;
  children: React.ReactNode;
}

// 2. 컴포넌트 구현
export default function Component({ title, children }: ComponentProps) {
  return (
    <div className="component-container">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### **API 통합**

```typescript
// 새 API 엔드포인트 추가 시
// 1. 타입 정의 (types/ 디렉토리)
interface NewDataType {
  id: number;
  name: string;
}

// 2. API 클라이언트 메서드 추가 (lib/api.ts)
class ApiClient {
  async getNewData(): Promise<ApiResponse<NewDataType[]>> {
    return this.request<NewDataType[]>("/new-endpoint");
  }
}

// 3. Custom Hook 생성 (hooks/ 디렉토리)
export function useNewData() {
  return useApi<NewDataType[]>("new-endpoint");
}
```

### **성능 모니터링**

```typescript
// Core Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  // Google Analytics 또는 다른 분석 도구로 전송
  gtag("event", metric.name, {
    value: Math.round(metric.value),
    event_category: "Web Vitals",
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 🔧 문제 해결

### **일반적인 문제들**

#### **1. 빌드 에러**

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# TypeScript 에러 확인
npm run type-check
```

#### **2. 이미지 최적화 에러**

```typescript
// next.config.ts에서 이미지 최적화 비활성화 (정적 export용)
images: {
  unoptimized: true,
}
```

#### **3. API 연결 에러**

```typescript
// 환경 변수 확인
console.log(process.env.NEXT_PUBLIC_API_URL);

// CORS 설정 확인 (백엔드)
```

## 📊 성능 지표

### **목표 지표**

- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8초
- **TTFB (Time to First Byte)**: < 800ms

### **번들 크기**

- **초기 로드**: < 250KB (gzipped)
- **관리자 페이지**: < 500KB (gzipped)
- **이미지 최적화**: WebP/AVIF 포맷 사용

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 지원

- **이메일**: support@portfolio.com
- **이슈 트래커**: GitHub Issues
- **문서**: [Wiki](https://github.com/your-repo/wiki)

---

**⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**

---

## 📚 추가 문서

- [🔐 관리자 시스템 가이드](../portfolio-server/ADMIN_GUIDE.md)
- [🚀 백엔드 API 문서](../portfolio-server/README.md)
- [📊 배포 가이드](../portfolio-server/DEPLOYMENT_GUIDE.md)

## 🔄 버전 히스토리

- **v2.1.0** - Next.js 15 업그레이드, 성능 최적화
- **v2.0.0** - 관리자 대시보드, TypeScript 전환
- **v1.0.0** - 기본 포트폴리오 사이트
